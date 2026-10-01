import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

// Colunas DATE voltam como texto "YYYY-MM-DD" (o front trabalha com esse formato).
pg.types.setTypeParser(1082, (v) => v);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export let pool;

// Abre o pool de conexões e garante que as tabelas existem.
export async function conectar(connectionString) {
  pool = new pg.Pool({ connectionString });
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  await semearManual();
}

// Importa o manual de liderança (13 capítulos) na primeira subida, se a tabela estiver vazia.
async function semearManual() {
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM manual_capitulos');
  if (rows[0].n > 0) return;
  const capitulos = JSON.parse(fs.readFileSync(path.join(__dirname, 'manual-inicial.json'), 'utf8'));
  for (const c of capitulos) {
    await pool.query(
      `INSERT INTO manual_capitulos (ordem, titulo, icone, acento, compromisso, texto, pontos, ref, alerta)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
      [c.cap, c.titulo, c.icone || null, c.acento || null, !!c.compromisso, c.texto || '', JSON.stringify(c.pontos || []), c.ref || null, c.alerta || null]
    );
  }
}

// Tabelas acessíveis pela API genérica /api/db.
//  dono:     coluna que guarda o id do usuário dono da linha
//  via:      tabela filha — a posse é verificada pela tabela pai
//  global:   linhas com dono nulo são visíveis (somente leitura) para todos
//  conflito: colunas usadas no ON CONFLICT do upsert
export const TABELAS = {
  profiles: {
    colunas: ['id', 'nome_grupo', 'nome_lider', 'celular', 'data_nascimento', 'culto', 'senib'],
    dono: 'id',
    conflito: ['id'],
    datas: ['data_nascimento'],
  },
  membros: {
    colunas: ['id', 'lider_id', 'nome', 'contato1', 'contato2', 'aniversario', 'linguagem_amor', 'ministerio', 'faixa', 'data_entrada', 'contato_pais', 'notas', 'status', 'faltas', 'treinando', 'batizado', 'um_com_deus', 'culto', 'senib', 'criado_em'],
    dono: 'lider_id',
    datas: ['aniversario', 'data_entrada'],
  },
  reunioes: {
    colunas: ['id', 'lider_id', 'data', 'tema', 'lanche', 'lanche_equipe', 'oracoes', 'criado_em'],
    dono: 'lider_id',
    datas: ['data'],
    embutir: {
      reuniao_presencas: { fk: 'reuniao_id', colunas: ['id', 'reuniao_id', 'membro_id'] },
      reuniao_ausencias: { fk: 'reuniao_id', colunas: ['id', 'reuniao_id', 'membro_id', 'motivo', 'sem_justificativa'] },
    },
  },
  reuniao_presencas: {
    colunas: ['id', 'reuniao_id', 'membro_id'],
    via: { tabela: 'reunioes', fk: 'reuniao_id', dono: 'lider_id' },
  },
  reuniao_ausencias: {
    colunas: ['id', 'reuniao_id', 'membro_id', 'motivo', 'sem_justificativa'],
    via: { tabela: 'reunioes', fk: 'reuniao_id', dono: 'lider_id' },
  },
  equipes_lanche: {
    colunas: ['id', 'lider_id', 'nome', 'membros_ids', 'inclui_lider', 'criado_em'],
    dono: 'lider_id',
    json: ['membros_ids'],
  },
  oracao_pedidos: {
    colunas: ['id', 'lider_id', 'membro_id', 'membro_nome', 'texto', 'respondido', 'status', 'reuniao_id', 'criado_em'],
    dono: 'lider_id',
  },
  treinandos: {
    colunas: ['id', 'lider_id', 'nome', 'data_inicio'],
    dono: 'lider_id',
    datas: ['data_inicio'],
  },
  historico_tamanho: {
    colunas: ['id', 'lider_id', 'mes', 'total'],
    dono: 'lider_id',
    conflito: ['lider_id', 'mes'],
  },
  eventos: {
    colunas: ['id', 'lider_id', 'titulo', 'data', 'local', 'tipo', 'descricao', 'precisa_aprovacao', 'participantes', 'lideres_confirmados', 'lideres_nomes', 'checklist_marcados', 'comprovante', 'status', 'aprovacao_status', 'aprovacao_obs', 'aprovacao_em', 'criado_em'],
    // A decisão pastoral só pode ser gravada pelo pastor (rotas /api/pastor), nunca pelo líder.
    somenteLeitura: ['aprovacao_status', 'aprovacao_obs', 'aprovacao_em'],
    dono: 'lider_id',
    datas: ['data'],
    json: ['checklist_marcados', 'lideres_nomes'],
  },
  banco_temas: {
    colunas: ['id', 'lider_id', 'titulo', 'emoji', 'cor', 'compartilhado'],
    dono: 'lider_id',
    global: true,
  },
  banco_recursos: {
    colunas: ['id', 'lider_id', 'tipo', 'conteudo', 'referencia', 'temas', 'titulo', 'semana', 'versiculo_base', 'periodo_semanas', 'nome_arquivo', 'tipo_arquivo', 'criado_em'],
    dono: 'lider_id',
    global: true,
    json: ['temas'],
  },
};
