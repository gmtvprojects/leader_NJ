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

## Perfis: Líder e Pastor

Cada conta tem um papel (`usuarios.papel`): `lider` (padrão) ou `pastor`. O Pastor enxerga os dados de todos os líderes
(painel, líderes, membros por categoria, eventos e aprovações, pedidos de oração e manual de liderança).

**Login:** por **código de acesso de 6 números** + senha (o e-mail não é mais usado para entrar). Todo usuário recebe um código
único; o cadastro público foi desativado. O Pastor cadastra os líderes na aba Líderes (o sistema gera o código e o Pastor repassa
código + senha inicial).

Criar uma conta de Pastor, promover uma conta existente ou listar os códigos (com `DATABASE_URL` definida usa esse banco; sem ela, o banco local):

```bash
node server/criar-pastor.js pastor@exemplo.com senha-inicial   # conta nova (e-mail + senha); imprime o código
node server/criar-pastor.js 123456                             # promove a conta com esse código (ou informe o e-mail)
node server/codigos.js                                         # lista os códigos de todas as contas (somente leitura)
```

No Railway: `railway ssh --service web -- node server/codigos.js`.
