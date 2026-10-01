-- Esquema do banco. Executado a cada inicialização do servidor; todos os comandos são idempotentes.

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  senha_hash text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  nome_grupo text
);

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
CREATE INDEX IF NOT EXISTS membros_lider_idx ON membros(lider_id);

CREATE TABLE IF NOT EXISTS reunioes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  data date NOT NULL,
  tema text,
  lanche text,
  oracoes text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reunioes_lider_idx ON reunioes(lider_id);

CREATE TABLE IF NOT EXISTS reuniao_presencas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reuniao_id uuid NOT NULL REFERENCES reunioes(id) ON DELETE CASCADE,
  membro_id uuid NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  UNIQUE (reuniao_id, membro_id)
);

CREATE TABLE IF NOT EXISTS oracao_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lider_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  membro_id uuid REFERENCES membros(id) ON DELETE SET NULL,
  membro_nome text,
  texto text NOT NULL,
  respondido boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);
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
  participantes integer NOT NULL DEFAULT 0,
  lideres_confirmados integer NOT NULL DEFAULT 0,
  checklist_marcados jsonb NOT NULL DEFAULT '[]',
  comprovante text,
  status text NOT NULL DEFAULT 'planejado',
  criado_em timestamptz NOT NULL DEFAULT now()
);
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
