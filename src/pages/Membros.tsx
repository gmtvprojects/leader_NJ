import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Phone, 
  Edit2, 
  Calendar, 
  Heart, 
  ArrowLeft, 
  MessageCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Filter,
  Check,
  X,
  PhoneCall,
  Clock,
  AlertTriangle
} from "lucide-react";
import { api } from "../lib/api";
import { Membro } from "../types";
import { 
  extrairMetadadosMembro, 
  serializarMetadadosMembro, 
  calcularIdade, 
  gerarLinkWhatsApp,
  MOTIVOS_AUSENCIA_PADRAO 
} from "../utils/membroUtils";

// CORES DE AVATAR ALEATÓRIAS BASEADO NA INICIAL
const AVATAR_COLORS: { [key: string]: string } = {
  A: "bg-teal-600 text-white", B: "bg-blue-600 text-white", C: "bg-indigo-600 text-white",
  D: "bg-purple-600 text-white", E: "bg-pink-600 text-white", F: "bg-rose-600 text-white",
  G: "bg-amber-600 text-white", H: "bg-emerald-600 text-white", I: "bg-teal-700 text-white",
  J: "bg-blue-700 text-white", K: "bg-violet-600 text-white", L: "bg-orange-600 text-white",
  M: "bg-cyan-600 text-white", N: "bg-fuchsia-600 text-white", O: "bg-lime-600 text-white",
  P: "bg-yellow-600 text-white", Q: "bg-emerald-700 text-white", R: "bg-indigo-700 text-white",
  S: "bg-teal-800 text-white", T: "bg-violet-700 text-white", U: "bg-amber-700 text-white",
  V: "bg-rose-700 text-white", W: "bg-sky-600 text-white", X: "bg-purple-700 text-white",
  Y: "bg-blue-800 text-white", Z: "bg-teal-900 text-white"
};

const getAvatarStyle = (name: string): string => {
  const char = name ? name.trim().charAt(0).toUpperCase() : "G";
  return AVATAR_COLORS[char] || "bg-teal-700 text-white";
};

const getInitials = (name: string): string => {
  if (!name) return "GA";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return parts[0].charAt(0).toUpperCase();
};

interface MembrosProps {
  filtroInicial?: string;
  liderId: string;
}

const mapToTS = (db: any): Membro => {
  const meta = extrairMetadadosMembro(db.notas, db.faixa, db.status);
  return {
    id: db.id,
    nome: db.nome || '',
    contato1: db.contato1 || '',
    contato2: db.contato2 || '',
    aniversario: db.aniversario || '',
    linguagemAmor: db.linguagem_amor || '',
    ministerio: db.ministerio || '',
    faixa: db.faixa || 'J2',
    dataEntrada: db.data_entrada || '',
    contatoPais: db.contato_pais || '',
    notas: meta.observacoes,
    status: db.status || 'Ativo',
    faltas: db.faltas || 0,
    ga: meta.ga,
    origemTransicao: meta.origemTransicao,
    motivoAusencia: meta.motivoAusencia,
    detalheAusencia: meta.detalheAusencia,
    ultimoContato: meta.ultimoContato,
    responsavelContato: meta.responsavelContato
  };
};

const mapToDB = (ts: Omit<Membro, 'id'> & { id?: string }, liderId: string) => {
  const serializedNotas = serializarMetadadosMembro({
    ga: ts.ga || "GA Principal",
    origemTransicao: !!ts.origemTransicao,
    motivoAusencia: ts.motivoAusencia || "",
    detalheAusencia: ts.detalheAusencia || "",
    ultimoContato: ts.ultimoContato || "",
    responsavelContato: ts.responsavelContato || "",
    observacoes: ts.notas || ""
  });

  return {
    id: ts.id,
    lider_id: liderId,
    nome: ts.nome,
    contato1: ts.contato1,
    contato2: ts.contato2,
    aniversario: ts.aniversario || null,
    linguagem_amor: ts.linguagemAmor,
    ministerio: ts.ministerio,
    faixa: ts.faixa,
    data_entrada: ts.dataEntrada || null,
    contato_pais: ts.contatoPais,
    notas: serializedNotas,
    status: ts.status,
    faltas: ts.faltas
  };
};

export default function Membros({ filtroInicial, liderId }: MembrosProps) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reunioes, setReunioes] = useState<any[]>([]);
  
  // View pode ser "lista" | "detalhe" | "cadastro" | "edicao"
  const [view, setView] = useState<"lista" | "detalhe" | "cadastro" | "edicao">("lista");
  const [membroSelecionado, setMembroSelecionado] = useState<Membro | null>(null);

  // Estados de Busca e Filtro
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroGa, setFiltroGa] = useState("Todos");

  // Modal rápido para registrar motivo de ausência ou contato pastoral
  const [modalContatoAberto, setModalContatoAberto] = useState(false);
  const [membroParaContato, setMembroParaContato] = useState<Membro | null>(null);
  const [contatoMotivo, setContatoMotivo] = useState("");
  const [contatoDetalhe, setContatoDetalhe] = useState("");
  const [contatoData, setContatoData] = useState(new Date().toISOString().split("T")[0]);
  const [contatoNovoStatus, setContatoNovoStatus] = useState<"Ativo" | "Esporádico" | "Ausente" | "Transição">("Ausente");
  const [salvandoContato, setSalvandoContato] = useState(false);

  // Formulário de Cadastro/Edição
  const [formId, setFormId] = useState("");
  const [formNome, setFormNome] = useState("");
  const [formContato1, setFormContato1] = useState("");
  const [formContato2, setFormContato2] = useState("");
  const [formAniversario, setFormAniversario] = useState("");
  const [formLinguagemAmor, setFormLinguagemAmor] = useState("");
  const [formMinisterio, setFormMinisterio] = useState("");
  const [formFaixa, setFormFaixa] = useState<"J1" | "J2" | "MIX">("J2");
  const [formDataEntrada, setFormDataEntrada] = useState("");
  const [formContatoPais, setFormContatoPais] = useState("");
  const [formNotas, setFormNotas] = useState("");
  const [formStatus, setFormStatus] = useState<"Ativo" | "Esporádico" | "Ausente" | "Transição">("Ativo");
  
  // Novos campos de Transição e GA
  const [formGa, setFormGa] = useState("GA Principal");
  const [formOrigemTransicao, setFormOrigemTransicao] = useState(false);
  const [formMotivoAusencia, setFormMotivoAusencia] = useState("");
  const [formDetalheAusencia, setFormDetalheAusencia] = useState("");
  const [formUltimoContato, setFormUltimoContato] = useState("");
  const [formResponsavelContato, setFormResponsavelContato] = useState("");

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar membros do servidor
      const { data: membrosData, error: membrosError } = await api
        .from('membros')
        .select('*')
        .eq('lider_id', liderId);

      if (membrosError) throw membrosError;

      const mappedMembros = (membrosData || []).map(mapToTS);
      setMembros(mappedMembros);

      // Carregar reuniões para histórico de presenças
      const { data: reunioesData, error: reunioesError } = await api
        .from('reunioes')
        .select('*, reuniao_presencas(membro_id)')
        .eq('lider_id', liderId);

      if (!reunioesError && reunioesData) {
        const mappedReunioes = (reunioesData || []).map(r => ({
          id: r.id,
          data: r.data,
          tema: r.tema,
          presentes: (r.reuniao_presencas || []).map((p: any) => p.membro_id)
        }));
        setReunioes(mappedReunioes);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados do servidor:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();

    if (filtroInicial === "ausentes") {
      setFiltroStatus("Ausente");
    } else if (filtroInicial === "transicao") {
      setFiltroStatus("Transição J1 ➔ J2");
    } else if (filtroInicial === "sem_ga") {
      setFiltroStatus("Sem GA");
    }
  }, [filtroInicial, liderId]);

  // Lista única de GAs existentes
  const listaGas = Array.from(
    new Set(
      membros
        .map(m => m.ga?.trim())
        .filter((g): g is string => !!g && g !== "Sem GA / A Definir" && g !== "Aguardando GA")
    )
  );

  // Abrir tela de cadastro
  const handleNovoMembro = (origemTransicaoPadrao = false) => {
    setFormId("");
    setFormNome("");
    setFormContato1("");
    setFormContato2("");
    setFormAniversario("");
    setFormLinguagemAmor("");
    setFormMinisterio("");
    setFormFaixa(origemTransicaoPadrao ? "J1" : "J2");
    setFormDataEntrada(new Date().toISOString().split("T")[0]);
    setFormContatoPais("");
    setFormNotas("");
    setFormStatus(origemTransicaoPadrao ? "Transição" : "Ativo");
    setFormGa(listaGas.length > 0 ? listaGas[0] : "GA Principal");
    setFormOrigemTransicao(origemTransicaoPadrao);
    setFormMotivoAusencia("");
    setFormDetalheAusencia("");
    setFormUltimoContato("");
    setFormResponsavelContato("");
    
    setView("cadastro");
  };

  // Abrir tela de edição de membro
  const handleEditarMembro = (m: Membro) => {
    setFormId(m.id);
    setFormNome(m.nome);
    setFormContato1(m.contato1);
    setFormContato2(m.contato2);
    setFormAniversario(m.aniversario);
    setFormLinguagemAmor(m.linguagemAmor || "");
    setFormMinisterio(m.ministerio || "");
    setFormFaixa(m.faixa || "J2");
    setFormDataEntrada(m.dataEntrada || "");
    setFormContatoPais(m.contatoPais || "");
    setFormNotas(m.notas || "");
    setFormStatus(m.status || "Ativo");
    setFormGa(m.ga || "GA Principal");
    setFormOrigemTransicao(!!m.origemTransicao);
    setFormMotivoAusencia(m.motivoAusencia || "");
    setFormDetalheAusencia(m.detalheAusencia || "");
    setFormUltimoContato(m.ultimoContato || "");
    setFormResponsavelContato(m.responsavelContato || "");

    setView("edicao");
  };

  // Abrir modal rápido para registrar contato pastoral e motivo de ausência
  const abrirModalContato = (m: Membro, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMembroParaContato(m);
    setContatoMotivo(m.motivoAusencia || (m.status === "Ausente" ? "Sem Resposta / Não Informado" : ""));
    setContatoDetalhe(m.detalheAusencia || "");
    setContatoData(new Date().toISOString().split("T")[0]);
    setContatoNovoStatus(m.status);
    setModalContatoAberto(true);
  };

  const salvarContatoRapido = async () => {
    if (!membroParaContato) return;
    setSalvandoContato(true);
    try {
      const atualizado: Membro = {
        ...membroParaContato,
        status: contatoNovoStatus,
        motivoAusencia: contatoMotivo,
        detalheAusencia: contatoDetalhe,
        ultimoContato: contatoData,
        faltas: contatoNovoStatus === "Ausente" ? 2 : contatoNovoStatus === "Ativo" ? 0 : membroParaContato.faltas
      };

      const payload = mapToDB(atualizado, liderId);
      const { error } = await api
        .from('membros')
        .update(payload)
        .eq('id', membroParaContato.id);

      if (error) throw error;

      setMembros(prev => prev.map(m => m.id === membroParaContato.id ? atualizado : m));
      if (membroSelecionado && membroSelecionado.id === membroParaContato.id) {
        setMembroSelecionado(atualizado);
      }
      setModalContatoAberto(false);
    } catch (err) {
      console.error("Erro ao salvar contato:", err);
      alert("Não foi possível salvar o contato pastoral.");
    } finally {
      setSalvandoContato(false);
    }
  };

  // Submeter formulário de criar ou editar
  const handleSalvarMembro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) return;

    setLoading(true);
    try {
      const dadosMembro: Omit<Membro, 'id'> = {
        nome: formNome.trim(),
        contato1: formContato1.trim(),
        contato2: formContato2.trim(),
        aniversario: formAniversario ? formAniversario : '',
        linguagemAmor: formLinguagemAmor.trim(),
        ministerio: formMinisterio.trim(),
        faixa: formFaixa,
        dataEntrada: formDataEntrada ? formDataEntrada : '',
        contatoPais: formContatoPais.trim(),
        notas: formNotas.trim(),
        status: formStatus,
        faltas: formStatus === "Ausente" ? 2 : 0,
        ga: formGa.trim() || "GA Principal",
        origemTransicao: formOrigemTransicao,
        motivoAusencia: formMotivoAusencia,
        detalheAusencia: formDetalheAusencia.trim(),
        ultimoContato: formUltimoContato,
        responsavelContato: formResponsavelContato.trim()
      };

      if (view === "cadastro") {
        const { data, error } = await api
          .from('membros')
          .insert(mapToDB(dadosMembro, liderId))
          .select();

        if (error) throw error;
        
        if (data && data[0]) {
          const novoMembro = mapToTS(data[0]);
          setMembros(prev => [...prev, novoMembro]);
          setMembroSelecionado(novoMembro);
        }
        setView("detalhe");
      } else {
        const { data, error } = await api
          .from('membros')
          .update(mapToDB({ ...dadosMembro, id: formId }, liderId))
          .eq('id', formId)
          .select();

        if (error) throw error;

        if (data && data[0]) {
          const atualizado = mapToTS(data[0]);
          setMembros(prev => prev.map(m => m.id === formId ? atualizado : m));
          setMembroSelecionado(atualizado);
        }
        setView("detalhe");
      }
    } catch (error: any) {
      console.error('Erro ao salvar membro:', error);
      alert('Não foi possível salvar os dados do jovem.');
    } finally {
      setLoading(false);
    }
  };

  // Deletar Membro
  const handleDeletarMembro = async (id: string) => {
    if (confirm("Tem certeza que deseja apagar a ficha deste jovem?")) {
      setLoading(true);
      try {
        const { error } = await api
          .from('membros')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setMembros(prev => prev.filter(m => m.id !== id));
        setView("lista");
        setMembroSelecionado(null);
      } catch (error: any) {
        console.error('Erro ao excluir membro:', error);
        alert('Não foi possível remover o participante.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Verificar aniversário nos próximos 7 dias
  const isAniversarianteProximo = (dataNiver: string) => {
    if (!dataNiver) return false;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const partes = dataNiver.split("-");
    if (partes.length < 2) return false;
    const mesNiver = parseInt(partes[1], 10) - 1;
    const diaNiver = parseInt(partes[2], 10);
    
    const niverEsteAno = new Date(hoje.getFullYear(), mesNiver, diaNiver);
    if (niverEsteAno.getTime() < hoje.getTime() - 1000 * 60 * 60 * 24) {
      niverEsteAno.setFullYear(hoje.getFullYear() + 1);
    }
    const diffTime = niverEsteAno.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  // Calcular bolinhas de presença para o histórico de reuniões
  const obterHistoricoPresenca = (membroId: string) => {
    const ultimasReunioes = [...reunioes]
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(-8);

    const circulos = [];
    for (let i = 0; i < 8; i++) {
      if (i < ultimasReunioes.length) {
        const r = ultimasReunioes[i];
        const presente = r.presentes ? r.presentes.includes(membroId) : false;
        circulos.push({
          estado: presente ? "presente" : "ausente",
          data: r.data,
          tema: r.tema
        });
      } else {
        circulos.push({
          estado: "sem_dado",
          data: "",
          tema: ""
        });
      }
    }
    return circulos;
  };

  // Estatísticas Rápidas da Transição J1 -> J2
  const jovensTransicao = membros.filter(m => m.origemTransicao || m.status === "Transição" || m.faixa === "J1");
  const jovensSemGa = membros.filter(m => !m.ga || m.ga === "Sem GA / A Definir" || m.ga === "Aguardando GA");
  const jovensAusentes = membros.filter(m => m.status === "Ausente" || m.faltas >= 2);

  // Filtragem dos membros
  const membrosFiltrados = membros.filter(m => {
    const buscaLower = busca.toLowerCase();
    const correspondeBusca = 
      m.nome.toLowerCase().includes(buscaLower) || 
      (m.ministerio && m.ministerio.toLowerCase().includes(buscaLower)) ||
      (m.ga && m.ga.toLowerCase().includes(buscaLower)) ||
      (m.motivoAusencia && m.motivoAusencia.toLowerCase().includes(buscaLower));
    
    if (!correspondeBusca) return false;

    // Filtro por GA específico
    if (filtroGa !== "Todos") {
      if (filtroGa === "Sem GA") {
        if (m.ga && m.ga !== "Sem GA / A Definir" && m.ga !== "Aguardando GA") return false;
      } else if (m.ga !== filtroGa) {
        return false;
      }
    }

    // Filtro por Categoria / Status
    if (filtroStatus === "Todos") return true;
    if (filtroStatus === "Transição J1 ➔ J2") {
      return m.origemTransicao || m.status === "Transição" || m.faixa === "J1";
    }
    if (filtroStatus === "Sem GA") {
      return !m.ga || m.ga === "Sem GA / A Definir" || m.ga === "Aguardando GA";
    }
    return m.status.toLowerCase() === filtroStatus.toLowerCase();
  });

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left">
      
      {loading && (
        <div className="fixed inset-0 bg-white/60 dark:bg-zinc-950/60 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f766e]" />
            <p className="text-[0.625rem] uppercase font-black tracking-wider text-[#0f766e]">Sincronizando Jovens e GAs...</p>
          </div>
        </div>
      )}

      {/* VISTA 1 — LISTA PRINCIPAL */}
      {view === "lista" && (
        <div className="space-y-4">
          
          {/* TOPO: TÍTULO E BOTÃO NOVO */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight leading-none flex items-center gap-1.5 font-sans">
                <Users className="w-5 h-5 text-teal-700 dark:text-teal-400" /> Acompanhamento de Jovens
              </h1>
              <p className="text-[0.625rem] uppercase font-black text-gray-400 mt-1 tracking-wider">
                Presença, Alocação em G.A e Motivos de Ausência
              </p>
            </div>
            <button
              id="btn-adicionar-membro"
              onClick={() => handleNovoMembro(false)}
              className="fixed bottom-20 md:bottom-8 right-6 md:right-8 z-30 p-4 bg-teal-700 hover:bg-teal-600 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 cursor-pointer transition-transform flex items-center justify-center"
              aria-label="Adicionar Novo Jovem"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* BUSCA E FILTROS */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-membros"
                type="text"
                placeholder="Buscar por nome, G.A, ministério ou motivo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white placeholder-gray-400"
              />
            </div>

            {/* FILTROS DE STATUS / CATEGORIA E DE G.A */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                id="filtro-status-membros"
                aria-label="Filtrar por situação"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="Todos">Todas as situações</option>
                <option value="Transição J1 ➔ J2">Transição J1 ➔ J2 ({jovensTransicao.length})</option>
                <option value="Sem GA">Sem G.A ({jovensSemGa.length})</option>
                <option value="Ativo">Ativos</option>
                <option value="Ausente">Ausentes ({jovensAusentes.length})</option>
                <option value="Esporádico">Esporádicos</option>
              </select>

              {listaGas.length > 0 && (
                <select
                  id="filtro-ga-membros"
                  aria-label="Filtrar por G.A"
                  value={filtroGa}
                  onChange={(e) => setFiltroGa(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="Todos">Todos os GAs</option>
                  {listaGas.map((gaNome) => (
                    <option key={gaNome} value={gaNome}>{gaNome}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* QUANTIDADE DE REGISTROS */}
          <div className="text-[0.625rem] font-semibold text-gray-400 uppercase tracking-widest leading-none flex justify-between items-center">
            <span>{membrosFiltrados.length} jovens encontrados</span>
            {(filtroStatus !== "Todos" || filtroGa !== "Todos") && (
              <button 
                onClick={() => { setFiltroStatus("Todos"); setFiltroGa("Todos"); }}
                className="text-teal-600 dark:text-teal-400 hover:underline font-bold text-[0.5625rem] cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* LISTA DE CARDS DE JOVENS */}
          {membrosFiltrados.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl text-gray-400 dark:text-zinc-500 space-y-2">
              <Users className="w-8 h-8 mx-auto opacity-40 text-teal-600" />
              <p className="text-xs font-semibold">Nenhum jovem encontrado nesta categoria.</p>
              <p className="text-[0.625rem] max-w-xs mx-auto text-gray-400">
                Ajuste os filtros ou clique no botão acima para cadastrar novos participantes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3">
              {membrosFiltrados.map((m) => {
                const isNiver = isAniversarianteProximo(m.aniversario);
                const idade = calcularIdade(m.aniversario);
                const isTransicao = m.origemTransicao || m.status === "Transição" || m.faixa === "J1";
                const isSemGa = !m.ga || m.ga === "Sem GA / A Definir" || m.ga === "Aguardando GA";
                const isAusente = m.status === "Ausente" || m.faltas >= 2;

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setMembroSelecionado(m);
                      setView("detalhe");
                    }}
                    className={`bg-white dark:bg-zinc-900 border rounded-2xl p-3.5 space-y-2.5 transition shadow-xs cursor-pointer hover:border-teal-500 ${
                      isAusente 
                        ? "border-rose-200/80 dark:border-rose-950/50 bg-rose-50/20 dark:bg-rose-950/5"
                        : isTransicao
                        ? "border-teal-200/80 dark:border-teal-950/50"
                        : "border-gray-100 dark:border-zinc-800"
                    }`}
                  >
                    {/* LINHA SUPERIOR: AVATAR, NOME, IDADE E STATUS */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarStyle(m.nome)}`}>
                          {getInitials(m.nome)}
                        </div>
                        
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate font-sans">
                              {m.nome}
                            </h4>
                            {idade !== null && (
                              <span className="text-[0.5625rem] font-bold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded-md shrink-0">
                                {idade} anos
                              </span>
                            )}
                            {isNiver && (
                              <span className="bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[0.5rem] font-bold px-1 rounded uppercase tracking-wide shrink-0">
                                Niver 🎉
                              </span>
                            )}
                          </div>

                          {/* TAG DE TRANSIÇÃO E GA */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[0.5938rem]">
                            {/* Tag do GA */}
                            {isSemGa ? (
                              <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-md font-black uppercase text-[0.5313rem] border border-amber-200 dark:border-amber-900/40">
                                ⚠️ Sem G.A
                              </span>
                            ) : (
                              <span className="text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-1.5 py-0.5 rounded-md font-bold text-[0.5313rem] border border-teal-100 dark:border-teal-900/30">
                                📍 {m.ga}
                              </span>
                            )}

                            {/* Tag de Transição Jovens 1 -> Jovens 2 */}
                            {isTransicao && (
                              <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-md font-black text-[0.5rem] uppercase tracking-wider border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> Transição J1 ➔ J2
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Pill */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[0.5313rem] font-black uppercase px-2 py-0.5 rounded-lg border tracking-wider shrink-0 ${
                          m.status === "Ativo"
                            ? "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/40"
                            : m.status === "Esporádico"
                            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40"
                            : m.status === "Ausente"
                            ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40"
                            : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40"
                        }`}>
                          {m.status}
                        </span>
                      </div>
                    </div>

                    {/* ALERTA DE MOTIVO DA AUSÊNCIA SE ESTIVER AUSENTE OU ESPORÁDICO */}
                    {(isAusente || m.status === "Esporádico" || m.motivoAusencia) && (
                      <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 p-2 rounded-xl text-left space-y-1">
                        <div className="flex items-center justify-between text-[0.5625rem] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Motivo da Ausência:
                          </span>
                          {m.ultimoContato && (
                            <span className="text-gray-400 font-normal">
                              Contato: {new Date(m.ultimoContato + "T12:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                        <p className="text-[0.6563rem] font-semibold text-slate-800 dark:text-zinc-200">
                          {m.motivoAusencia || "Sem resposta / Motivo ainda não apurado"}
                        </p>
                        {m.detalheAusencia && (
                          <p className="text-[0.5938rem] text-gray-500 dark:text-zinc-400 italic">
                            "{m.detalheAusencia}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* BOTÕES RÁPIDOS DE CONTATO PASTORAL */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-zinc-800/80 text-[0.625rem]">
                      <button
                        onClick={(e) => abrirModalContato(m, e)}
                        className="text-teal-700 dark:text-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3 h-3" /> Registrar Cuidado / Motivo
                      </button>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {m.contato1 && (
                          <>
                            <a
                              href={`tel:${m.contato1.replace(/\D/g, "")}`}
                              className="p-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-200 rounded-lg transition"
                              title="Ligar"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                            <a
                              href={gerarLinkWhatsApp(m, isAusente ? 'falta' : isTransicao ? 'acolhimento' : 'contato')}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[0.5625rem] flex items-center gap-1 transition"
                              title="Enviar WhatsApp Pastoral"
                            >
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2 — DETALHE DA FICHA DO JOVEM */}
      {view === "detalhe" && membroSelecionado && (
        <div className="w-full max-w-2xl mx-auto space-y-4 animate-slideUp">
          <header className="flex items-center gap-3">
            <button
              onClick={() => setView("lista")}
              className="p-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-slate-800 dark:text-white rounded-xl hover:bg-slate-50 transition cursor-pointer"
              aria-label="Voltar para a Lista"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-black uppercase text-gray-400 tracking-wider">Ficha Pastoral do Jovem</h2>
              <h1 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[210px] font-sans">
                {membroSelecionado.nome}
              </h1>
            </div>
          </header>

          {/* FICHA GERAL CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-4 space-y-4 text-xs">
            
            {/* AVATAR + EDIT BUTTON IN ROOF */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${getAvatarStyle(membroSelecionado.nome)}`}>
                  {getInitials(membroSelecionado.nome)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[0.625rem] font-black uppercase px-2 py-0.5 rounded-lg border tracking-wider shrink-0 ${
                      membroSelecionado.status === "Ativo"
                        ? "bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border-teal-200/40"
                        : "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200/40"
                    }`}>
                      {membroSelecionado.status}
                    </span>
                    {calcularIdade(membroSelecionado.aniversario) !== null && (
                      <span className="text-[0.625rem] font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
                        {calcularIdade(membroSelecionado.aniversario)} anos
                      </span>
                    )}
                  </div>
                  <p className="text-[0.625rem] text-gray-500 dark:text-zinc-400 mt-1 font-mono">
                    G.A: <span className="font-bold text-slate-800 dark:text-zinc-200">{membroSelecionado.ga || "Sem G.A"}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => abrirModalContato(membroSelecionado)}
                  className="p-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/35 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 rounded-xl cursor-pointer"
                  title="Registrar Contato Pastoral"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleEditarMembro(membroSelecionado)}
                  className="p-2.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/35 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40 rounded-xl cursor-pointer"
                  title="Editar ficha"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeletarMembro(membroSelecionado.id)}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/35 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 rounded-xl cursor-pointer"
                  title="Deletar jovem"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* DESTAQUE TRANSIÇÃO JOVENS 1 -> JOVENS 2 */}
            <div className="bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 p-3 rounded-xl space-y-1.5">
              <div className="flex justify-between items-center text-[0.5625rem] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Acompanhamento de Integração
                </span>
                <span className="text-teal-700 dark:text-teal-400 font-bold">
                  {membroSelecionado.origemTransicao ? "Transição J1 ➔ J2 Ativa" : "Membro Regular J2"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[0.6563rem]">
                <div>
                  <span className="text-gray-400 text-[0.5313rem] uppercase font-bold block">Grupo de Amigos (G.A):</span>
                  <span className="font-bold text-slate-800 dark:text-white">📍 {membroSelecionado.ga || "Ainda sem G.A (Definir)"}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[0.5313rem] uppercase font-bold block">Faixa Etária / Manual:</span>
                  <span className="font-bold text-slate-800 dark:text-white">Faixa {membroSelecionado.faixa || "J2"}</span>
                </div>
              </div>
            </div>

            {/* SEÇÃO MOTIVO DA AUSÊNCIA (SE HOUVER) */}
            <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 p-3 rounded-xl space-y-1">
              <div className="flex justify-between items-center text-[0.5625rem] font-black uppercase text-amber-800 dark:text-amber-400">
                <span>Motivo da Ausência / Situação na Igreja:</span>
                <button
                  onClick={() => abrirModalContato(membroSelecionado)}
                  className="text-teal-700 dark:text-teal-400 hover:underline font-bold text-[0.5313rem] cursor-pointer"
                >
                  Editar Motivo
                </button>
              </div>
              <p className="font-bold text-slate-800 dark:text-white text-xs">
                {membroSelecionado.motivoAusencia || "Frequência normal / Sem ausências registradas"}
              </p>
              {membroSelecionado.detalheAusencia && (
                <p className="text-[0.625rem] text-gray-600 dark:text-zinc-300 italic">
                  "{membroSelecionado.detalheAusencia}"
                </p>
              )}
              {membroSelecionado.ultimoContato && (
                <p className="text-[0.5625rem] text-gray-400 pt-0.5">
                  Último contato pastoral registrado em: <strong>{new Date(membroSelecionado.ultimoContato + "T12:00:00").toLocaleDateString("pt-BR")}</strong>
                  {membroSelecionado.responsavelContato && ` por ${membroSelecionado.responsavelContato}`}
                </p>
              )}
            </div>

            {/* HISTÓRICO DE PRESENÇA (ÚLTIMAS 8 REUNIÕES) */}
            <div className="space-y-1.5 pb-2">
              <div className="flex justify-between items-center text-[0.5625rem] font-black text-gray-400 uppercase tracking-wide font-sans">
                <span>Presença Linear nas Reuniões de GA (8 Encontros)</span>
                <span className="text-gray-400 font-bold">Esquerda para Direita →</span>
              </div>
              <div className="flex justify-between bg-slate-50 dark:bg-zinc-950 p-2.5 border border-gray-100 dark:border-zinc-800 rounded-xl">
                {obterHistoricoPresenca(membroSelecionado.id).map((c, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-1"
                    title={c.tema ? `${new Date(c.data + "T12:00:00").toLocaleDateString("pt-BR")} \nTema: ${c.tema}` : "Sem dados"}
                  >
                    <div className={`w-4 h-4 rounded-full border ${
                      c.estado === "presente"
                        ? "bg-emerald-500 border-emerald-600 shadow-xs"
                        : c.estado === "ausente"
                        ? "bg-rose-400 border-rose-500"
                        : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"
                    }`} />
                    <span className="text-[0.4688rem] font-mono text-gray-400">R{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CAMPOS EM FORMATO GRID */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100 dark:border-zinc-800/80">
              <div>
                <span className="block text-[0.5625rem] font-black text-gray-400 uppercase tracking-wide">Celular WhatsApp</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{membroSelecionado.contato1 || "Nenhum"}</span>
              </div>
              <div>
                <span className="block text-[0.5625rem] font-black text-gray-400 uppercase tracking-wide">Celular Alternativo</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{membroSelecionado.contato2 || "Nenhum"}</span>
              </div>
              <div>
                <span className="block text-[0.5625rem] font-black text-gray-400 uppercase tracking-wide">Dia do Aniversário</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  {membroSelecionado.aniversario 
                    ? new Date(membroSelecionado.aniversario + "T12:00:00").toLocaleDateString("pt-BR") 
                    : "Não informado"}
                </span>
              </div>
              <div>
                <span className="block text-[0.5625rem] font-black text-gray-400 uppercase tracking-wide">Linguagem de Amor</span>
                <span className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-0.5">
                  <Heart className="w-3 h-3 fill-indigo-500 inline text-indigo-500 shrink-0" /> 
                  <span className="line-clamp-1">{membroSelecionado.linguagemAmor || "Não informada"}</span>
                </span>
              </div>
            </div>

            {/* CONTATO DOS PAIS / RESPONSÁVEIS */}
            <div className="pb-3 border-b border-gray-100 dark:border-zinc-800/80">
              <span className="block text-[0.5625rem] font-black text-gray-400 uppercase tracking-wide">Contato dos Pais ou Responsáveis</span>
              <p className="font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                {membroSelecionado.contatoPais || "Não cadastrado"}
              </p>
            </div>

            {/* NOTAS PASTORAIS LIVRES */}
            <div className="space-y-1 bg-yellow-50/20 dark:bg-amber-950/5 border border-yellow-100 dark:border-amber-900/30 p-2.5 rounded-2xl">
              <span className="block text-[0.5625rem] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-500 fill-amber-500" /> Notas Pastorais & Pedidos de Oração
              </span>
              <p className="text-[0.6875rem] leading-relaxed text-slate-700 dark:text-zinc-300 italic whitespace-pre-line">
                {membroSelecionado.notas || "Nenhuma nota pastoral cadastrada. Você pode editar para adicionar lembretes."}
              </p>
            </div>

            {/* BOTÕES DE AÇÕES DIRETAS (LIGAR / WHATSAPP PASTORAL) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <a
                href={membroSelecionado.contato1 ? `tel:${membroSelecionado.contato1.replace(/\D/g, "")}` : "#"}
                className={`h-11 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 border transition ${
                  membroSelecionado.contato1
                    ? "bg-white dark:bg-zinc-800 hover:bg-slate-50 border-gray-200 text-slate-800 dark:text-white dark:border-zinc-800 cursor-pointer"
                    : "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400 border-transparent"
                }`}
              >
                <Phone className="w-4 h-4 text-teal-700 dark:text-teal-400" /> Ligar Celular
              </a>

              <a
                href={gerarLinkWhatsApp(
                  membroSelecionado, 
                  membroSelecionado.status === "Ausente" ? 'falta' : membroSelecionado.origemTransicao ? 'acolhimento' : 'contato'
                )}
                target="_blank"
                rel="noreferrer"
                className={`h-11 text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 text-white transition cursor-pointer ${
                  membroSelecionado.contato1
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400"
                }`}
              >
                <MessageCircle className="w-4 h-4 text-white" /> WhatsApp Pastoral
              </a>
            </div>

          </div>
        </div>
      )}

      {/* VISTA 3 — FORMULÁRIO DE CADASTRO OU EDIÇÃO */}
      {(view === "cadastro" || view === "edicao") && (
        <form onSubmit={handleSalvarMembro} className="w-full max-w-2xl mx-auto space-y-4 animate-slideUp">
          <header className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (view === "cadastro") {
                  setView("lista");
                } else {
                  setView("detalhe");
                }
              }}
              className="p-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-slate-800 dark:text-white rounded-xl hover:bg-slate-50 transition cursor-pointer"
              aria-label="Cancelar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-black uppercase text-gray-400 tracking-wider">
                {view === "cadastro" ? "Nova Ficha de Jovem" : "Ajustar Cadastro"}
              </h2>
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                {view === "cadastro" ? "Registrar Jovem no App" : "Editar Ficha"}
              </h1>
            </div>
          </header>

          {/* CAMPOS DO FORMULARIO CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-5 space-y-4 text-xs font-sans">
            
            {/* TOGGLE ESPECIAL: TRANSIÇÃO JOVENS 1 -> JOVENS 2 */}
            <div className="p-3.5 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-zinc-900 border border-teal-200 dark:border-teal-900/50 rounded-2xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formOrigemTransicao}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormOrigemTransicao(checked);
                    if (checked) {
                      setFormFaixa("J1");
                      if (formStatus === "Ativo") setFormStatus("Transição");
                    } else {
                      setFormFaixa("J2");
                      if (formStatus === "Transição") setFormStatus("Ativo");
                    }
                  }}
                  className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                />
                <span className="font-bold text-teal-900 dark:text-teal-200 text-xs flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Jovem vindo do Jovens 1 (até 17 anos) para o Jovens 2 (18 a 30)
                </span>
              </label>
              <p className="text-[0.625rem] text-teal-700 dark:text-teal-400 pl-6 leading-tight">
                Marque para acompanhar a integração, frequência nas primeiras semanas e alocação no G.A.
              </p>
            </div>

            {/* Nome Completo */}
            <div className="space-y-1">
              <label htmlFor="form-nome" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest font-sans">
                Nome do Jovem *
              </label>
              <input
                id="form-nome"
                type="text"
                required
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Ex. Samuel Santos"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* QUAL G.A ESTÁ E STATUS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="form-ga" className="block text-[0.625rem] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest font-sans">
                  Qual G.A está? *
                </label>
                <input
                  id="form-ga"
                  type="text"
                  required
                  value={formGa}
                  onChange={(e) => setFormGa(e.target.value)}
                  placeholder="Ex: GA Ebenezer ou Sem GA"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="form-status" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest font-sans">
                  Status de Presença
                </label>
                <select
                  id="form-status"
                  value={formStatus}
                  onChange={(e) => {
                    const novoStatus = e.target.value as any;
                    setFormStatus(novoStatus);
                    if (novoStatus === "Ausente" && !formMotivoAusencia) {
                      setFormMotivoAusencia("Sem Resposta / Não Informado");
                    }
                  }}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white cursor-pointer font-bold"
                >
                  <option value="Ativo">Ativo (Frequente)</option>
                  <option value="Transição">Em Transição (Novo no J2)</option>
                  <option value="Esporádico">Esporádico (Frequência irregular)</option>
                  <option value="Ausente">Ausente (2+ faltas - Alerta!)</option>
                </select>
              </div>
            </div>

            {/* SE ESTIVER AUSENTE OU ESPORÁDICO: QUAL O MOTIVO? */}
            {(formStatus === "Ausente" || formStatus === "Esporádico" || formMotivoAusencia) && (
              <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl space-y-3">
                <div className="flex items-center gap-1 text-[0.625rem] font-black uppercase tracking-wider text-rose-800 dark:text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Motivo da Ausência Pastoral
                </div>

                <div className="space-y-1">
                  <label htmlFor="form-motivo" className="block text-[0.5938rem] font-bold text-gray-600 dark:text-gray-300">
                    Se não está vindo, qual o motivo principal?
                  </label>
                  <select
                    id="form-motivo"
                    value={formMotivoAusencia}
                    onChange={(e) => setFormMotivoAusencia(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="">Selecione o motivo...</option>
                    {MOTIVOS_AUSENCIA_PADRAO.map(m => (
                      <option key={m.id} value={m.id}>{m.icone} {m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="form-detalhe-ausencia" className="block text-[0.5938rem] font-bold text-gray-600 dark:text-gray-300">
                    Detalhes do Motivo / Situação Atual:
                  </label>
                  <input
                    id="form-detalhe-ausencia"
                    type="text"
                    value={formDetalheAusencia}
                    onChange={(e) => setFormDetalheAusencia(e.target.value)}
                    placeholder="Ex. Trabalha até as 22h aos sábados / Provas do vestibular"
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor="form-ultimo-contato" className="block text-[0.5938rem] font-bold text-gray-600 dark:text-gray-300">
                      Data do Último Contato
                    </label>
                    <input
                      id="form-ultimo-contato"
                      type="date"
                      value={formUltimoContato}
                      onChange={(e) => setFormUltimoContato(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="form-resp-contato" className="block text-[0.5938rem] font-bold text-gray-600 dark:text-gray-300">
                      Quem contatou?
                    </label>
                    <input
                      id="form-resp-contato"
                      type="text"
                      value={formResponsavelContato}
                      onChange={(e) => setFormResponsavelContato(e.target.value)}
                      placeholder="Ex. Líder João"
                      className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TELEFONES */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="form-contato1" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest font-sans">
                  Celular Whatsapp
                </label>
                <input
                  id="form-contato1"
                  type="text"
                  value={formContato1}
                  onChange={(e) => setFormContato1(e.target.value)}
                  placeholder="Ex. 11999998888"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="form-contato2" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest font-sans">
                  Fixo ou Alternativo
                </label>
                <input
                  id="form-contato2"
                  type="text"
                  value={formContato2}
                  onChange={(e) => setFormContato2(e.target.value)}
                  placeholder="Ex. 11988887777"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* ANIVERSÁRIO E LINGUAGEM DE AMOR */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="form-aniversario" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest font-sans">
                  Data de Nascimento (Idade)
                </label>
                <input
                  id="form-aniversario"
                  type="date"
                  value={formAniversario}
                  onChange={(e) => setFormAniversario(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="form-linguagem" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest font-sans">
                  Linguagem de Amor
                </label>
                <select
                  id="form-linguagem"
                  value={formLinguagemAmor}
                  onChange={(e) => setFormLinguagemAmor(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="">Selecione...</option>
                  <option value="Palavras de Afirmação">Palavras de Afirmação</option>
                  <option value="Tempo de Qualidade">Tempo de Qualidade</option>
                  <option value="Atos de Serviço">Atos de Serviço</option>
                  <option value="Presentes">Presentes</option>
                  <option value="Toque Físico">Toque Físico</option>
                </select>
              </div>
            </div>

            {/* MINISTÉRIO E FAIXA */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="form-ministerio" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest font-sans">
                  Ministério
                </label>
                <input
                  id="form-ministerio"
                  type="text"
                  value={formMinisterio}
                  onChange={(e) => setFormMinisterio(e.target.value)}
                  placeholder="Ex. Louvor, Mídia, Recepção..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="form-faixa" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest font-sans">
                  Faixa
                </label>
                <select
                  id="form-faixa"
                  value={formFaixa}
                  onChange={(e) => setFormFaixa(e.target.value as "J1" | "J2" | "MIX")}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                >
                  <option value="J1">J1 (Até 17 anos)</option>
                  <option value="J2">J2 (18 a 30 anos)</option>
                  <option value="MIX">MIX (Liderança / Geral)</option>
                </select>
              </div>
            </div>

            {/* Contato Pais / Guardião */}
            <div className="space-y-1">
              <label htmlFor="form-pais" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest font-sans">
                Contato dos Pais ou Responsáveis (Nome + Fone)
              </label>
              <input
                id="form-pais"
                type="text"
                value={formContatoPais}
                onChange={(e) => setFormContatoPais(e.target.value)}
                placeholder="Ex. Maria Santos - 11988887777"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Notas pastorais privadas */}
            <div className="space-y-1">
              <label htmlFor="form-notas" className="block text-[0.625rem] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest font-sans flex items-center gap-1">
                Acompanhamento Pastoral Privado
              </label>
              <textarea
                id="form-notas"
                rows={3}
                value={formNotas}
                onChange={(e) => setFormNotas(e.target.value)}
                placeholder="Observações confidenciais, pedidos específicos de oração, histórico espiritual..."
                className="w-full text-xs p-3 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white leading-relaxed resize-none"
              />
            </div>

            {/* SAVE BUTTON */}
            <button
              id="btn-submeter"
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-teal-700 hover:bg-teal-600 font-bold text-xs uppercase tracking-widest rounded-xl text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Salvar Ficha do Jovem
            </button>

          </div>
        </form>
      )}

      {/* MODAL RÁPIDO: REGISTRAR CONTATO PASTORAL / ATUALIZAR MOTIVO */}
      {modalContatoAberto && membroParaContato && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-xl text-left animate-slideUp">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[0.5625rem] font-black uppercase tracking-widest text-teal-600">Cuidado Pastoral</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{membroParaContato.nome}</h3>
                <p className="text-[0.625rem] text-gray-500">G.A: {membroParaContato.ga || "Sem G.A"}</p>
              </div>
              <button
                onClick={() => setModalContatoAberto(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[0.625rem] font-black text-gray-500 uppercase tracking-wider">
                  Status Atual de Frequência:
                </label>
                <select
                  value={contatoNovoStatus}
                  onChange={(e) => setContatoNovoStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                >
                  <option value="Ativo">✅ Ativo (Está frequentando)</option>
                  <option value="Transição">🌱 Em Transição J1 ➔ J2</option>
                  <option value="Esporádico">⚠️ Esporádico (Vem pouco)</option>
                  <option value="Ausente">🚨 Ausente (Afastado / Faltando)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[0.625rem] font-black text-gray-500 uppercase tracking-wider">
                  Qual o motivo da ausência / situação?
                </label>
                <select
                  value={contatoMotivo}
                  onChange={(e) => setContatoMotivo(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-white"
                >
                  <option value="">Nenhum / Frequência normal</option>
                  {MOTIVOS_AUSENCIA_PADRAO.map(m => (
                    <option key={m.id} value={m.id}>{m.icone} {m.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[0.625rem] font-black text-gray-500 uppercase tracking-wider">
                  O que o jovem relatou no contato?
                </label>
                <textarea
                  rows={2}
                  value={contatoDetalhe}
                  onChange={(e) => setContatoDetalhe(e.target.value)}
                  placeholder="Ex: Teve escala de trabalho aos sábados, pediu oração pela família..."
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-white resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[0.625rem] font-black text-gray-500 uppercase tracking-wider">
                  Data do Contato:
                </label>
                <input
                  type="date"
                  value={contatoData}
                  onChange={(e) => setContatoData(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalContatoAberto(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvandoContato}
                onClick={salvarContatoRapido}
                className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {salvandoContato ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar Cuidado
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
