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
  Loader2
} from "lucide-react";
import { api } from "../lib/api";
import { Membro, Reuniao } from "../types";

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

const mapToTSHist = (db: any): HistoricoTamanho => ({
  mes: db.mes || '',
  total: db.total || 0
});

interface MaisProps {
  liderId: string;
  onSelectTab?: (tab: string, extra?: any) => void;
}

export default function Mais({ liderId, onSelectTab }: MaisProps) {
  const [subView, setSubView] = useState<"menu" | "crescimento" | "oracao" | "config">("menu");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [grupoNome, setGrupoNome] = useState("GA Ebenezer");
  const [loading, setLoading] = useState<boolean>(true);

  // Estados dos Módulos
  const [membros, setMembros] = useState<Membro[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
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
        .select('nome_grupo')
        .eq('id', liderId)
        .maybeSingle();

      if (!profileError && profileData) {
        setGrupoNome(profileData.nome_grupo || "GA Ebenezer");
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

  const handleSalvarGrupoNome = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGrupoNome(val);
    try {
      await api.from('profiles').upsert({ id: liderId, nome_grupo: val });
    } catch (error) {
      console.error('Erro ao salvar nome do grupo:', error);
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

          {/* AJUSTE DE GERAL */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider leading-none flex items-center gap-1 font-sans">
              <Settings className="w-4 h-4 text-teal-600" /> Identificação do GA
            </h3>

            <div className="space-y-1">
              <label htmlFor="cfg-nome" className="block text-[0.5rem] font-bold uppercase text-gray-400">Nome Oficial do Grupo de Amigos</label>
              <input
                id="cfg-nome"
                type="text"
                value={grupoNome}
                onChange={handleSalvarGrupoNome}
                placeholder="Ex. GA Ebenezer, GA Maranata..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[#0f766e] text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div className="space-y-1 mt-2.5">
              <span className="block text-[0.5rem] font-bold uppercase text-gray-400">Igreja Vinculada</span>
              <div className="text-xs px-3 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg text-slate-500 dark:text-zinc-400 font-medium select-none font-sans">
                Igreja: Firme na Palavra e no Amor
              </div>
            </div>

            <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 dark:border-zinc-800/80">
              <div>
                <span className="block text-xs font-bold text-slate-900 dark:text-white">Tema Escuro Confortável</span>
                <span className="block text-[0.5rem] text-gray-400 uppercase mt-0.5 font-bold font-mono">ga_theme localstorage</span>
              </div>
              <button
                type="button"
                onClick={toggleColorsTheme}
                className="py-2.5 px-4 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-teal-700 dark:text-teal-400 rounded-xl shadow-sm transition hover:scale-103 cursor-pointer"
              >
                {themeMode === "light" ? (
                  <div className="flex items-center gap-1.5 text-[0.625rem] font-black uppercase tracking-wider">
                    <Moon className="w-4 h-4 text-slate-600 dark:text-zinc-400" /> Ativar Escuro
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[0.625rem] font-black uppercase tracking-wider">
                    <Sun className="w-4 h-4 text-amber-500" /> Ativar Claro
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
