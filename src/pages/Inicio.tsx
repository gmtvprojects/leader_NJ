import { useState, useEffect } from "react";
import { 
  Users, 
  BookOpen, 
  MapPin, 
  Heart, 
  TrendingUp, 
  Settings, 
  Cake, 
  AlertTriangle,
  Check,
  ChevronRight,
  X,
  Loader2,
  Sparkles,
  Compass,
  PhoneCall
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Membro, Reuniao } from "../types";
import { extrairMetadadosMembro, calcularIdade } from "../utils/membroUtils";

interface InicioProps {
  onSelectTab: (tab: string, extra?: any) => void;
  liderId: string;
}

const mapToTSMembro = (db: any): Membro => {
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

export default function Inicio({ onSelectTab, liderId }: InicioProps) {
  const [nomeGrupo, setNomeGrupo] = useState("GA Ebenezer");
  const [isEditingGrupo, setIsEditingGrupo] = useState(false);
  const [novoNomeGrupo, setNovoNomeGrupo] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  
  const [membros, setMembros] = useState<Membro[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);

  const carregarDadosHome = async () => {
    setLoading(true);
    try {
      // 1. Carregar nome do grupo do perfil
      const { data: profileVal, error: pError } = await supabase
        .from('profiles')
        .select('nome_grupo')
        .eq('id', liderId)
        .maybeSingle();

      if (!pError && profileVal) {
        setNomeGrupo(profileVal.nome_grupo || "GA Ebenezer");
      }

      // 2. Carregar membros do lider
      const { data: mData, error: mError } = await supabase
        .from('membros')
        .select('*')
        .eq('lider_id', liderId);

      if (mError) throw mError;
      setMembros((mData || []).map(mapToTSMembro));

      // 3. Carregar reuniões do lider
      const { data: rData, error: rError } = await supabase
        .from('reunioes')
        .select('*, reuniao_presencas(membro_id)')
        .eq('lider_id', liderId)
        .order('data', { ascending: false });

      if (rError) throw rError;

      const formattedReunioes: Reuniao[] = (rData || []).map((r: any) => ({
        id: r.id,
        data: r.data,
        tema: r.tema || '',
        lanche: r.lanche || '',
        oracoes: r.oracoes || '',
        presentes: (r.reuniao_presencas || []).map((p: any) => p.membro_id)
      }));

      setReunioes(formattedReunioes);
    } catch (err: any) {
      console.error('Erro ao sincronizar dashboard do Líder:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosHome();
  }, [liderId]);

  const handleSalvarNomeGrupo = async () => {
    if (!novoNomeGrupo.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: liderId, nome_grupo: novoNomeGrupo.trim() });

      if (error) throw error;

      setNomeGrupo(novoNomeGrupo.trim());
      setIsEditingGrupo(false);
    } catch (err: any) {
      console.error('Erro ao atualizar nome do grupo:', err);
      alert('Não foi possível salvar o nome do grupo.');
    } finally {
      setLoading(false);
    }
  };

  // Cálculos de Estatísticas
  const totalMembros = membros.length;

  // Presença média % das reuniões salvas
  let presencaMedia = 100;
  if (reunioes.length > 0 && totalMembros > 0) {
    const totalPossivelPresenca = reunioes.length * totalMembros;
    const totalRealPresenca = reunioes.reduce((acc, r) => acc + (r.presentes ? r.presentes.length : 0), 0);
    presencaMedia = Math.round((totalRealPresenca / totalPossivelPresenca) * 100);
  } else if (reunioes.length === 0) {
    presencaMedia = 0;
  }

  // Estatísticas específicas da Transição Jovens 1 -> Jovens 2
  const jovensTransicao = membros.filter(m => m.origemTransicao || m.status === "Transição" || m.faixa === "J1");
  const transicaoSemGa = jovensTransicao.filter(m => !m.ga || m.ga === "Sem GA / A Definir" || m.ga === "Aguardando GA");
  const transicaoAusentes = jovensTransicao.filter(m => m.status === "Ausente" || m.faltas >= 2);

  // Analisar ausentes gerais em 2+ semanas
  const ausentesMaisDuasSemanas = membros.filter(m => m.status === "Ausente" || m.faltas >= 2);
  const totalAusentesCriticos = ausentesMaisDuasSemanas.length;

  // Resumo de motivos de ausência mais frequentes
  const motivosFrequentes = ausentesMaisDuasSemanas
    .map(m => m.motivoAusencia?.trim())
    .filter(Boolean);

  // Aniversariantes nos próximos 7 dias
  const obterAniversariantesProximos = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return membros.filter(m => {
      if (!m.aniversario) return false;
      const partes = m.aniversario.split("-");
      if (partes.length < 3) return false;
      
      const mesNiver = parseInt(partes[1], 10) - 1;
      const diaNiver = parseInt(partes[2], 10);
      
      const niverEsteAno = new Date(hoje.getFullYear(), mesNiver, diaNiver);
      if (niverEsteAno.getTime() < hoje.getTime() - 1000 * 60 * 60 * 24) {
        niverEsteAno.setFullYear(hoje.getFullYear() + 1);
      }
      
      const diffTime = niverEsteAno.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays >= 0 && diffDays <= 7;
    });
  };

  const aniversariantes = obterAniversariantesProximos();

  const formatarAniversario = (dataStr: string) => {
    if (!dataStr) return "";
    const partes = dataStr.split("-");
    if (partes.length < 3) return dataStr;
    const meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    return `${parseInt(partes[2], 10)} de ${meses[parseInt(partes[1], 10) - 1]}`;
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left">
      
      {loading && (
        <div className="fixed inset-0 bg-white/60 dark:bg-zinc-950/60 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f766e]" />
            <p className="text-[10px] uppercase font-black tracking-wider text-[#0f766e]">SINCRONIZANDO PAINEL DO LÍDER</p>
          </div>
        </div>
      )}

      {/* HEADER EDITÁVEL COM INLINE MODAL */}
      <header className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
        <div className="text-left">
          <p className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">Liderança Pastoral</p>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight flex items-baseline gap-1.5 font-sans leading-none">
            {nomeGrupo} 
          </h1>
          <p className="text-[10px] italic text-[#0f766e] mt-1 flex items-center gap-1">
            <span>✝</span> Jovens 2 (18 a 30 anos) • G.A e Integração
          </p>
        </div>
        <button
          id="btn-edit-grupo"
          onClick={() => {
            setNovoNomeGrupo(nomeGrupo);
            setIsEditingGrupo(true);
          }}
          className="p-2 bg-gray-50 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/20 text-gray-500 hover:text-teal-700 dark:hover:text-teal-400 border border-gray-100 dark:border-zinc-800 rounded-xl transition cursor-pointer"
          aria-label="Editar nome do grupo"
        >
          <Settings className="w-4 h-4" />
        </button>
      </header>

      {/* MODAL INLINE EDITAR GRUPO */}
      {isEditingGrupo && (
        <div className="bg-white dark:bg-zinc-900 border border-teal-200 dark:border-teal-950/40 p-4 rounded-2xl shadow-md animate-fadeIn space-y-3 text-left">
          <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider font-sans">
            Renomear o seu Grupo de Amigos
          </div>
          <div className="flex gap-2">
            <input
              id="input-nome-grupo"
              type="text"
              value={novoNomeGrupo}
              onChange={(e) => setNovoNomeGrupo(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white font-medium"
              placeholder="Digite o nome do GA..."
            />
            <button
              onClick={handleSalvarNomeGrupo}
              className="px-3 bg-teal-700 hover:bg-teal-600 text-white rounded-lg transition shrink-0 cursor-pointer"
              aria-label="Salvar"
            >
              <Check className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setIsEditingGrupo(false)}
              className="px-3 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded-lg transition shrink-0 border border-gray-200 dark:border-zinc-800 cursor-pointer"
              aria-label="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3 CARDS DE RESUMO DA PERFORMANCE */}
      <section className="grid grid-cols-3 gap-2.5 font-sans">
        <button
          onClick={() => onSelectTab("membros")}
          className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3 rounded-2xl text-center space-y-0.5 hover:border-teal-500 transition cursor-pointer"
        >
          <span className="block text-[9px] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-wider">Jovens</span>
          <span className="block text-xl font-bold text-slate-950 dark:text-white font-sans">{totalMembros}</span>
          <span className="block text-[8px] text-gray-500 dark:text-zinc-400">Total cadastrados</span>
        </button>

        <button
          onClick={() => onSelectTab("reunioes")}
          className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3 rounded-2xl text-center space-y-0.5 hover:border-teal-500 transition cursor-pointer"
        >
          <span className="block text-[9px] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-wider">Presença</span>
          <span className="block text-xl font-bold text-teal-700 dark:text-teal-400 font-sans">{presencaMedia}%</span>
          <span className="block text-[8px] text-gray-500 dark:text-zinc-400">Em reuniões</span>
        </button>

        <button
          onClick={() => onSelectTab("membros", { filtro: "transicao" })}
          className="bg-white dark:bg-zinc-900 border border-teal-200/80 dark:border-teal-900/60 p-3 rounded-2xl text-center space-y-0.5 hover:border-teal-500 transition cursor-pointer"
        >
          <span className="block text-[9px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">Transição J1</span>
          <span className="block text-xl font-bold text-emerald-600 dark:text-emerald-400 font-sans">{jovensTransicao.length}</span>
          <span className="block text-[8px] text-gray-500 dark:text-zinc-400">17 ➔ 18 anos</span>
        </button>
      </section>

      {/* CARD PRINCIPAL EM DESTAQUE: TRANSIÇÃO JOVENS 1 ➔ JOVENS 2 */}
      <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-900 text-white rounded-3xl p-4 shadow-sm border border-teal-700/50 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-xs text-teal-200">
              <Sparkles className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-teal-300">Integração Prioritária</span>
              <h2 className="text-sm font-bold leading-tight text-white">Transição Jovens 1 ➔ Jovens 2</h2>
            </div>
          </div>
          <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
            {jovensTransicao.length} Jovens
          </span>
        </div>

        <p className="text-[11px] text-teal-100 leading-relaxed">
          Acompanhamento para acolher os jovens de até 17 anos que estão entrando no Jovens 2 (18 a 30 anos). Garanta que cada um tenha um G.A e esteja firme na igreja.
        </p>

        {/* MÉTRICAS ESPECÍFICAS DE TRANSIÇÃO */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[8.5px] uppercase font-black text-teal-200 block">Alocação de G.A:</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-white">
                {jovensTransicao.length - transicaoSemGa.length}
              </span>
              <span className="text-[9px] text-teal-200">/ {jovensTransicao.length} com G.A</span>
            </div>
            {transicaoSemGa.length > 0 && (
              <span className="text-[8.5px] text-amber-300 font-bold block mt-1">
                ⚠️ {transicaoSemGa.length} jovem(ns) sem G.A definido
              </span>
            )}
          </div>

          <div className="bg-white/10 rounded-xl p-2.5">
            <span className="text-[8.5px] uppercase font-black text-teal-200 block">Presença & Faltas:</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-bold text-white">
                {jovensTransicao.length - transicaoAusentes.length}
              </span>
              <span className="text-[9px] text-teal-200">frequentes</span>
            </div>
            {transicaoAusentes.length > 0 ? (
              <span className="text-[8.5px] text-rose-300 font-bold block mt-1">
                🚨 {transicaoAusentes.length} ausente(s) requerem contato
              </span>
            ) : (
              <span className="text-[8.5px] text-emerald-300 font-bold block mt-1">
                ✅ Todos presentes recentemente
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onSelectTab("membros", { filtro: "transicao" })}
          className="w-full py-2.5 bg-white hover:bg-teal-50 text-teal-950 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          Acompanhar Lista de Transição <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* CARD DE ALERTA — AUSENTES EM 2+ SEMANAS COM MOTIVOS VISÍVEIS */}
      {totalAusentesCriticos > 0 && (
        <button
          onClick={() => onSelectTab("membros", { filtro: "ausentes" })}
          className="w-full bg-rose-50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 p-4 rounded-2xl flex items-start gap-3 transition-all hover:bg-rose-100/50 text-left cursor-pointer animate-fadeIn"
          aria-label={`Ver ${totalAusentesCriticos} jovens ausentes`}
        >
          <div className="p-2.5 bg-rose-600 rounded-xl text-white shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1 text-slate-900 dark:text-zinc-100 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400 font-sans">
                {totalAusentesCriticos} Jovem(ns) com Alerta de Ausência
              </h3>
              <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400">Ver todos →</span>
            </div>
            <p className="font-medium leading-relaxed text-rose-700 dark:text-rose-300 text-[11px]">
              Jovens faltando há 2+ semanas. Toque para verificar os motivos cadastrados e registrar contato pastoral.
            </p>
            {motivosFrequentes.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[9px] font-bold text-rose-800 dark:text-rose-300">Motivos informados:</span>
                {Array.from(new Set(motivosFrequentes)).slice(0, 3).map((motivo, idx) => (
                  <span key={idx} className="text-[8.5px] bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded font-bold">
                    {motivo}
                  </span>
                ))}
              </div>
            )}
          </div>
        </button>
      )}

      {/* CARD ANIVERSARIANTE NOS PRÓXIMOS 7 DIAS */}
      {aniversariantes.length > 0 && (
        <button
          onClick={() => onSelectTab("aniversariantes")}
          className="w-full bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 p-4 rounded-2xl flex items-start gap-3 text-left animate-fadeIn font-sans hover:bg-teal-100/50 dark:hover:bg-teal-950/30 transition-all cursor-pointer text-inherit"
        >
          <div className="p-2.5 bg-[#0f766e] dark:bg-teal-600 rounded-xl text-white shrink-0 relative">
            <Cake className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 flex-1 min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400 font-sans flex items-center gap-1.5">
              <span>Aniversariante da Semana! 🎉</span>
            </h3>
            <p className="text-[11.5px] font-bold text-slate-900 dark:text-zinc-100">
              {aniversariantes[0].nome} ({formatarAniversario(aniversariantes[0].aniversario)})
            </p>
            {aniversariantes[0].ga && (
              <p className="text-[9.5px] text-teal-700 dark:text-teal-400 font-bold">
                G.A: {aniversariantes[0].ga}
              </p>
            )}
          </div>
        </button>
      )}

      {/* GRID DE ACESSO RÁPIDO */}
      <section className="space-y-2.5 font-sans">
        <h2 className="text-[11px] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-widest text-left">Navegação Expressa</h2>
        <div className="grid grid-cols-2 gap-3">
          
          <button
            onClick={() => onSelectTab("membros", { filtro: "transicao" })}
            className="bg-white dark:bg-zinc-900 border border-teal-200 dark:border-teal-900/50 p-3.5 rounded-2xl flex flex-col items-start text-left space-y-2 hover:border-teal-500 transition cursor-pointer"
          >
            <div className="p-1.5 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans">Transição J1 ➔ J2</h4>
              <p className="text-[9.5px] text-gray-500 dark:text-zinc-400 font-sans">Acolhimento de 17 a 18 anos</p>
            </div>
          </button>

          <button
            onClick={() => onSelectTab("membros")}
            className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3.5 rounded-2xl flex flex-col items-start text-left space-y-2 hover:border-teal-500 transition cursor-pointer"
          >
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans">Jovens & G.A</h4>
              <p className="text-[9.5px] text-gray-500 dark:text-zinc-400 font-sans">Presença e fichas pastorais</p>
            </div>
          </button>

          <button
            onClick={() => onSelectTab("reunioes")}
            className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3.5 rounded-2xl flex flex-col items-start text-left space-y-2 hover:border-teal-500 transition cursor-pointer"
          >
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans">Chamada do G.A</h4>
              <p className="text-[9.5px] text-gray-500 dark:text-zinc-400 font-sans">Presenças dos sábados</p>
            </div>
          </button>

          <button
            onClick={() => onSelectTab("eventos")}
            className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3.5 rounded-2xl flex flex-col items-start text-left space-y-2 hover:border-teal-500 transition cursor-pointer"
          >
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-xl">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-950 dark:text-white font-sans">Eventos & Cultos</h4>
              <p className="text-[9.5px] text-gray-500 dark:text-zinc-400 font-sans">Checklist e segurança</p>
            </div>
          </button>

          <button
            onClick={() => onSelectTab("oracao")}
            className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3.5 rounded-2xl flex flex-col items-start text-left space-y-2 hover:border-teal-500 transition cursor-pointer"
          >
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/30 text-[#0f766e] dark:text-teal-400 rounded-xl font-bold">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans">Oração Pastoral</h4>
              <p className="text-[9.5px] text-gray-500 dark:text-zinc-400 font-sans">Intercessão pelos jovens</p>
            </div>
          </button>

          <button
            onClick={() => onSelectTab("bancodolider")}
            className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3.5 rounded-2xl flex flex-col items-start text-left space-y-2 hover:border-teal-500 transition cursor-pointer"
          >
            <div className="p-1.5 bg-amber-50 dark:bg-zinc-800 text-amber-600 dark:text-amber-400 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans leading-none">Banco do Líder</h4>
              <p className="text-[9.5px] text-gray-500 dark:text-zinc-400 font-sans mt-0.5">Roteiros e dinâmicas</p>
            </div>
          </button>

        </div>
      </section>

      {/* COMPANION INFOBAR */}
      <footer className="text-center font-sans text-gray-400 text-[8.5px] font-black uppercase tracking-widest pt-1.5 opacity-40 select-none">
        ✝ Pastoreio • Jovens 1 ➔ Jovens 2
      </footer>

    </div>
  );
}
