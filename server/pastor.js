// Rotas do perfil Pastor (/api/pastor/*). Só usuários com papel = 'pastor' acessam.
// O pastor enxerga os dados de todos os líderes; a API genérica /api/db continua restrita ao dono de cada linha.
import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

const jsonBody = express.json({ limit: '2mb' });

export async function exigirPastor(req, res, next) {
  try {
    const { rows } = await pool.query('SELECT papel FROM usuarios WHERE id = $1', [req.userId]);
    if (rows[0]?.papel !== 'pastor') {
      return res.status(403).json({ data: null, error: { message: 'Acesso restrito ao perfil Pastor.', code: 'ACESSO_NEGADO' } });
    }
    next();
  } catch (err) {
    console.error('Erro ao validar o perfil Pastor:', err);
    res.status(500).json({ data: null, error: { message: 'Erro interno do servidor.' } });
  }
}

const erro = (res, status, message) => res.status(status).json({ data: null, error: { message } });

export function rotasPastor() {
  const router = express.Router();

  // Todos os dados necessários para o painel, líderes, membros, eventos e pedidos.
  router.get('/dados', async (_req, res) => {
    try {
      const [lideres, membros, reunioes, eventos, pedidos] = await Promise.all([
        pool.query(
          `SELECT u.id, u.email, u.criado_em, p.nome_grupo, p.nome_lider, p.celular, p.culto, p.senib
             FROM usuarios u LEFT JOIN profiles p ON p.id = u.id
            WHERE u.papel = 'lider'
            ORDER BY lower(coalesce(p.nome_lider, p.nome_grupo, u.email))`
        ),
        pool.query(
          `SELECT m.* FROM membros m JOIN usuarios u ON u.id = m.lider_id WHERE u.papel = 'lider'`
        ),
        pool.query(
          `SELECT r.id, r.lider_id, r.data, r.tema, r.lanche_equipe,
                  (SELECT count(*)::int FROM reuniao_presencas WHERE reuniao_id = r.id) AS presentes,
                  (SELECT count(*)::int FROM reuniao_ausencias WHERE reuniao_id = r.id) AS ausencias
             FROM reunioes r JOIN usuarios u ON u.id = r.lider_id
            WHERE u.papel = 'lider'
            ORDER BY r.data DESC`
        ),
        pool.query(
          `SELECT e.* FROM eventos e JOIN usuarios u ON u.id = e.lider_id WHERE u.papel = 'lider' ORDER BY e.data DESC NULLS LAST`
        ),
        pool.query(
          `SELECT o.* FROM oracao_pedidos o JOIN usuarios u ON u.id = o.lider_id WHERE u.papel = 'lider' ORDER BY o.criado_em DESC`
        ),
      ]);
      res.json({
        data: {
          lideres: lideres.rows,
          membros: membros.rows,
          reunioes: reunioes.rows,
          eventos: eventos.rows,
          pedidos: pedidos.rows,
        },
        error: null,
      });
    } catch (err) {
      console.error('Erro ao montar os dados do pastor:', err);
      erro(res, 500, 'Não foi possível carregar os dados.');
    }
  });

  // Cadastro inicial de líder (o líder depois ajusta o próprio perfil).
  router.post('/lideres', jsonBody, async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const senha = String(req.body?.senha || '');
    const nomeLider = String(req.body?.nome_lider || '').trim();
    const nomeGrupo = String(req.body?.nome_grupo || '').trim();
    const celular = String(req.body?.celular || '').trim();

    if (!nomeLider) return erro(res, 400, 'Informe o nome do líder.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro(res, 400, 'Informe um e-mail válido.');
    if (senha.length < 6) return erro(res, 400, 'A senha inicial deve ter pelo menos 6 caracteres.');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const hash = await bcrypt.hash(senha, 10);
      const { rows } = await client.query(
        `INSERT INTO usuarios (email, senha_hash, papel) VALUES ($1, $2, 'lider')
         ON CONFLICT (email) DO NOTHING RETURNING id, email, criado_em`,
        [email, hash]
      );
      if (rows.length === 0) {
        await client.query('ROLLBACK');
        return erro(res, 409, 'Este e-mail já está cadastrado.');
      }
      await client.query(
        `INSERT INTO profiles (id, nome_grupo, nome_lider, celular) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET nome_grupo = EXCLUDED.nome_grupo, nome_lider = EXCLUDED.nome_lider, celular = EXCLUDED.celular`,
        [rows[0].id, nomeGrupo || null, nomeLider, celular || null]
      );
      await client.query('COMMIT');
      res.json({
        data: { id: rows[0].id, email, criado_em: rows[0].criado_em, nome_grupo: nomeGrupo, nome_lider: nomeLider, celular },
        error: null,
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('Erro ao cadastrar líder:', err);
      erro(res, 500, 'Não foi possível cadastrar o líder.');
    } finally {
      client.release();
    }
  });

  // Aprovar ou reprovar a autorização pastoral de um evento.
  router.post('/eventos/:id/aprovacao', jsonBody, async (req, res) => {
    const decisao = req.body?.decisao;
    const obs = String(req.body?.obs || '').trim();
    if (!['aprovado', 'reprovado', 'pendente'].includes(decisao)) return erro(res, 400, 'Decisão inválida.');
    if (decisao === 'reprovado' && !obs) return erro(res, 400, 'Informe o motivo da reprovação.');
    try {
      const { rows } = await pool.query(
        `UPDATE eventos
            SET aprovacao_status = $2,
                aprovacao_obs = $3,
                aprovacao_em = CASE WHEN $2 = 'pendente' THEN NULL ELSE now() END
          WHERE id = $1
          RETURNING *`,
        [req.params.id, decisao, obs || null]
      );
      if (rows.length === 0) return erro(res, 404, 'Evento não encontrado.');
      res.json({ data: rows[0], error: null });
    } catch (err) {
      console.error('Erro ao registrar aprovação:', err);
      erro(res, 500, 'Não foi possível registrar a decisão.');
    }
  });

  // Manual de liderança: adicionar, editar e excluir capítulos.
  const lerCapitulo = (body) => ({
    ordem: parseInt(body?.ordem, 10) || 0,
    titulo: String(body?.titulo || '').trim(),
    texto: String(body?.texto || '').trim(),
    pontos: Array.isArray(body?.pontos) ? body.pontos.map((p) => String(p).trim()).filter(Boolean) : [],
    ref: String(body?.ref || '').trim() || null,
    alerta: String(body?.alerta || '').trim() || null,
    icone: String(body?.icone || 'list-checks'),
  });

  router.post('/manual', jsonBody, async (req, res) => {
    const c = lerCapitulo(req.body);
    if (!c.titulo) return erro(res, 400, 'Informe o título do capítulo.');
    try {
      if (!c.ordem) {
        const { rows } = await pool.query('SELECT coalesce(max(ordem), 0) + 1 AS prox FROM manual_capitulos');
        c.ordem = rows[0].prox;
      }
      const { rows } = await pool.query(
        `INSERT INTO manual_capitulos (ordem, titulo, texto, pontos, ref, alerta, icone)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7) RETURNING *`,
        [c.ordem, c.titulo, c.texto, JSON.stringify(c.pontos), c.ref, c.alerta, c.icone]
      );
      res.json({ data: rows[0], error: null });
    } catch (err) {
      console.error('Erro ao criar capítulo:', err);
      erro(res, 500, 'Não foi possível salvar o capítulo.');
    }
  });

  router.put('/manual/:id', jsonBody, async (req, res) => {
    const c = lerCapitulo(req.body);
    if (!c.titulo) return erro(res, 400, 'Informe o título do capítulo.');
    try {
      const { rows } = await pool.query(
        `UPDATE manual_capitulos
            SET ordem = CASE WHEN $2 > 0 THEN $2 ELSE ordem END,
                titulo = $3, texto = $4, pontos = $5::jsonb, ref = $6, alerta = $7, atualizado_em = now()
          WHERE id = $1 RETURNING *`,
        [req.params.id, c.ordem, c.titulo, c.texto, JSON.stringify(c.pontos), c.ref, c.alerta]
      );
      if (rows.length === 0) return erro(res, 404, 'Capítulo não encontrado.');
      res.json({ data: rows[0], error: null });
    } catch (err) {
      console.error('Erro ao atualizar capítulo:', err);
      erro(res, 500, 'Não foi possível salvar o capítulo.');
    }
  });

  router.delete('/manual/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM manual_capitulos WHERE id = $1', [req.params.id]);
      res.json({ data: null, error: null });
    } catch (err) {
      console.error('Erro ao excluir capítulo:', err);
      erro(res, 500, 'Não foi possível excluir o capítulo.');
    }
  });

  return router;
}
