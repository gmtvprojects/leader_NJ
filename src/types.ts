export type MotivoAusencia = 
  | 'Trabalho / Horário'
  | 'Estudos / Faculdade / Provas'
  | 'Desânimo / Esfriou na Fé'
  | 'Saúde / Emocional'
  | 'Transporte / Distância'
  | 'Família / Pais'
  | 'Viagem / Férias'
  | 'Sem Resposta / Não Informado'
  | 'Outro';

export interface Membro {
  id: string;
  nome: string;
  contato1: string;
  contato2: string;
  aniversario: string; // formato "YYYY-MM-DD"
  linguagemAmor: string;
  ministerio: string;
  faixa: 'J1' | 'J2' | 'MIX';
  dataEntrada: string;
  contatoPais: string;
  notas: string;
  status: 'Ativo' | 'Esporádico' | 'Ausente' | 'Transição';
  faltas: number;
  treinando?: boolean; // Em formação para liderança (pode haver mais de um)
  // Transição Jovens 1 (até 17) -> Jovens 2 (18 a 30) & Acompanhamento
  ga?: string; // Nome do GA onde está ou "Sem GA / A Definir"
  origemTransicao?: boolean; // Jovem vindo do J1
  motivoAusencia?: string;
  detalheAusencia?: string;
  ultimoContato?: string;
  responsavelContato?: string;
}

export interface Reuniao {
  id: string;
  data: string; // formato "YYYY-MM-DD"
  tema: string;
  lanche: string;
  lancheEquipe?: string;
  oracoes: string;
  presentes: string[]; // Array de IDs de membros presentes
}

export interface EventoChecklist {
  id: string;
  titulo: string;
  data: string; // formato "YYYY-MM-DD"
  observacao: string;
  itens: { id: string; texto: string; concluido: boolean }[];
}
