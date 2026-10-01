// Cria uma conta de Pastor, ou promove uma conta existente a Pastor.
//
// Uso:
//   node server/criar-pastor.js <email> [senha]
// - Conta nova: informe e-mail e senha (mínimo 6 caracteres).
// - Conta existente: informe só o e-mail para promovê-la (a senha atual é mantida).
// Com DATABASE_URL definida usa esse banco; sem ela, usa o Postgres local de desenvolvimento
// (o servidor de desenvolvimento precisa estar rodando: npm run dev).
import pg from 'pg';
import bcrypt from 'bcryptjs';

const email = String(process.argv[2] || '').trim().toLowerCase();
const senha = process.argv[3];

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Uso: node server/criar-pastor.js <email> [senha]');
  process.exit(1);
}

const url = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/leader_dev';
const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  const { rows } = await client.query('SELECT id, papel FROM usuarios WHERE email = $1', [email]);
  if (rows.length > 0) {
    await client.query("UPDATE usuarios SET papel = 'pastor' WHERE id = $1", [rows[0].id]);
    console.log(`Conta ${email} promovida a Pastor.`);
  } else {
    if (!senha || senha.length < 6) {
      console.error('Conta nova: informe uma senha com pelo menos 6 caracteres.');
      process.exit(1);
    }
    const hash = await bcrypt.hash(senha, 10);
    const { rows: novo } = await client.query(
      "INSERT INTO usuarios (email, senha_hash, papel) VALUES ($1, $2, 'pastor') RETURNING id",
      [email, hash]
    );
    await client.query('INSERT INTO profiles (id, nome_lider) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [novo[0].id, 'Pastor']);
    console.log(`Conta de Pastor criada: ${email}.`);
  }
} finally {
  await client.end();
}
