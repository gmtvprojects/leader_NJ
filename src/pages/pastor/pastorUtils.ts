import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { extrairMetadadosMembro, calcularIdade } from "../../utils/membroUtils";

export interface LiderP {
  id: string;
  email: string;
  nome: string; // nome do líder (ou do GA / e-mail, na falta)
  nomeGrupo: string;
  celular: string;
  culto: string;
  senib: string;
}

export interface MembroP {
  id: string;
  liderId: string;
  nome: string;
  contato1: string;
  contato2: string;
  aniversario: string;
  dataEntrada: string;
  faixa: string;
  status: string;
  faltas: number;
  ga: string;
  origemTransicao: boolean;
  motivoAusencia: string;
  detalheAusencia: string;
  ultimoContato: string;
  observacoes: string;
  contatoPais: string;
  ministerio: string;
  linguagemAmor: string;
  treinando: boolean;
  batizado: boolean;
  umComDeus: boolean;
  culto: string;
  senib: string;
}

export interface ReuniaoP {
  id: string;
  liderId: string;
  data: string;
  tema: string;
  presentes: number;
  ausencias: number;
}

export interface EventoP {
  id: string;
  liderId: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  participantes: number;
  lideresConfirmados: number;
  lideresNomes: string[];
  precisaAprovacao: boolean;
  aprovacaoStatus: "pendente" | "aprovado" | "reprovado";
  aprovacaoObs: string;
  aprovacaoEm: string;
}

export interface PedidoP {
  id: string;
  liderId: string;
  membroId: string;
  membroNome: string;
  texto: string;
  data: string;
  status: "pendente" | "finalizado" | "resolvido";
}

export interface PresencaP {
  reuniaoId: string;
  membroId: string;
}

export interface AusenciaP {
  reuniaoId: string;
  membroId: string;
  motivo: string;
  semJustificativa: boolean;
}

export interface DadosPastor {
  lideres: LiderP[];
  membros: MembroP[];
  reunioes: ReuniaoP[];
  eventos: EventoP[];
  pedidos: PedidoP[];
  presencas: PresencaP[];
  ausencias: AusenciaP[];
}

const VAZIO: DadosPastor = { lideres: [], membros: [], reunioes: [], eventos: [], pedidos: [], presencas: [], ausencias: [] };

function mapear(raw: any): DadosPastor {
  const lideres: LiderP[] = (raw.lideres || []).map((l: any) => ({
    id: l.id,
    email: l.email,
    nome: l.nome_lider || l.nome_grupo || l.email,
    nomeGrupo: l.nome_grupo || "",
    celular: l.celular || "",
    culto: l.culto || "",
    senib: l.senib || ""
  }));

  const membros: MembroP[] = (raw.membros || []).map((m: any) => {
    const meta = extrairMetadadosMembro(m.notas, m.faixa, m.status);
    return {
      id: m.id,
      liderId: m.lider_id,
      nome: m.nome || "",
      contato1: m.contato1 || "",
      contato2: m.contato2 || "",
      aniversario: m.aniversario || "",
      dataEntrada: m.data_entrada || "",
      faixa: m.faixa || "J2",
      status: m.status || "Ativo",
      faltas: m.faltas || 0,
      ga: meta.ga,
      origemTransicao: meta.origemTransicao,
      motivoAusencia: meta.motivoAusencia,
      detalheAusencia: meta.detalheAusencia,
      ultimoContato: meta.ultimoContato,
      observacoes: meta.observacoes,
      contatoPais: m.contato_pais || "",
      ministerio: m.ministerio || "",
      linguagemAmor: m.linguagem_amor || "",
      treinando: !!m.treinando,
      batizado: !!m.batizado,
      umComDeus: !!m.um_com_deus,
      culto: m.culto || "",
      senib: m.senib || ""
    };
  });

  const reunioes: ReuniaoP[] = (raw.reunioes || []).map((r: any) => ({
    id: r.id,
    liderId: r.lider_id,
    data: r.data,
    tema: r.tema || "",
    presentes: r.presentes || 0,
    ausencias: r.ausencias || 0
  }));

  const eventos: EventoP[] = (raw.eventos || []).map((e: any) => ({
    id: e.id,
    liderId: e.lider_id,
    titulo: e.titulo || "",
    descricao: e.descricao || "",
    data: e.data || "",
    local: e.local || "",
    participantes: e.participantes || 0,
    lideresConfirmados: e.lideres_confirmados || 0,
    lideresNomes: e.lideres_nomes || [],
    precisaAprovacao: !!e.precisa_aprovacao,
    aprovacaoStatus: e.aprovacao_status || "pendente",
    aprovacaoObs: e.aprovacao_obs || "",
    aprovacaoEm: e.aprovacao_em || ""
  }));

  const pedidos: PedidoP[] = (raw.pedidos || []).map((o: any) => ({
    id: o.id,
    liderId: o.lider_id,
    membroId: o.membro_id || "",
    membroNome: o.membro_nome || "",
    texto: o.texto || "",
    data: o.criado_em ? String(o.criado_em).substring(0, 10) : "",
    status: o.status === "finalizado" || o.status === "resolvido" ? o.status : o.respondido ? "resolvido" : "pendente"
  }));

  const presencas: PresencaP[] = (raw.presencas || []).map((x: any) => ({ reuniaoId: x.reuniao_id, membroId: x.membro_id }));
  const ausencias: AusenciaP[] = (raw.ausencias || []).map((x: any) => ({
    reuniaoId: x.reuniao_id,
    membroId: x.membro_id,
    motivo: x.motivo || "",
    semJustificativa: !!x.sem_justificativa
  }));

  return { lideres, membros, reunioes, eventos, pedidos, presencas, ausencias };
}

export type EstadoDados = ReturnType<typeof useDadosPastor>;

export const ehTransicao = (m: MembroP) => m.origemTransicao || m.status === "Transição" || m.faixa === "J1";

// Registro de um membro em cada reunião do seu líder (da mais recente para a mais antiga)
export function registroDoMembro(dados: DadosPastor, m: MembroP) {
  return dados.reunioes
    .filter((r) => r.liderId === m.liderId)
    .sort((a, b) => b.data.localeCompare(a.data))
    .map((r) => {
      const presente = dados.presencas.some((p) => p.reuniaoId === r.id && p.membroId === m.id);
      const aus = dados.ausencias.find((a) => a.reuniaoId === r.id && a.membroId === m.id);
      return {
        id: r.id,
        data: r.data,
        tema: r.tema,
        presente,
        motivo: aus && !aus.semJustificativa ? aus.motivo : ""
      };
    });
}

// Carrega (e permite recarregar) todos os dados de todos os líderes
export function useDadosPastor() {
  const [dados, setDados] = useState<DadosPastor>(VAZIO);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const recarregar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.pastor.dados();
    if (error || !data) {
      setErro(error?.message || "Não foi possível carregar os dados.");
    } else {
      setErro("");
      setDados(mapear(data));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { dados, loading, erro, recarregar, setDados };
}

export const nomeDoLider = (lideres: LiderP[], id: string) => lideres.find((l) => l.id === id)?.nome || "Líder";

export const formatarData = (iso: string) => (iso ? new Date(iso.substring(0, 10) + "T12:00:00").toLocaleDateString("pt-BR") : "");

export const idadeDe = (aniversario: string) => calcularIdade(aniversario);

export const hojeISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().substring(0, 10);

// Categorias para a verificação das informações dos membros
export interface CategoriaMembro {
  id: string;
  label: string;
  descricao: string;
  filtro: (m: MembroP) => boolean;
}

export const CATEGORIAS_MEMBRO: CategoriaMembro[] = [
  { id: "todos", label: "Todos", descricao: "Todos os membros cadastrados", filtro: () => true },
  {
    id: "transicao",
    label: "Transição de J1",
    descricao: "Jovens vindos do J1 (até 17 anos) para o J2",
    filtro: (m) => ehTransicao(m)
  },
  { id: "treinandos", label: "Treinandos", descricao: "Membros em formação para liderança", filtro: (m) => m.treinando },
  {
    id: "semga",
    label: "Sem G.A",
    descricao: "Sem grupo definido",
    filtro: (m) => !m.ga || m.ga === "Sem GA / A Definir" || m.ga === "Aguardando GA"
  },
  { id: "naobatizados", label: "Não batizados", descricao: "Ainda não batizados", filtro: (m) => !m.batizado },
  { id: "semumcomdeus", label: "Sem Um com Deus", descricao: "Ainda sem Um com Deus", filtro: (m) => !m.umComDeus },
];

// Aniversariantes dentro de N dias (a partir de hoje)
export function aniversariantesProximos(membros: MembroP[], dias: number) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return membros
    .map((m) => {
      if (!m.aniversario) return null;
      const [, mes, dia] = m.aniversario.split("-").map((x) => parseInt(x, 10));
      if (!mes || !dia) return null;
      const proximo = new Date(hoje.getFullYear(), mes - 1, dia);
      if (proximo.getTime() < hoje.getTime()) proximo.setFullYear(hoje.getFullYear() + 1);
      const faltam = Math.round((proximo.getTime() - hoje.getTime()) / 86400000);
      return { membro: m, faltam, dia, mes };
    })
    .filter((x): x is { membro: MembroP; faltam: number; dia: number; mes: number } => !!x && x.faltam <= dias)
    .sort((a, b) => a.faltam - b.faltam);
}

export const iniciais = (nome: string) => {
  const partes = nome.trim().split(" ").filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  return (partes[0] || "?").substring(0, 2).toUpperCase();
};
