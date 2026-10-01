# Leader NJ — App do Líder de GA

Aplicação web responsiva (celular, tablet e desktop) para líderes de GA acompanharem
membros, reuniões, eventos, pedidos de oração e recursos.

## Estrutura

- `src/` — front-end em React + TypeScript + Tailwind (Vite).
- `server/` — backend em Express com Postgres: login (`/api/auth`), dados (`/api/db`) e arquivos (`/api/storage`).
- `server/schema.sql` — tabelas do banco, criadas automaticamente quando o servidor sobe.

## Rodar localmente

Pré-requisito: Node.js 20+.

1. `npm install`
2. `npm run dev` — abre em http://localhost:3000 (API e front no mesmo servidor, com recarga automática).

Sem `DATABASE_URL` definida, o servidor sobe um Postgres local próprio, com os dados na pasta `.pgdata/`.
Para usar outro banco, copie `.env.example` para `.env` e preencha.

## Produção (Railway)

- Build: `npm run build` · Start: `npm start`
- Variáveis do serviço: `DATABASE_URL` (referência ao Postgres do projeto) e `JWT_SECRET`.
