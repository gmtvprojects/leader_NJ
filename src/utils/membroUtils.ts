import { Membro, MotivoAusencia } from "../types";

export interface MembroMetadados {
  _meta: true;
  ga?: string;
  origemTransicao?: boolean;
  motivoAusencia?: string;
  detalheAusencia?: string;
  ultimoContato?: string;
  responsavelContato?: string;
  observacoes?: string;
}

export const MOTIVOS_AUSENCIA_PADRAO: { id: MotivoAusencia; label: string; icone: string }[] = [
  { id: 'Trabalho / Horário', label: 'Trabalho / Escala', icone: '💼' },
  { id: 'Estudos / Faculdade / Provas', label: 'Estudos / Faculdade', icone: '🎓' },
  { id: 'Desânimo / Esfriou na Fé', label: 'Desânimo / Esfriou', icone: '💔' },
  { id: 'Saúde / Emocional', label: 'Saúde / Emocional', icone: '🏥' },
  { id: 'Transporte / Distância', label: 'Transporte / Mudança', icone: '🚗' },
  { id: 'Família / Pais', label: 'Família / Responsáveis', icone: '👨‍👩‍👧' },
  { id: 'Viagem / Férias', label: 'Viagem / Férias', icone: '✈️' },
  { id: 'Sem Resposta / Não Informado', label: 'Sem Resposta / Investigando', icone: '❓' },
  { id: 'Outro', label: 'Outro Motivo', icone: '📝' },
];

/**
 * Converte o campo 'notas' (que pode ser JSON ou texto legado) nos metadados estruturados
 */
export function extrairMetadadosMembro(rawNotas?: string, faixa?: string, status?: string): {
  ga: string;
  origemTransicao: boolean;
  motivoAusencia: string;
  detalheAusencia: string;
  ultimoContato: string;
  responsavelContato: string;
  observacoes: string;
} {
  const defaults = {
    ga: "GA Principal",
    origemTransicao: faixa === "J1" || status === "Transição",
    motivoAusencia: status === "Ausente" ? "Sem Resposta / Não Informado" : "",
    detalheAusencia: "",
    ultimoContato: "",
    responsavelContato: "",
    observacoes: ""
  };

  if (!rawNotas) return defaults;

  const trimmed = rawNotas.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        ga: parsed.ga || defaults.ga,
        origemTransicao: typeof parsed.origemTransicao === "boolean" ? parsed.origemTransicao : defaults.origemTransicao,
        motivoAusencia: parsed.motivoAusencia || defaults.motivoAusencia,
        detalheAusencia: parsed.detalheAusencia || "",
        ultimoContato: parsed.ultimoContato || "",
        responsavelContato: parsed.responsavelContato || "",
        observacoes: parsed.observacoes || ""
      };
    } catch {
      // Falhou o parse de JSON, tratar como texto livre
    }
  }

  return {
    ...defaults,
    observacoes: rawNotas
  };
}

/**
 * Empacota os metadados de transição, GA e motivo de ausência dentro do campo 'notas'
 */
export function serializarMetadadosMembro(dados: {
  ga: string;
  origemTransicao: boolean;
  motivoAusencia: string;
  detalheAusencia: string;
  ultimoContato: string;
  responsavelContato: string;
  observacoes: string;
}): string {
  const payload: MembroMetadados = {
    _meta: true,
    ga: dados.ga.trim() || "GA Principal",
    origemTransicao: dados.origemTransicao,
    motivoAusencia: dados.motivoAusencia,
    detalheAusencia: dados.detalheAusencia.trim(),
    ultimoContato: dados.ultimoContato,
    responsavelContato: dados.responsavelContato.trim(),
    observacoes: dados.observacoes.trim()
  };
  return JSON.stringify(payload);
}

/**
 * Calcula idade do jovem a partir da data de nascimento YYYY-MM-DD
 */
export function calcularIdade(dataNasc?: string): number | null {
  if (!dataNasc) return null;
  const partes = dataNasc.split("-");
  if (partes.length < 3) return null;

  const ano = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  const m = hoje.getMonth() - mes;
  if (m < 0 || (m === 0 && hoje.getDate() < dia)) {
    idade--;
  }
  return idade >= 0 && idade < 120 ? idade : null;
}

/**
 * Gera mensagem pastoral de WhatsApp personalizada
 */
export function gerarLinkWhatsApp(membro: Membro, tipo: 'acolhimento' | 'falta' | 'contato'): string {
  const foneLimpo = (membro.contato1 || membro.contato2 || "").replace(/\D/g, "");
  if (!foneLimpo) return "#";

  const primeiroNome = membro.nome.trim().split(" ")[0];

  let mensagem = "";
  if (tipo === 'acolhimento') {
    mensagem = `Graça e Paz, ${primeiroNome}! Tudo bem? Seja muito bem-vindo ao Jovens 2 (18 a 30 anos)! Estamos muito felizes com a sua vinda do Jovens 1. Como você está? Gostaria de saber como podemos te acolher no nosso GA!`;
  } else if (tipo === 'falta') {
    mensagem = `Oi, ${primeiroNome}! A paz do Senhor! Sentimos muito sua falta no GA e nas nossas programações de Jovens 2. Está tudo bem com você? Se precisar de alguma coisa ou de oração, conta com a gente! 🙏`;
  } else {
    mensagem = `Olá, ${primeiroNome}! Passando aqui para saber como você está e se tem algum motivo de oração nessa semana. Um abraço!`;
  }

  return `https://wa.me/55${foneLimpo}?text=${encodeURIComponent(mensagem)}`;
}
