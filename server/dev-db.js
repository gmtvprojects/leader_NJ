import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Sobe um Postgres local (pacote embedded-postgres) para desenvolvimento, com os dados em .pgdata/.
// Usado apenas quando DATABASE_URL não está definida. Retorna a URL de conexão.
export async function iniciarBancoLocal() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const databaseDir = path.resolve(__dirname, '..', '.pgdata');
  const config = { user: 'postgres', password: 'postgres', port: 5433 };
  const novo = !fs.existsSync(path.join(databaseDir, 'PG_VERSION'));

  const banco = new EmbeddedPostgres({ databaseDir, ...config, persistent: true, onLog: () => {} });
  if (novo) await banco.initialise();
  await banco.start();
  if (novo) await banco.createDatabase('leader_dev');

  const parar = () => banco.stop().finally(() => process.exit(0));
  process.once('SIGINT', parar);
  process.once('SIGTERM', parar);

  return `postgresql://${config.user}:${config.password}@localhost:${config.port}/leader_dev`;
}
