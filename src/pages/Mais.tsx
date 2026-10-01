import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Heart, 
  Settings, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Moon, 
  Sun, 
  Download, 
  Upload, 
  ChevronRight,
  LogOut,
  Loader2,
  Coffee,
  Check,
  X,
  Pencil
} from "lucide-react";
import { api } from "../lib/api";
import { HORARIOS } from "../utils/membroUtils";
import { Membro, Reuniao } from "../types";

interface EquipeLanche {
  id: string;
  nome: string;
  membrosIds: string[];
  incluiLider: boolean;
}

interface HistoricoTamanho {
  mes: string; // YYYY-MM
  total: number;
}

const mapToTSMembro = (db: any): Membro => ({
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
  notas: db.notas || '',
  status: db.status || 'Ativo',
  faltas: db.faltas || 0,
});

const mapToTSEquipe = (db: any): EquipeLanche => ({
  id: db.id,
  nome: db.nome || '',
  membrosIds: db.membros_ids || [],
  incluiLider: !!db.inclui_lider
});

const mapToTSHist = (db: any): HistoricoTamanho => ({
  mes: db.mes || '',
  total: db.total || 0
});

interface MaisProps {
  liderId: string;
  onSelectTab?: (tab: string, extra?: any) => void;
}

export default function Mais({ liderId, onSelectTab }: MaisProps) {
  const [subView, setSubView] = useState<"menu" | "crescimento" | "oracao" | "lanche" | "config">("menu");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [grupoNome, setGrupoNome] = useState("GA Ebenezer");
  const [perfilNome, setPerfilNome] = useState("");
  const [perfilCelular, setPerfilCelular] = useState("");
  const [perfilNascimento, setPerfilNascimento] = useState("");
  const [perfilCulto, setPerfilCulto] = useState("");
  const [perfilSenib, setPerfilSenib] = useState("");
  const [perfilSalvo, setPerfilSalvo] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Estados dos Módulos
  const [membros, setMembros] = useState<Membro[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [equipes, setEquipes] = useState<EquipeLanche[]>([]);
  // Formulário de equipe (null = lista de equipes)
  const [formEquipe, setFormEquipe] = useState<{ id?: string; nome: string; membrosIds: string[]; incluiLider: boolean } | null>(null);
  const [historicoTamanho, setHistoricoTamanho] = useState<HistoricoTamanho[]>([]);
  const [oracoesRespondidasIds, setOracoesRespondidasIds] = useState<string[]>([]);

  // Estados dos Formulários Locais
  const [buscaOracaoFiltro, setBuscaOracaoFiltro] = useState<"todos" | "pendentes" | "respondidos">("todos");

  const carregarDadosEstatisticas = async () => {
    setLoading(true);
    try {
      // 1. Carregar nome do grupo perfil
      const { data: profileData, error: profileError } = await api
        .from('profiles')
        .select('nome_grupo, nome_lider, celular, data_nascimento, culto, senib')
        .eq('id', liderId)
        .maybeSingle();

      if (!profileError && profileData) {
        setGrupoNome(profileData.nome_grupo || "GA Ebenezer");
        setPerfilNome(profileData.nome_lider || "");
        setPerfilCelular(profileData.celular || "");
        setPerfilNascimento(profileData.data_nascimento ? String(profileData.data_nascimento).substring(0, 10) : "");
        setPerfilCulto(profileData.culto || "");
        setPerfilSenib(profileData.senib || "");
      }

      // 2. Carregar membros do servidor
      const { data: membrosData } = await api
        .from('membros')
        .select('*')
        .eq('lider_id', liderId);
      
      setMembros((membrosData || []).map(mapToTSMembro));

      // 3. Carregar reuniões do servidor
      const { data: reunioesData } = await api
        .from('reunioes')
        .select('*')
        .eq('lider_id', liderId);

      const formattedReunioes: Reuniao[] = (reunioesData || []).map((r: any) => ({
        id: r.id,
        data: r.data,
        tema: r.tema || '',
        lanche: r.lanche || '',
        oracoes: r.oracoes || '',
        presentes: []
      }));
      setReunioes(formattedReunioes);

      // 4. Carregar equipes de lanche
      const { data: equipesData } = await api
        .from('equipes_lanche')
        .select('*')
        .eq('lider_id', liderId)
        .order('criado_em', { ascending: true });

      setEquipes((equipesData || []).map(mapToTSEquipe));

      // 5. Carregar histórico_tamanho do servidor
      const { data: histData } = await api
        .from('historico_tamanho')
        .select('*')
        .eq('lider_id', liderId)
        .order('mes', { ascending: true });

      setHistoricoTamanho((histData || []).map(mapToTS_Local));

    } catch (error: any) {
      console.error('Erro ao buscar dados secundários do servidor:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapToTS_Local = (db: any) => ({
    mes: db.mes || '',
    total: db.total || 0
  });

  useEffect(() => {
    carregarDadosEstatisticas();

    // Tema
    const savedTheme = localStorage.getItem("ga_theme") || "light";
    setThemeMode(savedTheme as "light" | "dark");

  }, [subView, liderId]);

  const toggleColorsTheme = () => {
    const nextTheme = themeMode === "light" ? "dark" : "light";
    setThemeMode(nextTheme);
    localStorage.setItem("ga_theme", nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await api.from('profiles').upsert({
        id: liderId,
        nome_grupo: grupoNome.trim(),
        nome_lider: perfilNome.trim() || null,
        celular: perfilCelular.trim(),
        data_nascimento: perfilNascimento || null,
        culto: perfilCulto || null,
        senib: perfilSenib || null
      });
      if (error) throw error;
      setPerfilSalvo(true);
      setTimeout(() => setPerfilSalvo(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Não foi possível salvar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  // --- MÓDULO CRESCIMENTO ---
  const handleRegistrarTamanhoHoje = async () => {
    const hoje = new Date();
    const mesFormatado = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
    const totalGeral = membros.length;

    setLoading(true);
    try {
      // Upsert no historico_tamanho table
      const { error } = await api
        .from('historico_tamanho')
        .upsert({
          lider_id: liderId,
          mes: mesFormatado,
          total: totalGeral
        }, { onConflict: 'lider_id,mes' });

      if (error) throw error;

      await carregarDadosEstatisticas();
      alert(`Tamanho atual (${totalGeral} membros) registrado para o respectivo mês de ${mesFormatado}!`);
    } catch (error: any) {
      console.error('Erro ao salvar no historico_tamanho:', error);
      alert('Não foi possível gravar a estatística no servidor.');
    } finally {
      setLoading(false);
    }
  };

  // --- MÓDULO LANCHE (EQUIPES) ---
  const handleSalvarEquipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEquipe) return;
    const nome = formEquipe.nome.trim();
    if (!nome) return;
    if (formEquipe.membrosIds.length === 0 && !formEquipe.incluiLider) {
      alert("Selecione pelo menos um integrante (ou marque \"Eu\").");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        lider_id: liderId,
        nome,
        membros_ids: formEquipe.membrosIds,
        inclui_lider: formEquipe.incluiLider
      };

      const { error } = formEquipe.id
        ? await api.from('equipes_lanche').update(payload).eq('id', formEquipe.id)
        : await api.from('equipes_lanche').insert(payload);

      if (error) throw error;

      setFormEquipe(null);
      await carregarDadosEstatisticas();
    } catch (error: any) {
      console.error('Erro ao salvar equipe de lanche:', error);
      alert('Não foi possível salvar a equipe.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirEquipe = async (id: string) => {
    if (!confirm("Deseja excluir esta equipe de lanche?")) return;
    setLoading(true);
    try {
      const { error } = await api.from('equipes_lanche').delete().eq('id', id);
      if (error) throw error;
      setEquipes(prev => prev.filter(eq => eq.id !== id));
    } catch (error: any) {
      console.error('Erro ao excluir equipe:', error);
      alert('Não foi possível excluir a equipe.');
    } finally {
      setLoading(false);
    }
  };

  const todosSelecionados = !!formEquipe && membros.length > 0 && membros.every(m => formEquipe.membrosIds.includes(m.id));

  // --- MÓDULO ORAÇÃO ---
  const alternarOracaoRespondida = (reuniaoId: string) => {
    const respondida = oracoesRespondidasIds.includes(reuniaoId);
    let novasResp = [...oracoesRespondidasIds];

    if (respondida) {
      novasResp = novasResp.filter(id => id !== reuniaoId);
    } else {
      novasResp.push(reuniaoId);
    }

    localStorage.setItem("ga_oracoes_respondidas_ids", JSON.stringify(novasResp));
    setOracoesRespondidasIds(novasResp);
  };

  const obterPedidosDeOracaoReuniao = () => {
    return reunioes
      .filter(r => r.oracoes && r.oracoes.trim().length > 0)
      .map(r => ({
        id: r.id,
        texto: r.oracoes.trim(),
        data: r.data,
        respondido: oracoesRespondidasIds.includes(r.id)
      }));
  };

  const handleSair = async () => {
    const { error } = await api.auth.signOut()
    if (error) {
      console.error('Erro ao sair:', error)
      alert('Erro ao sair. Tente novamente.')
    }
    // O onAuthStateChange no App.tsx detecta automaticamente
    // que a sessão terminou e volta para a tela de Login
  }

  // --- COMPILADOR DE GRÁFICO SVG ---
  const renderMiniGraficoSVG = () => {
    if (historicoTamanho.length === 0) return null;

    const width = 310;
    const height = 110;
    const padding = 18;

    const maxVal = Math.max(...historicoTamanho.map(h => h.total), 12);
    const minVal = 0;

    const pregressPoints = historicoTamanho.map((h, index) => {
      const x = padding + (index * (width - padding * 2)) / Math.max(historicoTamanho.length - 1, 1);
      const y = height - padding - ((h.total - minVal) * (height - padding * 2)) / (maxVal - minVal);
      return { x, y, mes: h.mes, total: h.total };
    });

    let pathD = "";
    pregressPoints.forEach((p, idx) => {
      if (idx === 0) {
        pathD = `M ${p.x} ${p.y}`;
      } else {
        pathD += ` L ${p.x} ${p.y}`;
      }
    });

    return (
      <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800/80 animate-fadeIn font-mono">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Gridlines Horizontais */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-zinc-800" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-zinc-800" strokeDasharray="3 3" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-zinc-800" strokeDasharray="3 3" />

          {/* Linha do Gráfico */}
          {pregressPoints.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="#0f766e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-teal-400"
            />
          )}

          {/* Pontos de dados */}
          {pregressPoints.map((p, idx) => (
            <g key={idx} className="cursor-pointer group">
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#0f766e"
                className="dark:fill-teal-400 transition hover:scale-[1.3] shadow-sm"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="7.5"
                fill="none"
                stroke="#0f766e"
                strokeWidth="1.5"
                className="dark:stroke-teal-500 opacity-0 group-hover:opacity-100 transition"
              />
              <text
                x={p.x}
                y={p.y - 8}
                textAnchor="middle"
                className="text-[0.5rem] font-black fill-slate-700 dark:fill-zinc-300 font-sans"
              >
                {p.total}
              </text>
              <text
                x={p.x}
                y={height - 2}
                textAnchor="middle"
                className="text-[0.4688rem] font-black text-gray-400 dark:text-zinc-500 uppercase font-mono"
              >
                {p.mes.slice(5)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn">
      
      {loading && (
        <div className="fixed inset-0 bg-white/60 dark:bg-zinc-950/60 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f766e]" />
            <p className="text-[0.625rem] uppercase font-black tracking-wider text-[#0f766e]">Consolidando informações...</p>
          </div>
        </div>
      )}

      {/* VISTA PRINCIPAL: CARDS DE CONFIGURAÇÕES */}
      {subView === "menu" && (
        <div className="space-y-4 font-sans">
          <div>
            <h1 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight leading-none flex items-center gap-1.5 font-sans justify-start text-left">
              Configurações
            </h1>
            <p className="text-[0.625rem] uppercase font-black text-gray-400 mt-1 tracking-wider text-left">Crescimento do GA, perfil e manutenção</p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 pt-1">
            
            {/* 1. CARD CRESCIMENTO */}
            <div
              onClick={() => setSubView("crescimento")}
              className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 p-4 rounded-2xl flex flex-col hover:border-teal-500 transition shadow-sm cursor-pointer space-y-3 text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-55 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 rounded-xl">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans leading-none">MEU G.A E HISTÓRICO</h3>
                    <p className="text-[0.5938rem] text-gray-400 font-medium uppercase mt-1">Estatística do tamanho do GA</p>
                  </div>
                </div>

                {membros.length > 15 ? (
                  <span className="text-[0.5313rem] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-lg font-sans">
                    Excelente Tamanho ({membros.length})
                  </span>
                ) : membros.length < 8 ? (
                  <span className="text-[0.5313rem] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg font-sans">
                    Crescer o G.A
                  </span>
                ) : (
                  <span className="text-[0.5313rem] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 px-2 py-1 rounded-lg font-sans">
                    GA Saudável ({membros.length})
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center text-[0.6875rem] text-gray-500 dark:text-zinc-400">
                <span>Total de fichas salvas de liderança: <strong>{membros.length}</strong></span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* CARD LANCHE */}
            <div
              onClick={() => { setFormEquipe(null); setSubView("lanche"); }}
              className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 p-4 rounded-2xl flex flex-col hover:border-teal-500 transition shadow-sm cursor-pointer space-y-3 text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans leading-none">Lanche</h3>
                    <p className="text-[0.5938rem] text-gray-400 font-medium uppercase mt-1">Equipes de lanche do GA</p>
                  </div>
                </div>

                <span className="text-[0.5625rem] font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                  {equipes.length} {equipes.length === 1 ? "equipe" : "equipes"}
                </span>
              </div>

              <div className="flex justify-between items-center text-[0.6875rem] text-gray-500 dark:text-zinc-400">
                <span>Crie equipes e escolha quem leva o lanche em cada reunião</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* 5. CARD CONFIGURAÇÕES */}
            <div
              onClick={() => setSubView("config")}
              className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 p-4 rounded-2xl flex flex-col hover:border-teal-500 transition shadow-sm cursor-pointer space-y-3 text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-350 rounded-xl">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans leading-none">PERFIL</h3>
                    <p className="text-[0.5938rem] text-gray-400 font-medium uppercase mt-1">Nome do GA, Aparência e Manutenção</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[0.6875rem] text-gray-500 dark:text-zinc-400">
                <span>Exportar backup local, modo escuro e restaurações</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* TEMA ESCURO (SWITCH) */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm text-left">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl">
                  {themeMode === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-sans leading-none">Tema Escuro</h3>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={themeMode === "dark"}
                aria-label="Alternar tema escuro"
                onClick={toggleColorsTheme}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                  themeMode === "dark" ? "bg-teal-700" : "bg-gray-300 dark:bg-zinc-700"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  themeMode === "dark" ? "translate-x-5" : ""
                }`} />
              </button>
            </div>

            {/* SIGN OUT BUTTON */}
            <button
              onClick={handleSair}
              className="w-full flex items-center justify-center gap-2 
                         p-4 rounded-2xl border border-red-200 
                         text-red-600 font-medium hover:bg-red-50 
                         transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair da conta
            </button>

          </div>
        </div>
      )}

      {/* SUBVIEW A: CRESCIMENTO PASTORAL */}
      {subView === "crescimento" && (
        <div className="w-full max-w-2xl mx-auto space-y-4 text-left animate-slideUp font-sans">
          <header className="flex items-center gap-3">
            <button
              onClick={() => setSubView("menu")}
              className="p-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-slate-850 dark:text-white rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[0.5625rem] font-black uppercase text-gray-400 tracking-wider">Histórico de Membros</span>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Meu G.A E Histórico</h1>
            </div>
          </header>

          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/80 p-4 rounded-2xl space-y-3 shadow-sm">
            <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5 leading-none">
              <TrendingUp className="w-4 h-4 text-[#0f766e]" /> Saúde do Censo de Membros
            </h3>
            
            <p className="text-[0.6875rem] leading-relaxed text-gray-550 dark:text-zinc-400 pb-0.5">
              O tamanho atual do seu GA é de <strong>{membros.length} membros ativos</strong>. Incentive sempre a participação e o engajamento contínuo de todos.
            </p>

            <div className="p-3.5 bg-slate-55 dark:bg-[#131315] border border-gray-150 dark:border-zinc-800 text-[0.6875rem] leading-relaxed rounded-xl font-medium">
              {membros.length > 15 ? (
                <p className="text-emerald-800 dark:text-emerald-400">
                  ✓ <strong>Excelente saúde de tamanho!</strong> O GA está rico em conexões com mais de 15 pessoas. Continue motivando todos os liderados a acolherem bem novos visitantes e crescerem juntos.
                </p>
              ) : membros.length < 8 ? (
                <p className="text-amber-700 dark:text-amber-400">
                  ⚠ <strong>Incentive novos convites:</strong> Por possuir menos de 8 pessoas no GA, incentive fortemente seus liderados a convidarem novos amigos e familiares para conhecerem o GA e fortalecerem nossa comunhão nos próximos meses.
                </p>
              ) : (
                <p className="text-teal-800 dark:text-teal-400">
                  ✓ <strong>Tamanho Equilibrado:</strong> Seu grupo possui uma taxa ideal de participantes semanal que promove intimidade extrema nas rodas e dinâmicas, além de viabilizar excelente arrumação.
                </p>
              )}
            </div>
          </div>

          {/* GRÁFICO HISTÓRICO */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-[0.625rem] font-black text-gray-400 uppercase tracking-widest leading-none">Gráfico de Crescimento Linear</h3>
              <button
                onClick={handleRegistrarTamanhoHoje}
                className="px-2.5 py-1 text-[0.5625rem] uppercase tracking-wider font-extrabold text-white bg-teal-700 hover:bg-teal-655 rounded-lg cursor-pointer"
              >
                Salvar Hoje
              </button>
            </div>

            {renderMiniGraficoSVG()}

            <p className="text-[0.5938rem] text-gray-500 leading-relaxed italic text-center text-gray-400">Gráfico em tempo real comparando a variação histórica cadastrada. Toque em "Salvar Hoje" para registrar o total deste mês.</p>
          </div>
        </div>
      )}

      {/* SUBVIEW C: CLAMORES DE CÉLULAS (ORAÇÕES EM REUNIÃO) */}
      {subView === "oracao" && (
        <div className="w-full max-w-2xl mx-auto space-y-4 text-left animate-slideUp font-sans">
          <header className="flex items-center gap-3">
            <button
              onClick={() => setSubView("menu")}
              className="p-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-slate-800 dark:text-white rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[0.5625rem] font-black uppercase text-gray-400 tracking-wider">Apoio Pastoral</span>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none">Pedidos Consolidados</h1>
            </div>
          </header>

          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl space-y-3.5 shadow-sm">
            <div className="flex justify-between items-center gap-2">
              <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-1">
                <Heart className="w-4 h-4 text-rose-505 fill-rose-500" /> Histórico de Intercessões
              </h3>

              {/* FILTROS */}
              <select
                value={buscaOracaoFiltro}
                onChange={(e) => setBuscaOracaoFiltro(e.target.value as any)}
                className="text-[0.5938rem] font-extrabold uppercase bg-slate-5 w-fit border border-gray-200 dark:border-zinc-800 rounded-lg p-1 text-slate-700 dark:text-zinc-300 cursor-pointer outline-none"
              >
                <option value="todos">Todos</option>
                <option value="pendentes">Pendentes</option>
                <option value="respondidos">Respondidos</option>
              </select>
            </div>

            <p className="text-[0.6875rem] leading-relaxed text-gray-500 dark:text-zinc-400 pb-1">
              Pedidos anotados durante as atas das reuniões ministeriais do <strong>{grupoNome}</strong>. Mantenha os registros atualizados para alimentar a fé do GA.
            </p>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 font-sans">
              {obterPedidosDeOracaoReuniao().length === 0 ? (
                <p className="italic text-gray-400 text-xs py-5 text-center">Nenhum clamor coletivo registrado nas reuniões semanais.</p>
              ) : (
                obterPedidosDeOracaoReuniao()
                  .filter(o => {
                    if (buscaOracaoFiltro === "pendentes") return !o.respondido;
                    if (buscaOracaoFiltro === "respondidos") return o.respondido;
                    return true;
                  })
                  .map((or, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 border rounded-xl flex items-start gap-2.5 transition justify-between ${
                        or.respondido 
                          ? "bg-slate-50 dark:bg-[#121213] border-emerald-500/30" 
                          : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800"
                      }`}
                    >
                      <div className="space-y-1 text-left">
                        <span className="text-[0.5313rem] font-semibold text-rose-600 dark:text-rose-405 font-mono uppercase bg-rose-50/10 px-1.5 py-0.5 rounded border border-rose-500/10 inline-block mb-1">
                          Reunião {new Date(or.data + "T12:00:00").toLocaleDateString("pt-BR")}
                        </span>
                        
                        <p className={`text-[0.6875rem] leading-relaxed font-semibold italic ${
                          or.respondido ? "line-through text-gray-400 dark:text-zinc-500" : "text-slate-800 dark:text-zinc-200"
                        }`}>
                          "{or.texto}"
                        </p>
                      </div>

                      <button
                        onClick={() => alternarOracaoRespondida(or.id)}
                        className={`text-[0.5938rem] font-extrabold uppercase shrink-0 py-1 px-2.5 rounded-lg border transition cursor-pointer select-none ${
                          or.respondido
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:scale-95"
                            : "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 hover:border-teal-500 text-gray-500"
                        }`}
                      >
                        {or.respondido ? "Milagre ✓" : "Clamar"}
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW: EQUIPES DE LANCHE */}
      {subView === "lanche" && (
        <div className="w-full max-w-2xl mx-auto space-y-4 text-left font-sans">
          <header className="flex items-center gap-3">
            <button
              onClick={() => (formEquipe ? setFormEquipe(null) : setSubView("menu"))}
              className="p-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-slate-850 dark:text-white rounded-xl hover:bg-slate-50 cursor-pointer"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[0.5625rem] font-black uppercase text-gray-400 tracking-wider">Configurações</span>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                {formEquipe ? (formEquipe.id ? "Editar Equipe" : "Nova Equipe") : "Lanche"}
              </h1>
            </div>
          </header>

          {!formEquipe ? (
            <>
              <div className="space-y-2.5 pb-24">
                {equipes.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl text-gray-400 space-y-2">
                    <Coffee className="w-8 h-8 mx-auto opacity-40 text-amber-500" />
                    <p className="text-xs font-semibold">Nenhuma equipe de lanche criada.</p>
                    <p className="text-[0.625rem]">Use o botão + para criar a primeira.</p>
                  </div>
                ) : (
                  equipes.map(eq => (
                    <div key={eq.id} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 space-y-2.5 shadow-sm">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">{eq.nome}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setFormEquipe({ id: eq.id, nome: eq.nome, membrosIds: eq.membrosIds, incluiLider: eq.incluiLider })}
                            className="p-1.5 text-gray-400 hover:text-teal-600 cursor-pointer"
                            aria-label="Editar equipe"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleExcluirEquipe(eq.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-500 cursor-pointer"
                            aria-label="Excluir equipe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {eq.incluiLider && (
                          <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 text-[0.625rem] font-bold px-2 py-0.5 rounded-lg">Eu (líder)</span>
                        )}
                        {eq.membrosIds.map(id => {
                          const m = membros.find(x => x.id === id);
                          return m ? (
                            <span key={id} className="bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-400 border border-teal-200/50 dark:border-teal-900/40 text-[0.625rem] font-bold px-2 py-0.5 rounded-lg">{m.nome}</span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                id="btn-nova-equipe"
                onClick={() => setFormEquipe({ nome: "", membrosIds: [], incluiLider: false })}
                className="fixed bottom-20 md:bottom-8 right-6 md:right-8 z-30 p-4 bg-teal-700 hover:bg-teal-600 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 cursor-pointer transition-transform flex items-center justify-center"
                aria-label="Nova equipe de lanche"
              >
                <Plus className="w-6 h-6" />
              </button>
            </>
          ) : (
            <form onSubmit={handleSalvarEquipe} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl space-y-4 shadow-sm">
              <div className="space-y-1">
                <label htmlFor="equipe-nome" className="block text-[0.5rem] font-bold uppercase text-gray-400">Nome da Equipe *</label>
                <input
                  id="equipe-nome"
                  type="text"
                  required
                  value={formEquipe.nome}
                  onChange={(e) => setFormEquipe({ ...formEquipe, nome: e.target.value })}
                  placeholder="Ex. Equipe 1, Equipe dos Doces..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[#0f766e] text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-[0.5rem] font-bold uppercase text-gray-400">Integrantes *</span>
                  <button
                    type="button"
                    onClick={() => setFormEquipe({
                      ...formEquipe,
                      membrosIds: todosSelecionados ? [] : membros.map(m => m.id)
                    })}
                    disabled={membros.length === 0}
                    className="text-[0.5625rem] font-extrabold uppercase text-teal-700 dark:text-teal-400 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {todosSelecionados ? "Desmarcar todos" : "Selecionar todos"}
                  </button>
                </div>

                <label className="flex items-center gap-2.5 p-2.5 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/30 rounded-xl cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formEquipe.incluiLider}
                    onChange={(e) => setFormEquipe({ ...formEquipe, incluiLider: e.target.checked })}
                    className="w-4 h-4 accent-teal-700 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Eu (líder)</span>
                </label>

                {membros.length === 0 ? (
                  <p className="text-[0.6875rem] text-gray-400 italic py-2">Nenhum membro cadastrado. Você pode criar uma equipe só com você.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
                    {membros.map(m => {
                      const marcado = formEquipe.membrosIds.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition ${
                            marcado
                              ? "bg-teal-50/60 dark:bg-teal-950/20 border-teal-500"
                              : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={() => setFormEquipe({
                              ...formEquipe,
                              membrosIds: marcado
                                ? formEquipe.membrosIds.filter(id => id !== m.id)
                                : [...formEquipe.membrosIds, m.id]
                            })}
                            className="w-4 h-4 accent-teal-700 cursor-pointer"
                          />
                          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">{m.nome}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFormEquipe(null)}
                  className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-slate-800 dark:text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> Salvar Equipe
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SUBVIEW E: CONFIGURAÇÕES, GESTÃO DE DADOS */}
      {subView === "config" && (
        <div className="w-full max-w-2xl mx-auto space-y-4 text-left animate-slideUp font-sans">
          <header className="flex items-center gap-3">
            <button
              onClick={() => setSubView("menu")}
              className="p-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-slate-850 dark:text-white rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[0.5625rem] font-black uppercase text-gray-400 tracking-wider">Configuração de Perfil</span>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-none font-sans">Perfil</h1>
            </div>
          </header>

          {/* PERFIL DO LÍDER */}
          <form onSubmit={handleSalvarPerfil} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider leading-none flex items-center gap-1 font-sans">
              <Settings className="w-4 h-4 text-teal-600" /> Dados do Líder e do GA
            </h3>

            <div className="space-y-1">
              <label htmlFor="cfg-nome-lider" className="block text-[0.5rem] font-bold uppercase text-gray-400">Nome do Líder</label>
              <input
                id="cfg-nome-lider"
                type="text"
                value={perfilNome}
                onChange={(e) => setPerfilNome(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[#0f766e] text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="cfg-nome" className="block text-[0.5rem] font-bold uppercase text-gray-400">Nome Oficial do Grupo de Amigos</label>
              <input
                id="cfg-nome"
                type="text"
                value={grupoNome}
                onChange={(e) => setGrupoNome(e.target.value)}
                placeholder="Ex. GA Ebenezer, GA Maranata..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[#0f766e] text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="cfg-celular" className="block text-[0.5rem] font-bold uppercase text-gray-400">Celular do Líder</label>
                <input
                  id="cfg-celular"
                  type="tel"
                  value={perfilCelular}
                  onChange={(e) => setPerfilCelular(e.target.value)}
                  placeholder="Ex. 11999998888"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[#0f766e] text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="cfg-nascimento" className="block text-[0.5rem] font-bold uppercase text-gray-400">Data de Nascimento</label>
                <input
                  id="cfg-nascimento"
                  type="date"
                  value={perfilNascimento}
                  onChange={(e) => setPerfilNascimento(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[#0f766e] text-slate-900 dark:text-white font-medium"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="cfg-culto" className="block text-[0.5rem] font-bold uppercase text-gray-400">Culto</label>
                <select
                  id="cfg-culto"
                  value={perfilCulto}
                  onChange={(e) => setPerfilCulto(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[#0f766e] text-slate-900 dark:text-white font-medium cursor-pointer"
                >
                  <option value="">Não informado</option>
                  {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="cfg-senib" className="block text-[0.5rem] font-bold uppercase text-gray-400">SENIB</label>
                <select
                  id="cfg-senib"
                  value={perfilSenib}
                  onChange={(e) => setPerfilSenib(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[#0f766e] text-slate-900 dark:text-white font-medium cursor-pointer"
                >
                  <option value="">Não informado</option>
                  {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-[0.5rem] font-bold uppercase text-gray-400">Igreja Vinculada</span>
              <div className="text-xs px-3 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400 font-medium select-none font-sans">
                Igreja: Firme na Palavra e no Amor
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" /> {perfilSalvo ? "Perfil salvo!" : "Salvar Perfil"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
