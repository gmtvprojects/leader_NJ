// Lista os códigos de acesso (6 números) de todas as contas. Somente leitura.
//
// Uso:
//   node server/codigos.js
// Com DATABASE_URL definida usa esse banco; sem ela, usa o Postgres local de desenvolvimento.
import pg from 'pg';

const url = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/leader_dev';
const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  const { rows } = await client.query(
    `SELECT u.codigo, u.papel, u.email, coalesce(p.nome_lider, p.nome_grupo, '') AS nome
       FROM usuarios u LEFT JOIN profiles p ON p.id = u.id
      ORDER BY u.papel DESC, u.criado_em`
  );
  rows.forEach((r) => console.log(`${r.codigo}  ${r.papel.padEnd(6)}  ${r.nome || '-'}  ${r.email || '(sem e-mail)'}`));
} finally {
  await client.end();
}
