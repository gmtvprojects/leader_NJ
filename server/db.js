import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

// Colunas DATE voltam como texto "YYYY-MM-DD" (o front trabalha com esse formato).
pg.types.setTypeParser(1082, (v) => v);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export let pool;

// Abre o pool de conexões e garante que as tabelas existem.
export async function conectar(connectionString) {
  pool = new pg.Pool({ connectionString });
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
}

// Tabelas acessíveis pela API genérica /api/db.
//  dono:     coluna que guarda o id do usuário dono da linha
//  via:      tabela filha — a posse é verificada pela tabela pai
//  global:   linhas com dono nulo são visíveis (somente leitura) para todos
//  conflito: colunas usadas no ON CONFLICT do upsert
export const TABELAS = {
  profiles: {
    colunas: ['id', 'nome_grupo'],
    dono: 'id',
    conflito: ['id'],
  },
  membros: {
    colunas: ['id', 'lider_id', 'nome', 'contato1', 'contato2', 'aniversario', 'linguagem_amor', 'ministerio', 'faixa', 'data_entrada', 'contato_pais', 'notas', 'status', 'faltas', 'criado_em'],
    dono: 'lider_id',
    datas: ['aniversario', 'data_entrada'],
  },
  reunioes: {
    colunas: ['id', 'lider_id', 'data', 'tema', 'lanche', 'lanche_equipe', 'oracoes', 'criado_em'],
    dono: 'lider_id',
    datas: ['data'],
    embutir: { reuniao_presencas: { fk: 'reuniao_id', colunas: ['id', 'reuniao_id', 'membro_id'] } },
  },
  reuniao_presencas: {
    colunas: ['id', 'reuniao_id', 'membro_id'],
    via: { tabela: 'reunioes', fk: 'reuniao_id', dono: 'lider_id' },
  },
  oracao_pedidos: {
    colunas: ['id', 'lider_id', 'membro_id', 'membro_nome', 'texto', 'respondido', 'criado_em'],
    dono: 'lider_id',
  },
  treinandos: {
    colunas: ['id', 'lider_id', 'nome', 'data_inicio'],
    dono: 'lider_id',
    datas: ['data_inicio'],
  },
  historico_tamanho: {
    colunas: ['id', 'lider_id', 'mes', 'total'],
    dono: 'lider_id',
    conflito: ['lider_id', 'mes'],
  },
  eventos: {
    colunas: ['id', 'lider_id', 'titulo', 'data', 'local', 'tipo', 'participantes', 'lideres_confirmados', 'checklist_marcados', 'comprovante', 'status', 'criado_em'],
    dono: 'lider_id',
    datas: ['data'],
    json: ['checklist_marcados'],
  },
  banco_temas: {
    colunas: ['id', 'lider_id', 'titulo', 'emoji', 'cor', 'compartilhado'],
    dono: 'lider_id',
    global: true,
  },
  banco_recursos: {
    colunas: ['id', 'lider_id', 'tipo', 'conteudo', 'referencia', 'temas', 'titulo', 'semana', 'versiculo_base', 'periodo_semanas', 'nome_arquivo', 'tipo_arquivo', 'criado_em'],
    dono: 'lider_id',
    global: true,
    json: ['temas'],
  },
};
