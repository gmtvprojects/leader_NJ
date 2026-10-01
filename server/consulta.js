import { pool, TABELAS } from './db.js';

class ErroConsulta extends Error {
  constructor(message, code = 'REQUISICAO_INVALIDA') {
    super(message);
    this.code = code;
  }
}

const ident = (nome) => `"${nome}"`;

function validarColuna(cfg, coluna) {
  if (typeof coluna !== 'string' || !cfg.colunas.includes(coluna)) {
    throw new ErroConsulta(`Coluna inválida: ${coluna}`);
  }
  return coluna;
}

// Cláusula que restringe as linhas ao usuário autenticado ($1).
function clausulaDono(cfg, { incluirGlobais = false } = {}) {
  if (cfg.via) {
    const { tabela, fk, dono } = cfg.via;
    return `${ident(fk)} IN (SELECT id FROM ${ident(tabela)} WHERE ${ident(dono)} = $1)`;
  }
  if (incluirGlobais && cfg.global) {
    return `(${ident(cfg.dono)} = $1 OR ${ident(cfg.dono)} IS NULL)`;
  }
  return `${ident(cfg.dono)} = $1`;
}

function montarFiltros(cfg, filtros, params) {
  return (filtros || []).map((f) => {
    validarColuna(cfg, f.field);
    params.push(f.val);
    return `${ident(f.field)} = $${params.length}`;
  });
}

function normalizarValor(cfg, coluna, valor) {
  if (valor === undefined) return undefined;
  if (cfg.datas?.includes(coluna) && valor === '') return null;
  if (cfg.json?.includes(coluna) && valor !== null) return JSON.stringify(valor);
  return valor;
}

// Extrai do payload apenas as colunas permitidas, já normalizadas.
function extrairColunas(cfg, linha, ignorar = []) {
  const saida = {};
  for (const coluna of cfg.colunas) {
    if (ignorar.includes(coluna) || cfg.somenteLeitura?.includes(coluna)) continue;
    const valor = normalizarValor(cfg, coluna, linha?.[coluna]);
    if (valor !== undefined) saida[coluna] = valor;
  }
  return saida;
}

// "*, reuniao_presencas(membro_id)" -> { colunas: '*', embutidos: [{ nome, colunas }] }
function interpretarSelect(cfg, select) {
  const embutidos = [];
  const semEmbutidos = String(select || '*').replace(/(\w+)\(([^)]*)\)/g, (_, nome, cols) => {
    embutidos.push({ nome, colunas: cols.split(',').map((c) => c.trim()).filter(Boolean) });
    return '';
  });
  const partes = semEmbutidos.split(',').map((c) => c.trim()).filter(Boolean);
  const colunas = partes.length === 0 || partes.includes('*')
    ? '*'
    : partes.map((c) => ident(validarColuna(cfg, c))).join(', ');
  return { colunas, embutidos };
}

async function anexarEmbutidos(cfg, linhas, embutidos) {
  for (const { nome, colunas } of embutidos) {
    const def = cfg.embutir?.[nome];
    if (!def) throw new ErroConsulta(`Relação inválida: ${nome}`);
    colunas.forEach((c) => {
      if (!def.colunas.includes(c)) throw new ErroConsulta(`Coluna inválida: ${c}`);
    });
    const ids = linhas.map((l) => l.id).filter(Boolean);
    const { rows } = ids.length
      ? await pool.query(
          `SELECT ${[def.fk, ...colunas].map(ident).join(', ')} FROM ${ident(nome)} WHERE ${ident(def.fk)} = ANY($1::uuid[])`,
          [ids]
        )
      : { rows: [] };
    for (const linha of linhas) {
      linha[nome] = rows
        .filter((r) => r[def.fk] === linha.id)
        .map((r) => Object.fromEntries(colunas.map((c) => [c, r[c]])));
    }
  }
}

async function selecionar(userId, tabela, cfg, q) {
  const { colunas, embutidos } = interpretarSelect(cfg, q.select);
  const params = [userId];
  const where = [clausulaDono(cfg, { incluirGlobais: true }), ...montarFiltros(cfg, q.filters, params)];
  let sql = `SELECT ${colunas} FROM ${ident(tabela)} WHERE ${where.join(' AND ')}`;
  if (q.order) {
    sql += ` ORDER BY ${ident(validarColuna(cfg, q.order.field))} ${q.order.ascending === false ? 'DESC' : 'ASC'}`;
  }
  if (q.limit != null) {
    params.push(Math.max(0, parseInt(q.limit, 10) || 0));
    sql += ` LIMIT $${params.length}`;
  }
  const { rows } = await pool.query(sql, params);
  await anexarEmbutidos(cfg, rows, embutidos);
  return rows;
}

// Garante que as linhas-pai referenciadas pertencem ao usuário (tabelas filhas).
async function verificarPais(userId, cfg, linhas) {
  const { tabela, fk, dono } = cfg.via;
  const ids = [...new Set(linhas.map((l) => l[fk]))];
  if (ids.some((id) => !id)) throw new ErroConsulta(`Campo obrigatório: ${fk}`);
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM ${ident(tabela)} WHERE id = ANY($1::uuid[]) AND ${ident(dono)} = $2`,
    [ids, userId]
  );
  if (rows[0].n !== ids.length) throw new ErroConsulta('Acesso negado.', 'ACESSO_NEGADO');
}

async function inserir(userId, tabela, cfg, q, { upsert = false } = {}) {
  const entrada = Array.isArray(q.payload) ? q.payload : [q.payload];
  if (entrada.length === 0 || entrada.some((l) => !l || typeof l !== 'object')) {
    throw new ErroConsulta('Dados ausentes.');
  }
  if (upsert && !cfg.conflito) throw new ErroConsulta(`Upsert não suportado em ${tabela}.`);

  const linhas = entrada.map((l) => {
    const linha = extrairColunas(cfg, l);
    if (linha.id == null) delete linha.id;
    if (cfg.dono) linha[cfg.dono] = userId;
    return linha;
  });
  if (cfg.via) await verificarPais(userId, cfg, linhas);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = [];
    for (const linha of linhas) {
      const colunas = Object.keys(linha);
      const valores = colunas.map((c) => linha[c]);
      let sql = `INSERT INTO ${ident(tabela)} (${colunas.map(ident).join(', ')}) VALUES (${colunas.map((_, i) => `$${i + 1}`).join(', ')})`;
      if (upsert) {
        const atualizar = colunas.filter((c) => c !== 'id' && !cfg.conflito.includes(c));
        sql += ` ON CONFLICT (${cfg.conflito.map(ident).join(', ')}) DO `;
        sql += atualizar.length
          ? `UPDATE SET ${atualizar.map((c) => `${ident(c)} = EXCLUDED.${ident(c)}`).join(', ')}`
          : 'NOTHING';
      }
      sql += ' RETURNING *';
      const { rows } = await client.query(sql, valores);
      resultado.push(...rows);
    }
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function atualizar(userId, tabela, cfg, q) {
  if (!q.filters?.length) throw new ErroConsulta('Atualização sem filtro não é permitida.');
  const protegidas = ['id', cfg.dono, cfg.via?.fk].filter(Boolean);
  const mudancas = extrairColunas(cfg, q.payload, protegidas);
  const colunas = Object.keys(mudancas);
  if (colunas.length === 0) throw new ErroConsulta('Nenhum campo para atualizar.');

  const params = [userId];
  const set = colunas.map((c) => {
    params.push(mudancas[c]);
    return `${ident(c)} = $${params.length}`;
  });
  const where = [clausulaDono(cfg), ...montarFiltros(cfg, q.filters, params)];
  const { rows } = await pool.query(
    `UPDATE ${ident(tabela)} SET ${set.join(', ')} WHERE ${where.join(' AND ')} RETURNING *`,
    params
  );
  return rows;
}

async function remover(userId, tabela, cfg, q) {
  if (!q.filters?.length) throw new ErroConsulta('Exclusão sem filtro não é permitida.');
  const params = [userId];
  const where = [clausulaDono(cfg), ...montarFiltros(cfg, q.filters, params)];
  await pool.query(`DELETE FROM ${ident(tabela)} WHERE ${where.join(' AND ')}`, params);
  return null;
}

// Executa uma consulta vinda do front. Retorna { status, corpo: { data, error } }.
export async function executarConsulta(userId, q) {
  try {
    const cfg = TABELAS[q?.table];
    if (!cfg) throw new ErroConsulta(`Tabela inválida: ${q?.table}`);

    let linhas;
    switch (q.action) {
      case 'select': linhas = await selecionar(userId, q.table, cfg, q); break;
      case 'insert': linhas = await inserir(userId, q.table, cfg, q); break;
      case 'upsert': linhas = await inserir(userId, q.table, cfg, q, { upsert: true }); break;
      case 'update': linhas = await atualizar(userId, q.table, cfg, q); break;
      case 'delete': linhas = await remover(userId, q.table, cfg, q); break;
      default: throw new ErroConsulta(`Ação inválida: ${q.action}`);
    }

    if (linhas && (q.single || q.maybeSingle)) {
      if (linhas.length === 0 && q.single) {
        return { status: 200, corpo: { data: null, error: { message: 'Registro não encontrado.', code: 'PGRST116' } } };
      }
      return { status: 200, corpo: { data: linhas[0] ?? null, error: null } };
    }
    return { status: 200, corpo: { data: linhas, error: null } };
  } catch (err) {
    if (err instanceof ErroConsulta) {
      return { status: err.code === 'ACESSO_NEGADO' ? 403 : 400, corpo: { data: null, error: { message: err.message, code: err.code } } };
    }
    // Erros de dados do Postgres (classes 22 e 23): valor inválido, violação de restrição etc.
    if (typeof err.code === 'string' && /^(22|23)/.test(err.code)) {
      return { status: 400, corpo: { data: null, error: { message: 'Dados inválidos para esta operação.', code: err.code } } };
    }
    console.error('Erro na consulta:', err);
    return { status: 500, corpo: { data: null, error: { message: 'Erro interno do servidor.', code: 'ERRO_INTERNO' } } };
  }
}
