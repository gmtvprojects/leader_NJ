-- Esquema do banco. Executado a cada inicialização do servidor; todos os comandos são idempotentes.

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  senha_hash text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS papel text NOT NULL DEFAULT 'lider';
-- Código de acesso de 6 números (substitui o e-mail no login).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo text;
ALTER TABLE usuarios ALTER COLUMN email DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_codigo_idx ON usuarios(codigo);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  nome_grupo text
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nome_lider text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS celular text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS data_nascimento date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS culto text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS senib text;

CREATE TABLE IF NOT EXISTS membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome text NOT NULL,
  contato1 text,
  contato2 text,
  aniversario date,
  linguagem_amor text,
  ministerio text,
  faixa text,
  data_entrada date,
  contato_pais text,
  notas text,
  status text NOT NULL DEFAULT 'Ativo',
  faltas integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE membros ADD COLUMN IF NOT EXISTS treinando boolean NOT NULL DEFAULT false;
ALTER TABLE membros ADD COLUMN IF NOT EXISTS batizado boolean NOT NULL DEFAULT false;
ALTER TABLE membros ADD COLUMN IF NOT EXISTS um_com_deus boolean NOT NULL DEFAULT false;
ALTER TABLE membros ADD COLUMN IF NOT EXISTS culto text;
ALTER TABLE membros ADD COLUMN IF NOT EXISTS senib text;
CREATE INDEX IF NOT EXISTS membros_lider_idx ON membros(lider_id);

CREATE TABLE IF NOT EXISTS reunioes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data date NOT NULL,
  tema text,
  lanche text,
  lanche_equipe text,
  oracoes text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reunioes ADD COLUMN IF NOT EXISTS lanche_equipe text;
CREATE INDEX IF NOT EXISTS reunioes_lider_idx ON reunioes(lider_id);

CREATE TABLE IF NOT EXISTS reuniao_presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id uuid NOT NULL REFERENCES reunioes(id) ON DELETE CASCADE,
  membro_id uuid NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  UNIQUE (reuniao_id, membro_id)
);

CREATE TABLE IF NOT EXISTS reuniao_ausencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id uuid NOT NULL REFERENCES reunioes(id) ON DELETE CASCADE,
  membro_id uuid NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  motivo text,
  sem_justificativa boolean NOT NULL DEFAULT false,
  UNIQUE (reuniao_id, membro_id)
);

-- Equipes de lanche: membros do grupo (e/ou o próprio líder) que se revezam no lanche.
CREATE TABLE IF NOT EXISTS equipes_lanche (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome text NOT NULL,
  membros_ids jsonb NOT NULL DEFAULT '[]',
  inclui_lider boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipes_lanche_lider_idx ON equipes_lanche(lider_id);

CREATE TABLE IF NOT EXISTS oracao_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  membro_id uuid REFERENCES membros(id) ON DELETE SET NULL,
  membro_nome text,
  texto text NOT NULL,
  respondido boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE oracao_pedidos ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente';
ALTER TABLE oracao_pedidos ADD COLUMN IF NOT EXISTS reuniao_id uuid REFERENCES reunioes(id) ON DELETE SET NULL;
UPDATE oracao_pedidos SET status = 'resolvido' WHERE respondido AND status = 'pendente';
CREATE INDEX IF NOT EXISTS oracao_pedidos_lider_idx ON oracao_pedidos(lider_id);

CREATE TABLE IF NOT EXISTS treinandos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome text NOT NULL,
  data_inicio date
);
CREATE INDEX IF NOT EXISTS treinandos_lider_idx ON treinandos(lider_id);

CREATE TABLE IF NOT EXISTS historico_tamanho (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  mes text NOT NULL,
  total integer NOT NULL DEFAULT 0,
  UNIQUE (lider_id, mes)
);

CREATE TABLE IF NOT EXISTS eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  data date,
  local text,
  tipo text,
  descricao text,
  precisa_aprovacao boolean NOT NULL DEFAULT false,
  participantes integer NOT NULL DEFAULT 0,
  lideres_confirmados integer NOT NULL DEFAULT 0,
  lideres_nomes jsonb NOT NULL DEFAULT '[]',
  checklist_marcados jsonb NOT NULL DEFAULT '[]',
  comprovante text,
  status text NOT NULL DEFAULT 'planejado',
  criado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS descricao text;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS precisa_aprovacao boolean NOT NULL DEFAULT false;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS lideres_nomes jsonb NOT NULL DEFAULT '[]';
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS aprovacao_status text NOT NULL DEFAULT 'pendente';
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS aprovacao_obs text;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS aprovacao_em timestamptz;
CREATE INDEX IF NOT EXISTS eventos_lider_idx ON eventos(lider_id);

-- lider_id nulo = tema/recurso global, visível para todos os líderes.
CREATE TABLE IF NOT EXISTS banco_temas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  emoji text,
  cor text,
  compartilhado boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS banco_recursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id uuid REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  conteudo text,
  referencia text,
  temas jsonb NOT NULL DEFAULT '[]',
  titulo text,
  semana text,
  versiculo_base text,
  periodo_semanas integer,
  nome_arquivo text,
  tipo_arquivo text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS banco_recursos_lider_idx ON banco_recursos(lider_id);

-- Arquivos enviados (PDFs de meditações), guardados no próprio banco.
CREATE TABLE IF NOT EXISTS arquivos (
  bucket text NOT NULL,
  caminho text NOT NULL,
  lider_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  content_type text,
  dados bytea NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, caminho)
);

-- Manual de liderança (conteúdo global, editado pelo pastor).
CREATE TABLE IF NOT EXISTS manual_capitulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem integer NOT NULL DEFAULT 0,
  titulo text NOT NULL,
  icone text,
  acento text,
  compromisso boolean NOT NULL DEFAULT false,
  texto text,
  pontos jsonb NOT NULL DEFAULT '[]',
  ref text,
  alerta text,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
