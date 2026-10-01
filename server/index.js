import 'dotenv/config';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, conectar } from './db.js';
import { executarConsulta } from './consulta.js';
import { exigirPastor, rotasPastor } from './pastor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(__dirname, '..');
const producao = process.env.NODE_ENV === 'production';
const PORTA = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || (producao ? '' : 'segredo-apenas-para-desenvolvimento');
const BUCKETS = ['meditacoes'];

if (producao && (!process.env.DATABASE_URL || !JWT_SECRET)) {
  console.error('Defina DATABASE_URL e JWT_SECRET (veja .env.example).');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);

// ---------- Autenticação ----------

const criarSessao = (usuario) => {
  const user = { id: usuario.id, email: usuario.email || null, codigo: usuario.codigo || null, papel: usuario.papel || 'lider' };
  const access_token = jwt.sign({ sub: user.id, email: user.email || '' }, JWT_SECRET, { expiresIn: '30d' });
  return { user, session: { access_token, user } };
};

function autenticar(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  try {
    const dados = jwt.verify(token, JWT_SECRET);
    if (dados.arquivo) throw new Error('token de arquivo');
    req.userId = dados.sub;
    req.userEmail = dados.email;
    next();
  } catch {
    res.status(401).json({ data: null, error: { message: 'Sessão inválida ou expirada.', code: 'NAO_AUTENTICADO' } });
  }
}

const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' } },
});

const jsonBody = express.json({ limit: '5mb' });

function lerCredenciais(req) {
  const codigo = String(req.body?.codigo || '').replace(/\D/g, '');
  const senha = String(req.body?.password || '');
  return { codigo, senha };
}

// O cadastro público foi desativado: os líderes são cadastrados pelo Pastor, que define o código de acesso.
app.post('/api/auth/signup', (_req, res) => {
  res.status(403).json({ error: { message: 'O cadastro é feito pelo Pastor. Peça o seu código de acesso.' } });
});

app.post('/api/auth/login', limiteAuth, jsonBody, async (req, res) => {
  const { codigo, senha } = lerCredenciais(req);
  if (!/^\d{6}$/.test(codigo)) {
    return res.status(400).json({ error: { message: 'Informe o código de acesso de 6 números.' } });
  }
  try {
    const { rows } = await pool.query('SELECT id, email, senha_hash, papel, codigo FROM usuarios WHERE codigo = $1', [codigo]);
    const ok = rows[0] && (await bcrypt.compare(senha, rows[0].senha_hash));
    if (!ok) {
      return res.status(401).json({ error: { message: 'Código ou senha incorretos.' } });
    }
    res.json({ data: criarSessao(rows[0]), error: null });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: { message: 'Não foi possível entrar.' } });
  }
});

app.get('/api/auth/session', autenticar, async (req, res) => {
  const { rows } = await pool.query('SELECT id, email, papel, codigo FROM usuarios WHERE id = $1', [req.userId]);
  if (rows.length === 0) {
    return res.status(401).json({ data: null, error: { message: 'Sessão inválida ou expirada.', code: 'NAO_AUTENTICADO' } });
  }
  res.json({ data: { user: rows[0] }, error: null });
});

// ---------- Manual de liderança (leitura para qualquer usuário autenticado) ----------

app.get('/api/manual', autenticar, async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM manual_capitulos ORDER BY ordem, titulo');
  res.json({ data: rows, error: null });
});

// ---------- Perfil Pastor ----------

app.use('/api/pastor', autenticar, exigirPastor, rotasPastor());

// ---------- Banco de dados ----------

app.post('/api/db', autenticar, jsonBody, async (req, res) => {
  const { status, corpo } = await executarConsulta(req.userId, req.body);
  res.status(status).json(corpo);
});

// ---------- Arquivos ----------

function validarBucket(req, res, next) {
  if (!BUCKETS.includes(req.params.bucket)) {
    return res.status(404).json({ error: { message: 'Bucket inexistente.' } });
  }
  next();
}

app.post('/api/storage/:bucket/sign', validarBucket, autenticar, jsonBody, (req, res) => {
  const caminho = String(req.body?.path || '');
  const segundos = Math.min(Math.max(parseInt(req.body?.expiresIn, 10) || 300, 30), 3600);
  const token = jwt.sign(
    { sub: req.userId, arquivo: `${req.params.bucket}/${caminho}` },
    JWT_SECRET,
    { expiresIn: segundos }
  );
  const signedUrl = `/api/storage/${req.params.bucket}/${encodeURIComponent(caminho)}?token=${token}`;
  res.json({ data: { signedUrl }, error: null });
});

app.post('/api/storage/:bucket/remove', validarBucket, autenticar, jsonBody, async (req, res) => {
  const caminhos = Array.isArray(req.body?.paths) ? req.body.paths.map(String) : [];
  await pool.query(
    'DELETE FROM arquivos WHERE bucket = $1 AND caminho = ANY($2::text[]) AND lider_id = $3',
    [req.params.bucket, caminhos, req.userId]
  );
  res.json({ data: caminhos, error: null });
});

app.put(
  '/api/storage/:bucket/*',
  validarBucket,
  autenticar,
  express.raw({ type: '*/*', limit: '25mb' }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: { message: 'Arquivo vazio.' } });
    }
    const caminho = req.params[0];
    try {
      // Só sobrescreve se o arquivo existente for do mesmo usuário.
      const { rowCount } = await pool.query(
        `INSERT INTO arquivos (bucket, caminho, lider_id, content_type, dados)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (bucket, caminho) DO UPDATE
           SET content_type = EXCLUDED.content_type, dados = EXCLUDED.dados, criado_em = now()
           WHERE arquivos.lider_id = EXCLUDED.lider_id`,
        [req.params.bucket, caminho, req.userId, req.headers['content-type'] || 'application/octet-stream', req.body]
      );
      if (rowCount === 0) return res.status(403).json({ error: { message: 'Acesso negado.' } });
      res.json({ data: { path: caminho }, error: null });
    } catch (err) {
      console.error('Erro no upload:', err);
      res.status(500).json({ error: { message: 'Não foi possível salvar o arquivo.' } });
    }
  }
);

app.get('/api/storage/:bucket/*', validarBucket, async (req, res) => {
  const caminho = req.params[0];
  let userId;
  try {
    if (req.query.token) {
      const dados = jwt.verify(String(req.query.token), JWT_SECRET);
      if (dados.arquivo !== `${req.params.bucket}/${caminho}`) throw new Error('token de outro arquivo');
      userId = dados.sub;
    } else {
      const dados = jwt.verify((req.headers.authorization || '').replace(/^Bearer\s+/i, ''), JWT_SECRET);
      if (dados.arquivo) throw new Error('token de arquivo');
      userId = dados.sub;
    }
  } catch {
    return res.status(401).json({ error: { message: 'Sessão inválida ou expirada.' } });
  }
  const { rows } = await pool.query(
    'SELECT content_type, dados FROM arquivos WHERE bucket = $1 AND caminho = $2 AND lider_id = $3',
    [req.params.bucket, caminho, userId]
  );
  if (rows.length === 0) return res.status(404).json({ error: { message: 'Arquivo não encontrado.' } });
  res.setHeader('Content-Type', rows[0].content_type || 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.send(rows[0].dados);
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: { message: 'Rota inexistente.' } });
});

// ---------- Front-end ----------

const servidor = http.createServer(app);

if (producao) {
  const dist = path.join(raiz, 'dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  // Em desenvolvimento o Vite roda dentro deste mesmo servidor (com HMR).
  const { createServer } = await import('vite');
  const vite = await createServer({
    root: raiz,
    appType: 'spa',
    server: { middlewareMode: true, hmr: { server: servidor } },
  });
  app.use(vite.middlewares);
}

// Sem DATABASE_URL (desenvolvimento), usa um Postgres local embutido.
let urlBanco = process.env.DATABASE_URL;
if (!urlBanco) {
  const { iniciarBancoLocal } = await import('./dev-db.js');
  urlBanco = await iniciarBancoLocal();
}
await conectar(urlBanco);
servidor.listen(PORTA, '0.0.0.0', () => {
  console.log(`Servidor no ar em http://localhost:${PORTA} (${producao ? 'produção' : 'desenvolvimento'})`);
});
