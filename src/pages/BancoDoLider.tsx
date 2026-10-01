import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Download, 
  Plus, 
  MoreVertical, 
  X, 
  Check, 
  Edit2, 
  Trash2, 
  ArrowLeft,
  PlusCircle,
  BookOpen,
  Target,
  FileText,
  Upload,
  Eye,
  Printer,
  Loader2,
  Filter,
  Tag
} from "lucide-react";
import * as mammoth from "mammoth";
import BibleReader from "../components/BibleReader";
import { api } from "../lib/api";
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

// ==========================================
// MODELOS DE DADOS
// ==========================================

export interface Tema {
  id: string;
  titulo: string;      // "Finanças", "Ansiedade"
  emoji: string;       // "💰", "😰"
  cor: "teal" | "amber" | "blue" | "purple" | "rose" | "emerald" | "indigo";
}

export interface Recurso {
  id: string;
  tipo: "versiculo" | "atividade" | "nota" | "meditacao";
  conteudo: string;       // texto do versículo, descrição da atividade ou nota livre
  referencia: string;     // "Filipenses 4:19" (só versículos, vazio nos outros)
  temas: string[];        // array de IDs de temas — pode ter vários
  criadoEm: string;       // ISO date
  
  // Campos opcionais/adicionais para meditações
  titulo?: string;
  semana?: string;
  versiculoBase?: string;
  periodoSemanas?: number;
  nomeArquivo?: string;
  tipoArquivo?: string;
  liderId?: string;
}

// ==========================================
// PALETA DE CORES AUXILIAR
// ==========================================

const COLOR_MAP = {
  teal: {
    bgActive: "bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white",
    badge: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-500/20",
    text: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
    borderActive: "border-teal-600 dark:border-teal-400"
  },
  amber: {
    bgActive: "bg-amber-500 dark:bg-amber-600 hover:bg-amber-700 text-white",
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-600",
    borderActive: "border-amber-500 dark:border-amber-500"
  },
  blue: {
    bgActive: "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white",
    badge: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    borderActive: "border-blue-600 dark:border-blue-400"
  },
  purple: {
    bgActive: "bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 text-white",
    badge: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    dot: "bg-purple-500",
    borderActive: "border-purple-600 dark:border-purple-400"
  },
  rose: {
    bgActive: "bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 text-white",
    badge: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    borderActive: "border-rose-600 dark:border-rose-400"
  },
  emerald: {
    bgActive: "bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 text-white",
    badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    borderActive: "border-emerald-600 dark:border-emerald-400"
  },
  indigo: {
    bgActive: "bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white",
    badge: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
    borderActive: "border-indigo-600 dark:border-indigo-400"
  }
};

const DEFAULT_TEMAS: Tema[] = [
  { id: "t_financas", emoji: "💰", titulo: "Finanças", cor: "amber" },
  { id: "t_ansiedade", emoji: "😰", titulo: "Ansiedade", cor: "teal" },
  { id: "t_relacionamentos", emoji: "💔", titulo: "Relacionamentos", cor: "rose" },
  { id: "t_vida_espiritual", emoji: "🙏", titulo: "Vida Espiritual", cor: "purple" },
  { id: "t_familia", emoji: "👨👩👧", titulo: "Família", cor: "blue" }
];

const DEFAULT_RECURSOS: Recurso[] = [
  {
    id: "r_1",
    tipo: "versiculo",
    conteudo: "Ninguém pode servir a dois senhores; porque ou há de odiar um e amar o outro, ou se dedicará a um e desprezará o outro. Não podeis servir a Deus e às riquezas.",
    referencia: "Mateus 6:24",
    temas: ["t_financas"],
    criadoEm: "2026-06-01T12:00:00.000Z"
  },
  {
    id: "r_2",
    tipo: "versiculo",
    conteudo: "O meu Deus suprirá todas as vossas necessidades segundo as suas riquezas em glória, em Cristo Jesus.",
    referencia: "Filipenses 4:19",
    temas: ["t_financas", "t_vida_espiritual"],
    criadoEm: "2026-06-02T12:00:00.000Z"
  },
  {
    id: "r_3",
    tipo: "versiculo",
    conteudo: "Não andeis ansiosos por coisa alguma; antes em tudo apresentai as vossas petições diante de Deus por meio de orações e súplicas, com ações de graças.",
    referencia: "Filipenses 4:6-7",
    temas: ["t_ansiedade", "t_vida_espiritual"],
    criadoEm: "2026-06-03T12:00:00.000Z"
  },
  {
    id: "r_4",
    tipo: "versiculo",
    conteudo: "O Senhor é o meu pastor, nada me faltará.",
    referencia: "Salmos 23:1",
    temas: ["t_ansiedade"],
    criadoEm: "2026-06-04T12:00:00.000Z"
  },
  {
    id: "r_5",
    tipo: "versiculo",
    conteudo: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha. Não maltrata, não procura seus interesses, não se ira facilmente, não guarda rancor.",
    referencia: "1 Coríntios 13:4-7",
    temas: ["t_relacionamentos", "t_familia"],
    criadoEm: "2026-06-05T12:00:00.000Z"
  },
  {
    id: "r_6",
    tipo: "versiculo",
    conteudo: "Sede uns para com os outros bondosos, compassivos, perdoando-vos uns aos outros, como também Deus vos perdoou em Cristo.",
    referencia: "Efésios 4:32",
    temas: ["t_relacionamentos", "t_familia"],
    criadoEm: "2026-06-05T13:00:00.000Z"
  },
  {
    id: "r_7",
    tipo: "atividade",
    conteudo: "Estudo sobre mordomia cristã — 3 encontros discutindo uso responsável dos recursos que Deus nos confia.",
    referencia: "",
    temas: ["t_financas"],
    criadoEm: "2026-06-05T10:00:00.000Z"
  },
  {
    id: "r_8",
    tipo: "atividade",
    conteudo: "Exercício de oração focada por 7 dias — entregar uma preocupação específica a Deus por dia e registrar as respostas.",
    referencia: "",
    temas: ["t_ansiedade", "t_vida_espiritual"],
    criadoEm: "2026-06-05T11:00:00.000Z"
  },
  {
    id: "r_9",
    tipo: "atividade",
    conteudo: "Conversa pastoral estruturada + oração conjunta sobre o conflito específico do relacionamento.",
    referencia: "",
    temas: ["t_relacionamentos"],
    criadoEm: "2026-06-05T11:30:00.000Z"
  },
  {
    id: "r_10",
    tipo: "nota",
    conteudo: "Membros com problemas financeiros frequentes: verificar se há dívidas e indicar aconselhamento com o pastor antes de avançar em orientação espiritual.",
    referencia: "",
    temas: ["t_financas"],
    criadoEm: "2026-06-05T09:00:00.000Z"
  }
];

const EMOJI_OPTIONS = [
  "💰", "😰", "💔", "🙏", "👨👩👧", "🔥", "⚡", "🌿", "❤️", "🏠", 
  "🎯", "📖", "✝️", "🕊️", "💡", "🌊", "⚔️", "🤝", "🌱", "🔑"
];

const COLOR_OPTIONS: Tema["cor"][] = [
  "teal", "amber", "blue", "purple", "rose", "emerald", "indigo"
];

// Helper models mapping
const mapToTSTema = (db: any): Tema => ({
  id: db.id,
  titulo: db.titulo || '',
  emoji: db.emoji || '🙏',
  cor: db.cor || 'teal',
});

const mapToTSRecurso = (db: any): Recurso => ({
  id: db.id,
  tipo: db.tipo || 'versiculo',
  conteudo: db.conteudo || '',
  referencia: db.referencia || '',
  temas: Array.isArray(db.temas) ? db.temas : (db.temas ? JSON.parse(db.temas) : []),
  criadoEm: db.criado_em || new Date().toISOString(),
  titulo: db.titulo,
  semana: db.semana,
  versiculoBase: db.versiculo_base,
  periodoSemanas: db.periodo_semanas,
  nomeArquivo: db.nome_arquivo,
  tipoArquivo: db.tipo_arquivo,
  liderId: db.lider_id
});

interface BancoDoLiderProps {
  onVoltar?: () => void;
  liderId: string;
}

export default function BancoDoLider({ onVoltar, liderId }: BancoDoLiderProps) {
  // ==========================================
  // ESTADOS PRINCIPAIS
  // ==========================================
  const [temas, setTemas] = useState<Tema[]>([]);
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // NOVOS ESTADOS DE FILTRAGEM
  const [activeTipo, setActiveTipo] = useState<"versiculo" | "atividade" | "nota" | "meditacao" | null>(null);
  const [selectedTemas, setSelectedTemas] = useState<string[]>([]); // transient list within bottom sheet
  const [appliedTemas, setAppliedTemas] = useState<string[]>([]); // final applied thematic filters (OR query)
  const [showTemasSheet, setShowTemasSheet] = useState<boolean>(false);

  // Busca
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modais de Ações do Tema (Toque Longo / Cliques)
  const [showThemeActionsModal, setShowThemeActionsModal] = useState(false);
  const [selectedTemaForAction, setSelectedTemaForAction] = useState<Tema | null>(null);

  // Modais de Ações do Recurso
  const [showRecursoActionsSheet, setShowRecursoActionsSheet] = useState(false);
  const [selectedRecursoForAction, setSelectedRecursoForAction] = useState<Recurso | null>(null);

  // Modal de Criar/Editar Recurso
  const [showRecursoModal, setShowRecursoModal] = useState(false);
  const [recursoModalMode, setRecursoModalMode] = useState<"criar" | "editar">("criar");
  const [editingRecursoId, setEditingRecursoId] = useState<string | null>(null);
  const [recursoFormTipo, setRecursoFormTipo] = useState<"versiculo" | "atividade" | "nota" | "meditacao">("versiculo");
  const [recursoFormConteudo, setRecursoFormConteudo] = useState("");
  const [recursoFormReferencia, setRecursoFormReferencia] = useState("");
  const [recursoFormTemas, setRecursoFormTemas] = useState<string[]>([]);

  // Estados dos Campos Exclusivos para Meditação
  const [recursoFormTitulo, setRecursoFormTitulo] = useState("");
  const [recursoFormSemana, setRecursoFormSemana] = useState("");
  const [recursoFormVersiculoBase, setRecursoFormVersiculoBase] = useState("");
  const [recursoFormPeriodo, setRecursoFormPeriodo] = useState<number>(1);
  const [recursoFormNomeArquivo, setRecursoFormNomeArquivo] = useState("");
  const [recursoFormTipoArquivo, setRecursoFormTipoArquivo] = useState("");
  const [recursoFormTextoExtraido, setRecursoFormTextoExtraido] = useState("");
  const [recursoFormBase64, setRecursoFormBase64] = useState("");
  const [selectedFileObject, setSelectedFileObject] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);

  // Estados do Visualizador de Meditação
  const [activeMeditacao, setActiveMeditacao] = useState<Recurso | null>(null);
  const [activeMeditacaoTexto, setActiveMeditacaoTexto] = useState<string>("");
  const [activeMeditacaoBase64, setActiveMeditacaoBase64] = useState<string>("");
  const [medDetailTab, setMedDetailTab] = useState<"visualizar" | "texto">("visualizar");
  const [searchTermInMedia, setSearchTermInMedia] = useState("");
  const [activeBibleRef, setActiveBibleRef] = useState<string | null>(null);

  const [pdfPaginas, setPdfPaginas] = useState<HTMLCanvasElement[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfErro, setPdfErro] = useState<string | null>(null);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const recursoAtivo = activeMeditacao ? {
    ...activeMeditacao,
    texto_extraido: activeMeditacao.conteudo || "",
    arquivo_path: `${activeMeditacao.id}.${activeMeditacao.tipoArquivo || "pdf"}`
  } : null;

  const abrirDocumento = async () => {
    if (!recursoAtivo?.arquivo_path) return;
    try {
      const { data, error } = await api.storage
        .from('meditacoes')
        .createSignedUrl(recursoAtivo.arquivo_path, 3600);
      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err: any) {
      console.error("Erro abrirDocumento:", err);
      alert("Não foi possível gerar a rota de exibição.");
    }
  };

  const carregarPdfComPdfJs = async (arquivePath: string) => {
    setLoadingPdf(true);
    setPdfErro(null);
    setPdfPaginas([]);
    
    try {
      // Baixar o arquivo do servidor
      const { data: blob, error } = await api.storage
        .from('meditacoes')
        .download(arquivePath);
      
      if (error) throw error;
      
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPaginas(pdf.numPages);
      
      const canvases: HTMLCanvasElement[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.8 });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%';
        canvas.style.borderRadius = '8px';
        canvas.style.marginBottom = '12px';
        canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        
        await page.render({ canvasContext: ctx, viewport }).promise;
        canvases.push(canvas);
      }
      
      setPdfPaginas(canvases);
    } catch (err: any) {
      setPdfErro('Não foi possível carregar o PDF: ' + err.message);
    } finally {
      setLoadingPdf(false);
    }
  };

  useEffect(() => {
    if (activeMeditacao && recursoAtivo && recursoAtivo.arquivo_path) {
      carregarPdfComPdfJs(recursoAtivo.arquivo_path);
    }
  }, [activeMeditacao]);

  // Cache em memória dos textos das meditações para busca global
  const [meditacoesConteudos, setMeditacoesConteudos] = useState<Record<string, string>>({});

  // Modal de Criar/Editar Tema
  const [showTemaModal, setShowTemaModal] = useState(false);
  const [temaModalMode, setTemaModalMode] = useState<"criar" | "editar">("criar");
  const [editingTemaId, setEditingTemaId] = useState<string | null>(null);
  const [temaFormTitulo, setTemaFormTitulo] = useState("");
  const [temaFormEmoji, setTemaFormEmoji] = useState("🙏");
  const [temaFormCor, setTemaFormCor] = useState<Tema["cor"]>("teal");

  // Timer para detecção de Pointer Long-Press
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggered = useRef(false);

  // ==========================================
  // CARREGAMENTO SEGURO DOS DADOS DOS TEMAS E RECURSOS
  // ==========================================
  const carregarDadosBanco = async () => {
    setLoading(true);
    try {
      // 1. Carregar temas do Líder ou Globais (lider_id IS NULL)
      const { data: dbTemas, error: errorTemas } = await api
        .from('banco_temas')
        .select('*')
        .or(`lider_id.eq.${liderId},lider_id.is.null`);

      if (errorTemas) throw errorTemas;

      let listTemas = (dbTemas || []).map(mapToTSTema);
      if (listTemas.length === 0) {
        // Se a DB estiver vazia, usamos os padrões locais
        listTemas = DEFAULT_TEMAS;
      }
      setTemas(listTemas);

      // 2. Carregar recursos do Líder ou Globais
      const { data: dbRecursos, error: errorRecursos } = await api
        .from('banco_recursos')
        .select('*')
        .or(`lider_id.eq.${liderId},lider_id.is.null`)
        .order('criado_em', { ascending: false });

      if (errorRecursos) throw errorRecursos;

      let listRecursos = (dbRecursos || []).map(mapToTSRecurso);
      if (listRecursos.length === 0) {
        // Se vazia na DB, usamos o startup mock local
        listRecursos = DEFAULT_RECURSOS;
      }
      setRecursos(listRecursos);

    } catch (err: any) {
      console.error("Erro ao carregar Banco do Líder:", err);
      // Fallback elegante
      setTemas(DEFAULT_TEMAS);
      setRecursos(DEFAULT_RECURSOS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosBanco();
  }, [liderId]);

  // Sincronizar cache de conteúdo de meditações
  useEffect(() => {
    const cache: Record<string, string> = {};
    recursos.forEach(r => {
      if (r.tipo === "meditacao") {
        cache[r.id] = r.conteudo || "";
      }
    });
    setMeditacoesConteudos(cache);
  }, [recursos]);

  // ==========================================
  // FILTRAGEM DINÂMICA & CONTABILIZAÇÃO (com lógica robusta)
  // ==========================================
  const filteredRecursos = recursos.filter(r => {
    // 1. Filtro de tipo ativo (se selecionado)
    if (activeTipo !== null && r.tipo !== activeTipo) {
      return false;
    }

    // 2. Lógica OR de Temas aplicados
    if (appliedTemas.length > 0) {
      const matchAppliedTheme = r.temas.some(tid => appliedTemas.includes(tid));
      if (!matchAppliedTheme) return false;
    }
    
    // 3. Filtro do termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const contentMatches = r.conteudo.toLowerCase().includes(term);
      const refMatches = r.referencia.toLowerCase().includes(term);
      
      // Encontra IDs de temas que combinem com a busca de texto
      const matchedThemeIds = temas
        .filter(t => t.titulo.toLowerCase().includes(term))
        .map(t => t.id);
      const themeMatches = r.temas.some(tid => matchedThemeIds.includes(tid));

      // Busca específica de meditação
      let medMatches = false;
      if (r.tipo === "meditacao") {
        const titleMatches = (r.titulo || "").toLowerCase().includes(term);
        const semMatches = (r.semana || "").toLowerCase().includes(term);
        const vBaseMatches = (r.versiculoBase || "").toLowerCase().includes(term);
        const txtMatches = (meditacoesConteudos[r.id] || "").toLowerCase().includes(term);
        medMatches = titleMatches || semMatches || vBaseMatches || txtMatches;
      }

      return contentMatches || refMatches || themeMatches || medMatches;
    }

    return true;
  });

  // Base para cálculo nos chips baseados nos temas aplicados + busca (mas independente do tipo de chip selecionado)
  const typeFilteredBase = recursos.filter(r => {
    if (appliedTemas.length > 0) {
      const matchAppliedTheme = r.temas.some(tid => appliedTemas.includes(tid));
      if (!matchAppliedTheme) return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const contentMatches = r.conteudo.toLowerCase().includes(term);
      const refMatches = r.referencia.toLowerCase().includes(term);
      const matchedThemeIds = temas
        .filter(t => t.titulo.toLowerCase().includes(term))
        .map(t => t.id);
      const themeMatches = r.temas.some(tid => matchedThemeIds.includes(tid));

      let medMatches = false;
      if (r.tipo === "meditacao") {
        const titleMatches = (r.titulo || "").toLowerCase().includes(term);
        const semMatches = (r.semana || "").toLowerCase().includes(term);
        const vBaseMatches = (r.versiculoBase || "").toLowerCase().includes(term);
        const txtMatches = (meditacoesConteudos[r.id] || "").toLowerCase().includes(term);
        medMatches = titleMatches || semMatches || vBaseMatches || txtMatches;
      }
      return contentMatches || refMatches || themeMatches || medMatches;
    }
    return true;
  });

  const chipVersiculosCount = typeFilteredBase.filter(r => r.tipo === "versiculo").length;
  const chipAtividadesCount = typeFilteredBase.filter(r => r.tipo === "atividade").length;
  const chipNotasCount = typeFilteredBase.filter(r => r.tipo === "nota").length;
  const chipMeditacoesCount = typeFilteredBase.filter(r => r.tipo === "meditacao").length;

  const countVersiculos = filteredRecursos.filter(r => r.tipo === "versiculo").length;
  const countAtividades = filteredRecursos.filter(r => r.tipo === "atividade").length;
  const countNotas = filteredRecursos.filter(r => r.tipo === "nota").length;
  const countMeditacoes = filteredRecursos.filter(r => r.tipo === "meditacao").length;

  // TOGGLE DE TIPO CHIP
  const toggleTipo = (tipo: "versiculo" | "atividade" | "nota" | "meditacao") => {
    setActiveTipo(p => p === tipo ? null : tipo);
  };

  // ==========================================
  // GESTÃO DE TOQUE LONGO NOS CHIPS DE TEMA
  // ==========================================
  const handlePointerDown = (tema: Tema, e: React.PointerEvent) => {
    if (e.button !== 0) return; // Permitir apenas toque principal
    isLongPressTriggered.current = false;
    
    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      setSelectedTemaForAction(tema);
      setShowThemeActionsModal(true);
    }, 600);
  };

  const handlePointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // HIGHLIGHT DE TEXTO
  const highlightSearchMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return (
      <>
        {parts.map((p, idx) => 
          p.toLowerCase() === search.toLowerCase() ? (
            <mark key={idx} className="bg-yellow-200 dark:bg-yellow-905/60 dark:text-yellow-100 text-slate-950 font-semibold px-0.5 rounded transition-all">
              {p}
            </mark>
          ) : (
            p
          )
        )}
      </>
    );
  };

  const formatarDataLocal = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return "Hoje";
      const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
      return `${d.getDate()} de ${meses[d.getMonth()]}`;
    } catch {
      return "Hoje";
    }
  };

  // IMPRESSÃO E GERAÇÃO PDF
  const exportarTodosPDF = (temaIds: string[]) => {
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.bottom = "0";
    frame.style.right = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "none";
    document.body.appendChild(frame);

    const doc = frame.contentWindow?.document || frame.contentDocument;
    if (!doc) return;

    const nomeGrupo = "Banco de Alimento Pastoral";
    const dataExportacao = new Date().toLocaleDateString("pt-BR");

    let temasExportados = temas;
    if (temaIds.length > 0) {
      temasExportados = temas.filter(t => temaIds.includes(t.id));
    }

    let bodyHTML = `
      <h1>Banco do Líder</h1>
      <div class="subtitle">${nomeGrupo} &middot; data de exportação: ${dataExportacao}</div>
      <div class="divider"></div>
    `;

    temasExportados.forEach(tema => {
      const recsArr = recursos.filter(r => r.temas.includes(tema.id));
      if (recsArr.length === 0) return;

      const versiculos = recsArr.filter(r => r.tipo === "versiculo");
      const actividades = recsArr.filter(r => r.tipo === "atividade");
      const notas = recsArr.filter(r => r.tipo === "nota");

      bodyHTML += `
        <div class="theme-card">
          <h2 class="theme-title">${tema.emoji} Tema: ${tema.titulo}</h2>
      `;

      if (versiculos.length > 0) {
        bodyHTML += `<h3>Versículos</h3>`;
        versiculos.forEach(v => {
          bodyHTML += `
            <div class="resource-block italic">
              <strong>${v.referencia}</strong>: "${v.conteudo}"
            </div>
          `;
        });
      }

      if (actividades.length > 0) {
        bodyHTML += `<h3>Atividades Práticas</h3>`;
        bodyHTML += `<ul>`;
        actividades.forEach(a => {
          bodyHTML += `<li>${a.conteudo}</li>`;
        });
        bodyHTML += `</ul>`;
      }

      if (notas.length > 0) {
        bodyHTML += `<h3>Notas de Insights</h3>`;
        bodyHTML += `<ul>`;
        notas.forEach(n => {
          bodyHTML += `<li>${n.conteudo} <span class="recurso-data">— ${formatarDataLocal(n.criadoEm)}</span></li>`;
        });
        bodyHTML += `</ul>`;
      }

      bodyHTML += `</div>`;
    });

    const docContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Biblioteca de Recursos - ${nomeGrupo}</title>
        <style>
          @media print {
            @page { size: portrait; margin: 20mm; }
            body { font-family: "Georgia", serif; font-size: 11pt; color: #000; background: #fff; line-height: 1.6; padding-bottom: 40px; }
            .theme-card { page-break-inside: avoid; border-bottom: 1px solid #eee; padding-bottom: 25px; margin-bottom: 25px; }
            h1, h2, h3 { page-break-after: avoid; }
            .print-footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8pt;
              color: #777;
              background: #fff;
              border-top: 1px solid #eee;
              padding-top: 5px;
            }
          }
          body { font-family: "Georgia", serif; font-size: 11pt; padding: 30px; line-height: 1.6; color: #111; padding-bottom: 60px; }
          h1 { font-size: 24pt; font-weight: bold; text-align: center; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { text-align: center; font-size: 10pt; color: #666; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
          .divider { border-top: 2.5px solid #222; margin-bottom: 30px; }
          .theme-title { font-size: 15pt; font-weight: bold; margin-top: 15px; margin-bottom: 10px; border-bottom: 1.5px solid #333; padding-bottom: 4px; }
          h3 { font-size: 10pt; text-transform: uppercase; letter-spacing: 1px; margin-top: 15px; margin-bottom: 8px; color: #444; }
          .resource-block { margin-bottom: 12px; padding-left: 12px; border-left: 2px solid #555; font-style: italic; }
          .recurso-data { font-size: 8.5pt; color: #777; font-family: monospace; }
          ul { margin-top: 5px; padding-left: 20px; }
          li { margin-bottom: 8px; }
          .print-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 8.5pt;
            color: #777;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        ${bodyHTML}
        
        <div class="print-footer">
          ✝ Firme na Palavra e no Amor &middot; ${new Date().getFullYear()}
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(docContent);
    doc.close();

    setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(frame);
      }, 2000);
    }, 450);
  };

  const exportarUmRecursoPDF = (recurso: Recurso) => {
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.bottom = "0";
    frame.style.right = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "none";
    document.body.appendChild(frame);

    const doc = frame.contentWindow?.document || frame.contentDocument;
    if (!doc) return;

    const nomeGrupo = "Rebanho Firme";
    const dataExportacao = new Date().toLocaleDateString("pt-BR");

    const temasNomes = temas
      .filter(t => recurso.temas.includes(t.id))
      .map(t => `${t.emoji} ${t.titulo}`)
      .join(", ");

    let itemContent = "";
    if (recurso.tipo === "versiculo") {
      itemContent = `
        <div class="ref">${recurso.referencia}</div>
        <div class="quote">"${recurso.conteudo}"</div>
      `;
    } else {
      itemContent = `<div class="normal-text">${recurso.conteudo}</div>`;
    }

    const docContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recurso Pastoral Individual</title>
        <style>
          @media print {
            @page { size: portrait; margin: 20mm; }
            body { font-family: "Georgia", serif; font-size: 12pt; color: #111; background: #fff; line-height: 1.6; padding-bottom: 40px; }
            .print-footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8pt;
              color: #777;
              background: #fff;
              border-top: 1px solid #eee;
              padding-top: 5px;
            }
          }
          body { font-family: "Georgia", serif; font-size: 12pt; padding: 40px; color: #111; line-height: 1.6; padding-bottom: 60px; }
          .header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 30px; }
          .sub { font-size: 9.5pt; color: #666; text-transform: uppercase; letter-spacing: 1px; }
          .title { font-size: 18pt; font-weight: bold; margin-top: 5px; margin-bottom: 0px; }
          .date { font-size: 9pt; color: #777; margin-top: 4px; }
          .ref { font-size: 13pt; font-weight: bold; margin-bottom: 15px; color: #000; }
          .quote { font-size: 15pt; font-style: italic; border-left: 3px solid #111; padding-left: 15px; margin: 20px 0; }
          .normal-text { font-size: 13pt; margin: 20px 0; white-space: pre-wrap; }
          .footer { border-top: 1px solid #ddd; padding-top: 15px; margin-top: 40px; font-size: 10pt; color: #444; }
          .print-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 8.5pt;
            color: #777;
            border-top: 1px solid #eee;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="sub">${nomeGrupo} &middot; Biblioteca Pastoral</div>
          <div class="title">${recurso.tipo === "versiculo" ? "Soli Deo Gloria" : recurso.tipo === "atividade" ? "Atividade para Célula" : "Observação Estratégica"}</div>
          <div class="date">Anotado em ${formatarDataLocal(recurso.criadoEm)} &middot; Impresso em ${dataExportacao}</div>
        </div>
        
        ${itemContent}

        <div class="footer">
          <strong>Temas Associados:</strong> ${temasNomes}
        </div>

        <div class="print-footer">
          ✝ Firme na Palavra e no Amor &middot; ${new Date().getFullYear()}
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(docContent);
    doc.close();

    setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(frame);
      }, 2000);
    }, 450);
  };

  // ==========================================
  // EXTRAÇÃO DE TEXTO DO ARQUIVO LOCAMENTE
  // ==========================================
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsExtractingText(true);
    setRecursoFormNomeArquivo(file.name);
    setSelectedFileObject(file);
    
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    setRecursoFormTipoArquivo(extension);

    // Converter para base64 para preview
    const readerBase64 = new FileReader();
    readerBase64.onload = () => {
      setRecursoFormBase64(readerBase64.result as string);
    };
    readerBase64.readAsDataURL(file);

    // Extrair texto e preencher textoExtraido
    if (extension === "docx") {
      const readerBuffer = new FileReader();
      readerBuffer.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          setRecursoFormTextoExtraido(result.value);
        } catch (err) {
          console.error("Erro ao extrair DOCX com mammoth:", err);
          alert("Não foi possível extrair o texto completo do DOCX de forma automatizada.");
        } finally {
          setIsExtractingText(false);
        }
      };
      readerBuffer.readAsArrayBuffer(file);
    } else if (extension === "pdf") {
      const readerText = new FileReader();
      readerText.onload = () => {
        try {
          const raw = readerText.result as string;
          // Purificar comandos de renderização simples de texto PDF
          const textChunks: string[] = [];
          const regex = /\((.*?)\)\s*Tj/g;
          let match;
          while ((match = regex.exec(raw)) !== null) {
            textChunks.push(match[1]);
          }
          if (textChunks.length > 0) {
            setRecursoFormTextoExtraido(textChunks.join(" "));
          } else {
            setRecursoFormTextoExtraido(`[PDF carregado com sucesso: ${file.name}]`);
          }
        } catch {
          setRecursoFormTextoExtraido(`[PDF carregado com sucesso: ${file.name}]`);
        } finally {
          setIsExtractingText(false);
        }
      };
      readerText.readAsText(file);
    } else {
      setIsExtractingText(false);
      alert("Formato de arquivo não suportado. Use PDF ou DOCX.");
    }
  };

  // ==========================================
  // RESET COMPLETO DO FORMULÁRIO DE RECURSO
  // ==========================================
  const resetRecursoForm = () => {
    setRecursoFormTipo(activeTipo || "versiculo");
    setRecursoFormConteudo("");
    setRecursoFormReferencia("");
    // Vincular aos temas atualmente sendo mostrados no filtro, se hover
    setRecursoFormTemas(appliedTemas.length > 0 ? appliedTemas : []);
    setEditingRecursoId(null);
    
    // Resetar campos exclusivos de Meditação
    setRecursoFormTitulo("");
    setRecursoFormSemana("");
    setRecursoFormVersiculoBase("");
    setRecursoFormPeriodo(1);
    setRecursoFormNomeArquivo("");
    setRecursoFormTipoArquivo("");
    setRecursoFormTextoExtraido("");
    setRecursoFormBase64("");
    setSelectedFileObject(null);
  };

  // ==========================================
  // SALVAR / CRIAR RECURSO (BANCO + ARQUIVOS)
  // ==========================================
  const handleSalvarRecurso = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (recursoFormTipo === "meditacao") {
      if (!recursoFormTitulo.trim()) {
        alert("O título da meditação é obrigatório.");
        return;
      }
      if (!recursoFormNomeArquivo && !editingRecursoId) {
        alert("Por favor, faça o upload de um arquivo PDF ou DOCX.");
        return;
      }
    } else {
      if (!recursoFormConteudo.trim()) return;
    }

    if (recursoFormTemas.length === 0) {
      alert("Selecione pelo menos 1 tema para arquivar este recurso.");
      return;
    }

    setLoading(true);
    try {
      if (recursoModalMode === "editar" && editingRecursoId) {
        // Upload do arquivo para o servidor se um arquivo novo foi selecionado
        if (recursoFormTipo === "meditacao" && selectedFileObject) {
          const fileExt = recursoFormTipoArquivo || "pdf";
          const storagePath = `${editingRecursoId}.${fileExt}`;

          // Salvar elemento no bucket de "meditacoes"
          const { error: uploadError } = await api.storage
            .from("meditacoes")
            .upload(storagePath, selectedFileObject, {
              cacheControl: "3600",
              upsert: true
            });

          if (uploadError) {
            console.warn("Criando bucket meditacoes ou tentando upload...", uploadError);
            throw new Error(`Erro ao enviar arquivo para o servidor: ${uploadError.message}`);
          }
        }

        // Preparando objeto final de banco_recursos
        const dbRow = {
          tipo: recursoFormTipo,
          conteudo: recursoFormTipo === "meditacao" ? recursoFormTextoExtraido : recursoFormConteudo.trim(),
          referencia: recursoFormTipo === "versiculo" ? recursoFormReferencia.trim() : "",
          temas: recursoFormTemas,
          lider_id: liderId,
          titulo: recursoFormTipo === "meditacao" ? recursoFormTitulo.trim() : null,
          semana: recursoFormTipo === "meditacao" ? recursoFormSemana.trim() : null,
          versiculo_base: recursoFormTipo === "meditacao" ? recursoFormVersiculoBase.trim() : null,
          periodo_semanas: recursoFormTipo === "meditacao" ? recursoFormPeriodo : null,
          nome_arquivo: recursoFormTipo === "meditacao" ? recursoFormNomeArquivo : null,
          tipo_arquivo: recursoFormTipo === "meditacao" ? recursoFormTipoArquivo : null,
          criado_em: new Date().toISOString()
        };

        const { error: updateError } = await api
          .from("banco_recursos")
          .update(dbRow)
          .eq("id", editingRecursoId);

        if (updateError) throw updateError;
      } else {
        // Modo CRIAR (INSERT) - Deixa o banco gerar o UUID
        const dbRowSemId = {
          tipo: recursoFormTipo,
          conteudo: recursoFormTipo === "meditacao" ? recursoFormTextoExtraido : recursoFormConteudo.trim(),
          referencia: recursoFormTipo === "versiculo" ? recursoFormReferencia.trim() : "",
          temas: recursoFormTemas,
          lider_id: liderId,
          titulo: recursoFormTipo === "meditacao" ? recursoFormTitulo.trim() : null,
          semana: recursoFormTipo === "meditacao" ? recursoFormSemana.trim() : null,
          versiculo_base: recursoFormTipo === "meditacao" ? recursoFormVersiculoBase.trim() : null,
          periodo_semanas: recursoFormTipo === "meditacao" ? recursoFormPeriodo : null,
          nome_arquivo: recursoFormTipo === "meditacao" ? recursoFormNomeArquivo : null,
          tipo_arquivo: recursoFormTipo === "meditacao" ? recursoFormTipoArquivo : null,
          criado_em: new Date().toISOString()
        };

        const { data: insertedRecurso, error: insertError } = await api
          .from("banco_recursos")
          .insert(dbRowSemId)
          .select()
          .single();

        if (insertError) throw insertError;
        if (!insertedRecurso) throw new Error("Falha ao registrar novo recurso.");

        // Se for meditação e tiver arquivo, efetuamos o upload usando o ID gerado pelo banco
        if (recursoFormTipo === "meditacao" && selectedFileObject) {
          const fileExt = recursoFormTipoArquivo || "pdf";
          const storagePath = `${insertedRecurso.id}.${fileExt}`;

          const { error: uploadError } = await api.storage
            .from("meditacoes")
            .upload(storagePath, selectedFileObject, {
              cacheControl: "3600",
              upsert: true
            });

          if (uploadError) {
            console.warn("Erro no upload do arquivo após salvar banco de recursos:", uploadError);
            // Deletar o registro inserido se houver pane no storage
            await api.from("banco_recursos").delete().eq("id", insertedRecurso.id);
            throw new Error(`Erro ao enviar arquivo para o servidor: ${uploadError.message}`);
          }
        }
      }

      alert("Recurso salvo com sucesso!");
      setShowRecursoModal(false);
      resetRecursoForm();
      carregarDadosBanco();

    } catch (err: any) {
      console.error("Erro ao salvar recurso pastoral:", err);
      alert(`Erro: ${err.message || 'Não foi possível salvar o recurso.'}`);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SALVAR / CRIAR TEMA (BANCO)
  // ==========================================
  const handleSalvarTema = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temaFormTitulo.trim()) return;

    setLoading(true);
    try {
      if (temaModalMode === "editar" && editingTemaId) {
        const { error: updateError } = await api
          .from("banco_temas")
          .update({
            titulo: temaFormTitulo.trim(),
            emoji: temaFormEmoji,
            cor: temaFormCor,
          })
          .eq("id", editingTemaId);

        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await api
          .from("banco_temas")
          .insert({
            titulo: temaFormTitulo.trim(),
            emoji: temaFormEmoji,
            cor: temaFormCor,
            lider_id: liderId,
            compartilhado: false
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (data && showRecursoModal) {
          setRecursoFormTemas(p => p.includes(data.id) ? p : [...p, data.id]);
        }
      }

      alert("Tema armazenado!");
      setShowTemaModal(false);
      
      setTemaFormTitulo("");
      setTemaFormEmoji("🙏");
      setTemaFormCor("teal");
      setEditingTemaId(null);
      carregarDadosBanco();

    } catch (err: any) {
      console.error("Erro ao criar tema:", err);
      alert("Não foi possível salvar esse tema de fé.");
    } finally {
      setLoading(false);
    }
  };

  const triggerEditarRecurso = async (recurso: Recurso) => {
    setRecursoModalMode("editar");
    setEditingRecursoId(recurso.id);
    setRecursoFormTipo(recurso.tipo);
    setRecursoFormConteudo(recurso.conteudo);
    setRecursoFormReferencia(recurso.referencia);
    setRecursoFormTemas(recurso.temas);

    // Se for meditação, carregar os dados adicionais de visualização
    if (recurso.tipo === "meditacao") {
      setRecursoFormTitulo(recurso.titulo || "");
      setRecursoFormSemana(recurso.semana || "");
      setRecursoFormVersiculoBase(recurso.versiculoBase || "");
      setRecursoFormPeriodo(recurso.periodoSemanas || 1);
      setRecursoFormNomeArquivo(recurso.nomeArquivo || "");
      setRecursoFormTipoArquivo(recurso.tipoArquivo || "");
      setRecursoFormTextoExtraido(recurso.conteudo || "");
    }

    setShowRecursoActionsSheet(false);
    setShowRecursoModal(true);
  };

  const triggerDeletarRecurso = async (recursoId: string) => {
    if (confirm("Deseja mesmo excluir permanentemente este recurso pastoral?")) {
      setLoading(true);
      try {
        const { error: deleteError } = await api
          .from("banco_recursos")
          .delete()
          .eq("id", recursoId);

        if (deleteError) throw deleteError;

        // Opcional: tenta apagar arquivo do Storage se meditação
        const rec = recursos.find(r => r.id === recursoId);
        if (rec?.tipo === "meditacao") {
          const fileName = `${recursoId}.${rec.tipoArquivo || "pdf"}`;
          await api.storage.from("meditacoes").remove([fileName]);
        }

        alert("Item expurgado com sucesso!");
        setShowRecursoActionsSheet(false);
        setSelectedRecursoForAction(null);
        carregarDadosBanco();

      } catch (err: any) {
        console.error("Erro ao deletar recurso:", err);
        alert("Não foi possível apagar o recurso.");
      } finally {
        setLoading(false);
      }
    }
  };

  const triggerEditarTema = (tema: Tema) => {
    setTemaModalMode("editar");
    setEditingTemaId(tema.id);
    setTemaFormTitulo(tema.titulo);
    setTemaFormEmoji(tema.emoji);
    setTemaFormCor(tema.cor);
    setShowThemeActionsModal(false);
    setShowTemaModal(true);
  };

  const triggerDeletarTema = async (temaId: string) => {
    const t = temas.find(x => x.id === temaId);
    if (!t) return;

    if (confirm(`Atenção: Excluir o tema "${t.titulo}" do seu controle? Seus recursos continuarão existindo, mas perderão essa associação.`)) {
      setLoading(true);
      try {
        const { error: deleteError } = await api
          .from("banco_temas")
          .delete()
          .eq("id", temaId);

        if (deleteError) throw deleteError;

        // Limpar tag temas de todos recursos pastorais remanescentes
        const recursosModificados = recursos.filter(r => r.temas.includes(temaId));
        for (const r of recursosModificados) {
          const novasTags = r.temas.filter(tid => tid !== temaId);
          await api
            .from("banco_recursos")
            .update({ temas: novasTags })
            .eq("id", r.id);
        }

        // Limpar filtros ativos se este tema selecionado for apagado
        setAppliedTemas(p => p.filter(id => id !== temaId));
        setSelectedTemas(p => p.filter(id => id !== temaId));

        setShowThemeActionsModal(false);
        setSelectedTemaForAction(null);
        carregarDadosBanco();

      } catch (err: any) {
        console.error("Erro ao apagar tema:", err);
        alert("Falha ao remover o tema selecionado.");
      } finally {
        setLoading(false);
      }
    }
  };

  // DOWNLOAD / VISUALIZAÇÃO COM URL ASSINADA
  const handleVisualizarMeditacao = async (recurso: Recurso) => {
    setActiveMeditacao(recurso);
    setMedDetailTab("visualizar");
    setSearchTermInMedia("");
    setActiveMeditacaoTexto(recurso.conteudo || "[Vazio]");
  };

  const handleDownloadArquivo = async (recurso: Recurso) => {
    setLoading(true);
    try {
      const fileName = `${recurso.id}.${recurso.tipoArquivo || "pdf"}`;
      
      // Tentar obter url assinada pública para download imediato
      const { data, error } = await api.storage
        .from("meditacoes")
        .createSignedUrl(fileName, 300);

      let downloadUrl = "";
      if (error || !data?.signedUrl) {
        const { data: fallbackObj } = api.storage
          .from("meditacoes")
          .getPublicUrl(fileName);
        downloadUrl = fallbackObj?.publicUrl || "";
      } else {
        downloadUrl = data.signedUrl;
      }

      if (!downloadUrl) {
        alert("Não foi possível gerar a rota de download do arquivo.");
        return;
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = recurso.nomeArquivo || `meditacao_${recurso.id}.${recurso.tipoArquivo || "pdf"}`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err: any) {
      console.error("Erro ao baixar documento:", err);
      alert("Não foi possível encontrar o arquivo base no servidor.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFormTemaSelecao = (temaId: string) => {
    setRecursoFormTemas(p => 
      p.includes(temaId) ? p.filter(x => x !== temaId) : [...p, temaId]
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans select-none pb-24">
      
      {loading && (
        <div className="fixed inset-0 bg-white/60 dark:bg-zinc-950/60 flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f766e]" />
            <p className="text-[0.625rem] uppercase font-black tracking-wider text-[#0f766e]">Processando Biblioteca...</p>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <header className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          {onVoltar && (
            <button
              onClick={onVoltar}
              className="p-1.5 bg-gray-50 dark:bg-zinc-850 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-slate-700 dark:text-zinc-300 transition"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <span className="text-[0.5625rem] font-black tracking-widest text-teal-600 dark:text-teal-400 uppercase">BANCO DE DADOS DO LIDER</span>
            <h1 className="text-base font-semibold text-slate-950 dark:text-white leading-none mt-0.5">
              Banco do Líder
            </h1>
            <p className="text-[0.625rem] text-gray-500 dark:text-zinc-400 italic mt-0.5">
              Firme na Palavra e no Amor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchTerm("");
            }}
            className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-center ${
              isSearchOpen || searchTerm
                ? "bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400"
                : "bg-gray-50 dark:bg-zinc-800/60 hover:bg-gray-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
            }`}
            aria-label="Pesquisar recursos"
          >
            {isSearchOpen || searchTerm ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          <button
            onClick={() => exportarTodosPDF(appliedTemas)}
            className="p-2.5 bg-gray-50 dark:bg-zinc-800/60 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-slate-700 dark:text-zinc-300 transition cursor-pointer"
            aria-label="Exportar PDF para impressão"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CAMPO DE BUSCA INLINE */}
      {isSearchOpen && (
        <div className="bg-white dark:bg-zinc-900 border border-teal-100 dark:border-zinc-800 p-3 rounded-2xl shadow-sm flex items-center gap-2 animate-slideDown">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por versículos, referências, ações..."
            className="w-full text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 dark:text-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-[0.625rem] text-gray-400 hover:text-gray-600 font-bold uppercase shrink-0"
            >
              limpar
            </button>
          )}
        </div>
      )}

      {/* BARRA DE FILTRO MODERNA E PODEROSA */}
      <div className="flex items-start justify-between gap-2.5 select-none font-sans">
        {/* Lado esquerdo: Chips horizontais de TIPOS de recursos com contagem dinâmicos */}
        <div className="flex flex-wrap gap-1.5 py-1 flex-1">
          <button
            type="button"
            onClick={() => toggleTipo("versiculo")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition border cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTipo === "versiculo"
                ? "bg-teal-700 text-white border-transparent shadow-sm font-black"
                : "bg-white dark:bg-zinc-900 text-slate-705 dark:text-zinc-400 border-gray-150 dark:border-zinc-800"
            }`}
          >
            <span>📖</span> Versículos ({chipVersiculosCount})
          </button>

          <button
            type="button"
            onClick={() => toggleTipo("atividade")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition border cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTipo === "atividade"
                ? "bg-amber-600 text-white border-transparent shadow-sm font-black"
                : "bg-white dark:bg-zinc-900 text-slate-705 dark:text-zinc-400 border-gray-150 dark:border-zinc-800"
            }`}
          >
            <span>🎯</span> Atividades ({chipAtividadesCount})
          </button>

          <button
            type="button"
            onClick={() => toggleTipo("nota")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition border cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTipo === "nota"
                ? "bg-slate-700 text-white border-transparent shadow-sm font-black"
                : "bg-white dark:bg-zinc-900 text-slate-705 dark:text-zinc-400 border-gray-150 dark:border-zinc-800"
            }`}
          >
            <span>📝</span> Notas ({chipNotasCount})
          </button>

          <button
            type="button"
            onClick={() => toggleTipo("meditacao")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition border cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTipo === "meditacao"
                ? "bg-rose-600 text-white border-transparent shadow-sm font-black"
                : "bg-white dark:bg-zinc-900 text-slate-705 dark:text-zinc-400 border-gray-150 dark:border-zinc-800"
            }`}
          >
            <span>📄</span> Meditações ({chipMeditacoesCount})
          </button>
        </div>

        {/* Lado direito: Botão fixo Temas com badge */}
        <button
          type="button"
          onClick={() => {
            setSelectedTemas(appliedTemas);
            setShowTemasSheet(true);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition border cursor-pointer shrink-0 flex items-center gap-1.5 ${
            appliedTemas.length > 0
              ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-500/30"
              : "bg-white dark:bg-zinc-900 text-slate-705 dark:text-zinc-400 border-gray-150 dark:border-zinc-800"
          }`}
        >
          <span>🏷️</span> Temas {appliedTemas.length > 0 && `(${appliedTemas.length})`}
        </button>
      </div>

      {/* INDICADOR DE FILTROS ATIVOS */}
      {(activeTipo !== null || appliedTemas.length > 0) && (
        <div className="flex items-center justify-between py-1.5 px-2 bg-slate-50/40 dark:bg-zinc-950/20 border-b border-gray-100 dark:border-zinc-800 text-[0.625rem] text-gray-400 dark:text-zinc-500 font-sans tracking-wide">
          <span className="truncate">
            Exibindo: <span className="font-bold text-teal-600 dark:text-teal-400 uppercase">
              {activeTipo === "versiculo" && "Versículos"}
              {activeTipo === "atividade" && "Atividades"}
              {activeTipo === "nota" && "Notas"}
              {activeTipo === "meditacao" && "Meditações"}
              {activeTipo === null && "Todos os tipos"}
            </span>
            {appliedTemas.length > 0 && (
              <>
                {" · "}Temas:{" "}
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                  {appliedTemas
                    .map(tid => temas.find(t => t.id === tid))
                    .filter(Boolean)
                    .map(t => `${t!.emoji} ${t!.titulo}`)
                    .join(", ")}
                </span>
              </>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveTipo(null);
              setAppliedTemas([]);
              setSelectedTemas([]);
            }}
            className="text-teal-600 dark:text-teal-400 font-black uppercase shrink-0 hover:underline cursor-pointer ml-2"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* CONTADOR BARRA ATUALIZADA */}
      <div className="flex justify-between items-center text-[0.625rem] text-gray-400 dark:text-zinc-500 uppercase tracking-widest font-black select-none pl-1">
        <span>Contagem Geral</span>
        <span>
          {countVersiculos} V &middot;{" "}
          {countAtividades} A &middot;{" "}
          {countNotas} N &middot;{" "}
          {countMeditacoes} E
        </span>
      </div>

      {/* LISTA DE RECURSOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3.5 animate-fadeIn">
        {filteredRecursos.length === 0 ? (
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 py-12 px-6 rounded-3xl text-center space-y-4 shadow-sm animate-fadeIn">
            <span className="text-4xl block leading-none select-none">📭</span>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {activeTipo === "versiculo"
                  ? "Nenhum recurso de versículos cadastrado"
                  : activeTipo === "atividade"
                  ? "Nenhum recurso de atividades cadastrado"
                  : activeTipo === "nota"
                  ? "Nenhum recurso de notas cadastrado"
                  : activeTipo === "meditacao"
                  ? "Nenhum recurso de meditações cadastrado"
                  : "Nenhum recurso pastoriano cadastrado"}
              </p>
              <p className="text-[0.625rem] text-gray-400 uppercase mt-1">
                {activeTipo === "versiculo"
                  ? "Adicione passagens bíblicas estratégicas para guiar seus líderes."
                  : activeTipo === "atividade"
                  ? "Adicione dinâmicas de quebra-gelo ou atividades edificantes."
                  : activeTipo === "nota"
                  ? "Crie lembretes de oração ou anotações estruturadas para o grupo."
                  : activeTipo === "meditacao"
                  ? "Guarde roteiros de estudos bíblicos, esboços e inspirações."
                  : "Insira anotações fáceis para alimentar seu GA."}
              </p>
            </div>
            
            <button
              onClick={() => {
                setRecursoModalMode("criar");
                resetRecursoForm();
                setShowRecursoModal(true);
              }}
              className="mx-auto px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Adicionar Primeiro
            </button>
          </div>
        ) : (
          filteredRecursos.map(recurso => (
            <div
              key={recurso.id}
              className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 p-4 rounded-2xl flex flex-col space-y-3 shadow-sm relative hover:border-gray-200 dark:hover:border-zinc-800 transition duration-150"
            >
              <div className="flex justify-between items-start gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {recurso.tipo === "versiculo" && (
                    <span className="text-[0.5625rem] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 border border-teal-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1 leading-none select-none">
                      <BookOpen className="w-2.5 h-2.5" /> Versículo
                    </span>
                  )}
                  {recurso.tipo === "atividade" && (
                    <span className="text-[0.5625rem] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1 leading-none select-none">
                      <Target className="w-2.5 h-2.5" /> Atividade
                    </span>
                  )}
                  {recurso.tipo === "nota" && (
                    <span className="text-[0.5625rem] font-black uppercase tracking-wider bg-zinc-100 dark:bg-[#1f1f23] text-gray-700 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 px-2 py-0.5 rounded-lg flex items-center gap-1 leading-none select-none">
                      <FileText className="w-2.5 h-2.5" /> Nota
                    </span>
                  )}
                  {recurso.tipo === "meditacao" && (
                    <span className="text-[0.5625rem] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-500/10 px-2 py-0.5 rounded-lg flex items-center gap-1 leading-none select-none">
                      📄 Meditação {recurso.semana && `· ${recurso.semana}`}
                    </span>
                  )}

                  <span className="text-[0.5313rem] font-mono text-gray-400 uppercase select-none">
                    {formatarDataLocal(recurso.criadoEm)}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedRecursoForAction(recurso);
                    setShowRecursoActionsSheet(true);
                  }}
                  className="p-1 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  aria-label="Opções do recurso"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* CONTEÚDO CARD */}
              <div className="space-y-1">
                {recurso.tipo === "versiculo" ? (
                  <>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                      {highlightSearchMatch(recurso.referencia, searchTerm)}
                    </h3>
                    <p className="text-[0.7188rem] text-gray-600 dark:text-zinc-400 leading-relaxed italic pr-2 pt-1 font-sans">
                      "{highlightSearchMatch(recurso.conteudo, searchTerm)}"
                    </p>
                  </>
                ) : recurso.tipo === "meditacao" ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {highlightSearchMatch(recurso.titulo || "", searchTerm)}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.625rem] text-gray-500 dark:text-zinc-400 font-medium">
                      {recurso.versiculoBase && (
                        <button
                          type="button"
                          onClick={() => setActiveBibleRef(recurso.versiculoBase!)}
                          className="flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 inline shrink-0" />
                          <span>Versículo-Base: {highlightSearchMatch(recurso.versiculoBase, searchTerm)}</span>
                        </button>
                      )}
                      
                      {recurso.periodoSemanas && (
                        <span className="bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[0.5625rem]">
                          Período: {recurso.periodoSemanas} {recurso.periodoSemanas === 1 ? "semana" : "semanas"}
                        </span>
                      )}
                    </div>

                    <p className="text-[0.6875rem] text-gray-500 dark:text-zinc-400 italic line-clamp-2 pr-2">
                      {highlightSearchMatch(recurso.conteudo || "Carregando conteúdo...", searchTerm)}
                    </p>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        onClick={() => handleVisualizarMeditacao(recurso)}
                        className="inline-flex items-center gap-1.5 text-[0.625rem] uppercase font-bold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 px-2 py-1 rounded transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Visualizar
                      </button>
                      <button
                        onClick={() => handleDownloadArquivo(recurso)}
                        className="inline-flex items-center gap-1.5 text-[0.625rem] uppercase font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 px-2 py-1 rounded transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar Original
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[0.7188rem] text-slate-800 dark:text-zinc-300 leading-relaxed font-medium">
                    {highlightSearchMatch(recurso.conteudo, searchTerm)}
                  </p>
                )}
              </div>

              {/* CHIPS DE ASSOCIAÇÃO - Clicável para filtrar pelo tema */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recurso.temas.map(tid => {
                  const t = temas.find(x => x.id === tid);
                  if (!t) return null;
                  const cfg = COLOR_MAP[t.cor] || COLOR_MAP.teal;
                  const isFiltered = appliedTemas.includes(tid);
                  return (
                    <button
                      key={tid}
                      onClick={() => {
                        setAppliedTemas([tid]);
                        setSelectedTemas([tid]);
                      }}
                      className={`text-[0.5rem] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md transition ${cfg.badge} hover:scale-102 flex items-center gap-0.5 ${
                        isFiltered ? "ring-1 ring-teal-500" : ""
                      }`}
                    >
                      {t.emoji} {t.titulo}
                    </button>
                  );
                })}
              </div>

            </div>
          ))
        )}
      </div>

      {/* BOTTOM SHEET DE FILTRO DE TEMAS */}
      {showTemasSheet && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center py-4 px-2 select-none animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setShowTemasSheet(false)}></div>

          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden transition-all duration-300 max-h-[85vh] flex flex-col z-10 animate-slideUp">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-zinc-800/80 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-950/20">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Filtrar por Tema</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTemas([]);
                  }}
                  className="text-[0.625rem] font-black uppercase text-teal-600 dark:text-teal-400 hover:scale-101 transition cursor-pointer"
                >
                  Limpar tudo
                </button>
                <button
                  type="button"
                  onClick={() => setShowTemasSheet(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition text-gray-400 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Tema Grid */}
            <div className="p-4 overflow-y-auto no-scrollbar flex-1 max-h-[55vh]">
              <div className="grid grid-cols-2 gap-3 pb-4">
                {temas.map(tema => {
                  const isSelected = selectedTemas.includes(tema.id);
                  const totalAssociated = recursos.filter(r => r.temas.includes(tema.id)).length;
                  const colorCfg = COLOR_MAP[tema.cor] || COLOR_MAP.teal;
                  return (
                    <button
                      key={tema.id}
                      type="button"
                      onPointerDown={(e) => handlePointerDown(tema, e)}
                      onPointerUp={(e) => {
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                        if (isLongPressTriggered.current) {
                          e.preventDefault();
                          e.stopPropagation();
                        } else {
                          setSelectedTemas(prev =>
                            prev.includes(tema.id)
                              ? prev.filter(tid => tid !== tema.id)
                              : [...prev, tema.id]
                          );
                        }
                      }}
                      onPointerLeave={handlePointerLeave}
                      className={`p-3 rounded-xl border transition text-left flex items-center gap-2.5 cursor-pointer max-w-full ${
                        isSelected
                          ? `${colorCfg.bgActive} border-transparent shadow-sm scale-[1.02]`
                          : "bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-300 border-gray-200 dark:border-zinc-805"
                      }`}
                    >
                      <span className="text-xl shrink-0">{tema.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isSelected ? "text-white" : ""}`}>{tema.titulo}</p>
                        <p className={`text-[0.625rem] ${isSelected ? "text-white/80" : "text-gray-400 dark:text-zinc-500"}`}>
                          {totalAssociated} {totalAssociated === 1 ? "recurso" : "recursos"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Criar tema no próprio container */}
              <button
                type="button"
                onClick={() => {
                  setShowTemasSheet(false);
                  setTemaModalMode("criar");
                  setTemaFormTitulo("");
                  setTemaFormEmoji("🌿");
                  setTemaFormCor("teal");
                  setShowTemaModal(true);
                }}
                className="w-full py-2.5 bg-slate-50 dark:bg-zinc-800/80 text-teal-700 dark:text-teal-400 border border-dashed border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition hover:scale-[1.01] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar Novo Tema
              </button>
            </div>

            {/* Footer / Aplicar filtros */}
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/20 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAppliedTemas(selectedTemas);
                  setShowTemasSheet(false);
                }}
                className="w-full h-11 bg-teal-700 hover:bg-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {selectedTemas.length > 0
                  ? `Aplicar filtros (${selectedTemas.length} ${selectedTemas.length === 1 ? "tema" : "temas"})`
                  : "Ver todos os recursos"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB - ADICIONAR RECURSO */}
      <button
        onClick={() => {
          setRecursoModalMode("criar");
          resetRecursoForm();
          setShowRecursoModal(true);
        }}
        className="fixed bottom-20 md:bottom-8 right-6 md:right-8 z-30 p-4 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
        aria-label="Cadastrar novo recurso de fé"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* MODAL: CRIAR / EDITAR RECURSO */}
      {showRecursoModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center py-4 px-2 select-none animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setShowRecursoModal(false)}></div>

          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden transition-all duration-305 max-h-[90vh] flex flex-col z-10 animate-slideUp">
            
            <div className="p-4 border-b border-gray-105 dark:border-zinc-800/80 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-950/20">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {recursoModalMode === "criar" ? "Novo Recurso Pastoral" : "Editar Recurso Pastoral"}
              </h3>
              <button
                onClick={() => setShowRecursoModal(false)}
                className="p-1 hover:bg-gray-150 dark:hover:bg-zinc-800 rounded-full transition"
              >
                <X className="w-4.5 h-4.5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSalvarRecurso} className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1 pb-6 text-left">
              
              <div className="space-y-1">
                <span className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Categoria de Registro *</span>
                <div className="grid grid-cols-4 gap-1 pt-0.5 bg-slate-50 dark:bg-zinc-950 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setRecursoFormTipo("versiculo")}
                    className={`h-9 rounded-xl text-[0.5625rem] font-bold uppercase tracking-tight transition ${
                      recursoFormTipo === "versiculo"
                        ? "bg-teal-700 text-white shadow-sm"
                        : "text-slate-705 dark:text-zinc-400 hover:bg-gray-100"
                    }`}
                  >
                    📖 Verso
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecursoFormTipo("atividade")}
                    className={`h-9 rounded-xl text-[0.5625rem] font-bold uppercase tracking-tight transition ${
                      recursoFormTipo === "atividade"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-slate-705 dark:text-zinc-400 hover:bg-gray-100"
                    }`}
                  >
                    🎯 Roteiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecursoFormTipo("nota")}
                    className={`h-9 rounded-xl text-[0.5625rem] font-bold uppercase tracking-tight transition ${
                      recursoFormTipo === "nota"
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-slate-705 dark:text-zinc-400 hover:bg-gray-100"
                    }`}
                  >
                    📝 Nota
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecursoFormTipo("meditacao")}
                    className={`h-9 rounded-xl text-[0.5625rem] font-bold uppercase tracking-tight transition ${
                      recursoFormTipo === "meditacao"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-slate-705 dark:text-zinc-400 hover:bg-gray-100"
                    }`}
                  >
                    📄 Meditação
                  </button>
                </div>
              </div>

              {recursoFormTipo === "versiculo" && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="space-y-1">
                    <label htmlFor="form-ref" className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Referência Bíblica *</label>
                    <input
                      id="form-ref"
                      type="text"
                      required
                      value={recursoFormReferencia}
                      onChange={(e) => setRecursoFormReferencia(e.target.value)}
                      placeholder="Ex: Filipenses 4:19"
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-600 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="form-cont-ver" className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">O que o versículo diz? *</label>
                    <textarea
                      id="form-cont-ver"
                      required
                      rows={3}
                      value={recursoFormConteudo}
                      onChange={(e) => setRecursoFormConteudo(e.target.value)}
                      placeholder="O meu Deus suprirá todas as vossas necessidades..."
                      className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-600 text-slate-900 dark:text-white leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {recursoFormTipo === "atividade" && (
                <div className="space-y-1 animate-fadeIn">
                  <label htmlFor="form-cont-ati" className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Descrição Prática / Roteiro da Atividade *</label>
                  <textarea
                    id="form-cont-ati"
                    required
                    rows={4}
                    value={recursoFormConteudo}
                    onChange={(e) => setRecursoFormConteudo(e.target.value)}
                    placeholder="Ex: Estudo prático sobre mordomia cristã..."
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-amber-600 text-slate-900 dark:text-white leading-relaxed"
                  />
                </div>
              )}

              {recursoFormTipo === "nota" && (
                <div className="space-y-1 animate-fadeIn">
                  <label htmlFor="form-cont-not" className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Anotações do Insight ou Alertas Pastorais *</label>
                  <textarea
                    id="form-cont-not"
                    required
                    rows={4}
                    value={recursoFormConteudo}
                    onChange={(e) => setRecursoFormConteudo(e.target.value)}
                    placeholder="Ex: Nota sobre algum assunto bíblico ou aconselhamento..."
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-slate-600 text-slate-900 dark:text-white leading-relaxed"
                  />
                </div>
              )}

              {recursoFormTipo === "meditacao" && (
                <div className="space-y-3.5 animate-fadeIn text-left">
                  <div className="space-y-1">
                    <span className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Documento da Meditação * (PDF ou DOCX)</span>
                    <input
                      id="file-upload-input"
                      type="file"
                      accept=".pdf,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                    
                    {recursoFormNomeArquivo ? (
                      <div className="p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-lg shrink-0">
                            {recursoFormTipoArquivo === "pdf" ? "📕" : "📘"}
                          </span>
                          <div className="overflow-hidden bg-transparent">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {recursoFormNomeArquivo}
                            </p>
                            <span className="text-[0.5625rem] uppercase tracking-wide px-1 py-0.5 rounded bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 font-black">
                              {recursoFormTipoArquivo}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => document.getElementById("file-upload-input")?.click()}
                          className="text-[0.625rem] uppercase font-black text-teal-700 dark:text-teal-400 hover:underline shrink-0"
                        >
                          Alterar
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => document.getElementById("file-upload-input")?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragActive(false);
                          if (e.dataTransfer.files?.[0]) {
                            handleFileUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-4 cursor-pointer transition ${
                          dragActive
                            ? "border-rose-500 bg-rose-50/10"
                            : "border-gray-200 hover:border-gray-300 dark:border-zinc-800 dark:hover:border-zinc-755 bg-slate-50 dark:bg-zinc-950"
                        }`}
                      >
                        <Upload className="w-6 h-6 text-gray-400 mb-1.5 animate-bounce" />
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-350">
                          Arraste e solte o arquivo aqui
                        </p>
                        <p className="text-[0.625rem] text-gray-400 mt-0.5">
                          Suporta arquivos PDF ou DOCX em nuvem
                        </p>
                      </div>
                    )}
                  </div>

                  {isExtractingText && (
                    <div className="p-2 bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-xl text-center text-xs font-semibold animate-pulse">
                      ⚡ Extraindo texto e termos bíblicos...
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label htmlFor="form-med-titulo" className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Título da Meditação *</label>
                      <input
                        id="form-med-titulo"
                        type="text"
                        required={recursoFormTipo === "meditacao"}
                        value={recursoFormTitulo}
                        onChange={(e) => setRecursoFormTitulo(e.target.value)}
                        placeholder="Ex: A Videira Verdadeira"
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-rose-600 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label htmlFor="form-med-semana" className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Semana (Ex: Semana 1)</label>
                        <input
                          id="form-med-semana"
                          type="text"
                          value={recursoFormSemana}
                           onChange={(e) => setRecursoFormSemana(e.target.value)}
                          placeholder="Ex: Semana 1"
                          className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-rose-600 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="form-med-vbase" className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Versículo-Base</label>
                        <input
                          id="form-med-vbase"
                          type="text"
                          value={recursoFormVersiculoBase}
                          onChange={(e) => setRecursoFormVersiculoBase(e.target.value)}
                          placeholder="Ex: João 15:1-5"
                          className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-rose-600 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="form-med-periodo" className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Período de Duração (Semanas): {recursoFormPeriodo}</label>
                      <input
                        id="form-med-periodo"
                        type="range"
                        min="1"
                        max="12"
                        step="1"
                        value={recursoFormPeriodo}
                        onChange={(e) => setRecursoFormPeriodo(Number(e.target.value))}
                        className="w-full accent-rose-600 focus:outline-none cursor-pointer border-none bg-transparent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="form-med-texto" className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Texto Extraído (Editável para Busca)</label>
                      <textarea
                        id="form-med-texto"
                        rows={3}
                        value={recursoFormTextoExtraido}
                        onChange={(e) => setRecursoFormTextoExtraido(e.target.value)}
                        placeholder="Texto extraído automaticamente..."
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-rose-600 text-slate-900 dark:text-white leading-relaxed font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* VINCULADOR DE TEMAS MULTI SELECT */}
              <div className="space-y-1.5 text-left font-sans">
                <div className="flex justify-between items-center select-none text-[0.5rem] font-black text-gray-400 uppercase tracking-wider">
                  <span>Vincular a Temas *</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTemaModalMode("criar");
                      setTemaFormTitulo("");
                      setTemaFormEmoji("🌿");
                      setTemaFormCor("teal");
                      setShowTemaModal(true);
                    }}
                    className="text-teal-700 dark:text-teal-400 flex items-center gap-0.5 lowercase hover:underline hover:scale-101 cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3 inline" /> criar tema
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5 bg-transparent">
                  {temas.map(t => {
                    const isChecked = recursoFormTemas.includes(t.id);
                    const cfg = COLOR_MAP[t.cor] || COLOR_MAP.teal;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleFormTemaSelecao(t.id)}
                        className={`text-xs py-1.5 px-3 rounded-lg border font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                          isChecked
                            ? `${cfg.bgActive} border-transparent shadow-sm`
                            : "bg-slate-50 dark:bg-zinc-955 border-gray-200 dark:border-zinc-800 text-slate-705 dark:text-zinc-400"
                        }`}
                      >
                        {t.emoji} {t.titulo}
                        {isChecked && <Check className="w-3 h-3 ml-0.5 stroke-[3px]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* OPERAÇÕES DOS BOTÕES */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRecursoModal(false)}
                  className="h-10 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50/20 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 bg-teal-700 hover:bg-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4.5 h-4.5" /> Salvar Recurso
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR TEMA */}
      {showTemaModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center py-4 px-2 select-none animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setShowTemaModal(false)}></div>

          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden transition-all duration-300 max-h-[85vh] flex flex-col z-[70] animate-slideUp">
            
            <div className="p-4 border-b border-gray-100 dark:border-zinc-800/80 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-950/20">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {temaModalMode === "criar" ? "Novo Tema do Banco" : "Editar Tema Existente"}
              </h3>
              <button
                onClick={() => setShowTemaModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition"
              >
                <X className="w-4.5 h-4.5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSalvarTema} className="p-4 space-y-4 text-left">
              
              <div className="space-y-1 bg-transparent">
                <label htmlFor="form-tema-titulo" className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Nome Completo do Tema *</label>
                <input
                  id="form-tema-titulo"
                  type="text"
                  required
                  value={temaFormTitulo}
                  onChange={(e) => setTemaFormTitulo(e.target.value)}
                  placeholder="Ex: Finanças, Identidade, Família"
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1 select-none">
                <span className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Emoji Representativo</span>
                <div className="grid grid-cols-5 gap-2 p-2.5 bg-slate-50 dark:bg-zinc-955/80 rounded-xl border border-gray-200 dark:border-zinc-800 max-h-[140px] overflow-y-auto no-scrollbar">
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setTemaFormEmoji(em)}
                      className={`h-9 w-full rounded-lg text-lg flex items-center justify-center transition hover:scale-110 cursor-pointer ${
                        temaFormEmoji === em
                          ? "bg-teal-50 dark:bg-teal-950/40 border border-teal-500 text-teal-700"
                          : "border border-transparent bg-transparent"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 select-none font-sans">
                <span className="block text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Cor Decoradora</span>
                <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-zinc-955 border border-gray-100 dark:border-zinc-800">
                  {COLOR_OPTIONS.map(co => {
                    const mapped = COLOR_MAP[co] || COLOR_MAP.teal;
                    const isActive = temaFormCor === co;
                    return (
                      <button
                        key={co}
                        type="button"
                        onClick={() => setTemaFormCor(co)}
                        className={`h-6.5 w-6.5 rounded-full ${mapped.dot} transition hover:scale-[1.12] flex items-center justify-center cursor-pointer border-none bg-transparent`}
                      >
                        {isActive && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTemaModal(false)}
                  className="h-10 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50/20 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 bg-teal-700 hover:bg-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4.5 h-4.5" /> Salvar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* RECURSO ACTION SHEET */}
      {showRecursoActionsSheet && selectedRecursoForAction && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center select-none py-4 px-2 animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setShowRecursoActionsSheet(false)}></div>

          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-xl z-20 animate-slideUp text-left">
            <div className="p-4 bg-gray-50 dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <span className="text-[0.5rem] font-black uppercase text-gray-400 tracking-wider font-mono">Ações do Item</span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none mt-0.5">
                  {selectedRecursoForAction.tipo === "versiculo" ? selectedRecursoForAction.referencia : "Recurso Prático"}
                </h4>
              </div>

              <button
                onClick={() => setShowRecursoActionsSheet(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-850 rounded-full text-gray-400"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-3.5 space-y-2">
              <button
                onClick={() => triggerEditarRecurso(selectedRecursoForAction)}
                className="w-full h-11 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50/20 text-slate-705 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-start gap-3 px-3.5 cursor-pointer bg-transparent"
              >
                <Edit2 className="w-4 h-4 text-teal-600" /> Editar Recurso
              </button>

              <button
                onClick={() => exportarUmRecursoPDF(selectedRecursoForAction)}
                className="w-full h-11 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50/20 text-slate-705 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-start gap-3 px-3.5 cursor-pointer bg-transparent"
              >
                <Download className="w-4 h-4 text-indigo-600" /> Exportar / Imprimir Item
              </button>

              <button
                onClick={() => triggerDeletarRecurso(selectedRecursoForAction.id)}
                className="w-full h-11 bg-rose-50/10 border border-rose-220 hover:bg-rose-505 hover:text-white text-rose-700 dark:text-rose-450 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-start gap-3 px-3.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Excluir Recurso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THEME ACTIONS MODAL (LONG PRESS) */}
      {showThemeActionsModal && selectedTemaForAction && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center select-none py-4 px-2 animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setShowThemeActionsModal(false)}></div>

          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-xl z-20 animate-slideUp text-left">
            <div className="p-4 bg-gray-50 dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <span className="text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">Ações de Temas</span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none mt-0.5 font-sans">
                  Tema: {selectedTemaForAction.emoji} {selectedTemaForAction.titulo}
                </h4>
              </div>

              <button
                onClick={() => setShowThemeActionsModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-850 rounded-full text-gray-400"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-3.5 space-y-2">
              <button
                onClick={() => triggerEditarTema(selectedTemaForAction)}
                className="w-full h-11 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50/20 text-slate-705 dark:text-zinc-305 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-start gap-3 px-3.5 cursor-pointer bg-transparent"
              >
                <Edit2 className="w-4 h-4 text-teal-600" /> Editar Tema
              </button>

              <button
                onClick={() => triggerDeletarTema(selectedTemaForAction.id)}
                className="w-full h-11 bg-rose-50/10 border border-rose-220 hover:bg-rose-500 hover:text-white text-rose-700 dark:text-rose-450 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-start gap-3 px-3.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Excluir Tema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BIBLE READER INTERFACE */}
      {activeBibleRef && (
        <BibleReader initialReference={activeBibleRef} onClose={() => setActiveBibleRef(null)} />
      )}

      {/* VISUALIZADOR DE MEDITAÇÃO */}
      {activeMeditacao && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center py-4 px-2 select-none animate-fadeIn font-sans text-left">
          <div className="absolute inset-0" onClick={() => setActiveMeditacao(null)}></div>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden transition-all duration-300 h-[88vh] flex flex-col z-10 animate-slideUp">
            
            <div className="p-4 border-b border-gray-150 dark:border-zinc-800/80 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-955/20">
              <div>
                <span className="text-[0.5rem] font-black uppercase text-gray-400 tracking-wider">
                  Estudo de Meditação {activeMeditacao.semana && `· ${activeMeditacao.semana}`}
                </span>
                <h3 className="text-sm font-bold text-slate-909 dark:text-white leading-none mt-0.5">
                  {activeMeditacao.titulo}
                </h3>
              </div>
              <button
                onClick={() => setActiveMeditacao(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-805 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="border-b border-gray-100 dark:border-zinc-800 px-4 flex gap-4 bg-white dark:bg-zinc-900">
              <button
                onClick={() => setMedDetailTab("visualizar")}
                className={`py-3 text-[0.625rem] uppercase font-black tracking-wider border-b-2 transition cursor-pointer ${
                  medDetailTab === "visualizar"
                    ? "border-rose-600 text-rose-600 dark:text-rose-400"
                    : "border-transparent text-gray-400 hover:text-gray-650"
                }`}
              >
                Visualizar Documento
              </button>
              <button
                onClick={() => setMedDetailTab("texto")}
                className={`py-3 text-[0.625rem] uppercase font-black tracking-wider border-b-2 transition cursor-pointer ${
                  medDetailTab === "texto"
                    ? "border-rose-600 text-rose-600 dark:text-rose-400"
                    : "border-transparent text-gray-400 hover:text-gray-605"
                }`}
              >
                Ajustar / Estudo Bíblico
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-4">
              {medDetailTab === "visualizar" && recursoAtivo && (
                <div ref={pdfContainerRef} 
                     className="overflow-y-auto bg-gray-100 dark:bg-zinc-800 rounded-xl p-3"
                     style={{ maxHeight: 'calc(100vh - 300px)' }}>

                  {/* Loading */}
                  {loadingPdf && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-600 border-t-transparent" />
                      <p className="text-sm text-gray-500">Carregando documento...</p>
                    </div>
                  )}

                  {/* Erro */}
                  {pdfErro && !loadingPdf && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm text-center">
                      {pdfErro}
                    </div>
                  )}

                  {/* Páginas renderizadas */}
                  {!loadingPdf && !pdfErro && pdfPaginas.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 text-center mb-3">
                        {totalPaginas} página{totalPaginas > 1 ? 's' : ''}
                      </p>
                      {pdfPaginas.map((canvas, i) => (
                        <div key={i} ref={(el) => { if (el) { el.innerHTML = ''; el.appendChild(canvas); } }} />
                      ))}
                    </div>
                  )}

                  {/* Vazio */}
                  {!loadingPdf && !pdfErro && pdfPaginas.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-2">
                      <FileText className="w-12 h-12 text-gray-300" />
                      <p className="text-sm text-gray-400">Nenhum documento carregado</p>
                    </div>
                  )}
                </div>
              )}

              {medDetailTab === "texto" && (
                <div className="h-full flex flex-col space-y-3.5">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={searchTermInMedia}
                      onChange={(e) => setSearchTermInMedia(e.target.value)}
                      placeholder="Pesquisar Palavra ou Versículo no estudo..."
                      className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800/80 rounded-xl focus:outline-none focus:border-rose-600 text-slate-900 dark:text-white"
                    />
                    {searchTermInMedia && (
                      <button
                        onClick={() => setSearchTermInMedia("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[0.625rem] font-black text-gray-400 hover:text-gray-600 uppercase"
                      >
                        limpar
                      </button>
                    )}
                  </div>

                  <div className="flex-1 border border-gray-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-955 rounded-2xl p-5 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-slate-800 dark:text-zinc-200 leading-relaxed h-[42vh] select-text">
                    {highlightSearchMatch(activeMeditacaoTexto, searchTermInMedia)}
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[0.625rem] text-gray-500 font-medium leading-normal flex items-center gap-2">
                    <span>💡</span>
                    <span>Anote insights ao ler os roteiros e as meditações de GA.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-150 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-955/20 grid grid-cols-2 gap-3 shrink-0">
              <button
                onClick={abrirDocumento}
                className="h-11 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <Download className="w-4 h-4 text-teal-600" /> Baixar Documento
              </button>
              <button
                onClick={() => exportarUmRecursoPDF(activeMeditacao)}
                className="h-11 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <Printer className="w-4 h-4" /> Imprimir Meditação
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
