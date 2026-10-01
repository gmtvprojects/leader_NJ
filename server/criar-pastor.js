// Cria uma conta de Pastor, ou promove uma conta existente a Pastor.
//
// Uso:
//   node server/criar-pastor.js <e-mail ou código> [senha]
// - Conta nova: informe o e-mail e a senha (mínimo 6 caracteres). O código de acesso de 6 números é gerado e exibido.
// - Conta existente: informe o e-mail ou o código para promovê-la (a senha atual é mantida).
// Com DATABASE_URL definida usa esse banco; sem ela, usa o Postgres local de desenvolvimento
// (o servidor de desenvolvimento precisa estar rodando: npm run dev).
import pg from 'pg';
import bcrypt from 'bcryptjs';

const alvo = String(process.argv[2] || '').trim().toLowerCase();
const senha = process.argv[3];
const ehCodigo = /^\d{6}$/.test(alvo);
const ehEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alvo);

if (!ehCodigo && !ehEmail) {
  console.error('Uso: node server/criar-pastor.js <e-mail ou código de 6 números> [senha]');
  process.exit(1);
}

const url = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/leader_dev';
const client = new pg.Client({ connectionString: url });
await client.connect();

async function novoCodigo() {
  for (let i = 0; i < 50; i++) {
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const { rowCount } = await client.query('SELECT 1 FROM usuarios WHERE codigo = $1', [codigo]);
    if (rowCount === 0) return codigo;
  }
  throw new Error('Não foi possível gerar um código único.');
}

try {
  const { rows } = await client.query(
    ehCodigo ? 'SELECT id, codigo FROM usuarios WHERE codigo = $1' : 'SELECT id, codigo FROM usuarios WHERE email = $1',
    [alvo]
  );
  if (rows.length > 0) {
    let codigo = rows[0].codigo;
    if (!codigo) {
      codigo = await novoCodigo();
      await client.query('UPDATE usuarios SET codigo = $2 WHERE id = $1', [rows[0].id, codigo]);
    }
    await client.query("UPDATE usuarios SET papel = 'pastor' WHERE id = $1", [rows[0].id]);
    console.log(`Conta promovida a Pastor. Código de acesso: ${codigo}`);
  } else {
    if (!ehEmail) {
      console.error('Nenhuma conta com esse código. Para criar uma conta nova, informe o e-mail e a senha.');
      process.exit(1);
    }
    if (!senha || senha.length < 6) {
      console.error('Conta nova: informe uma senha com pelo menos 6 caracteres.');
      process.exit(1);
    }
    const hash = await bcrypt.hash(senha, 10);
    const codigo = await novoCodigo();
    const { rows: novo } = await client.query(
      "INSERT INTO usuarios (email, senha_hash, papel, codigo) VALUES ($1, $2, 'pastor', $3) RETURNING id",
      [alvo, hash, codigo]
    );
    await client.query('INSERT INTO profiles (id, nome_lider) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [novo[0].id, 'Pastor']);
    console.log(`Conta de Pastor criada (${alvo}). Código de acesso: ${codigo}`);
  }
} finally {
  await client.end();
}
