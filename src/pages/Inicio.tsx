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
import { api } from "../lib/api";
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
  const [eventos, setEventos] = useState<{ id: string; titulo: string; data: string; local: string }[]>([]);

  const carregarDadosHome = async () => {
    setLoading(true);
    try {
      // 1. Carregar nome do grupo do perfil
      const { data: profileVal, error: pError } = await api
        .from('profiles')
        .select('nome_grupo')
        .eq('id', liderId)
        .maybeSingle();

      if (!pError && profileVal) {
        setNomeGrupo(profileVal.nome_grupo || "GA Ebenezer");
      }

      // 2. Carregar membros do lider
      const { data: mData, error: mError } = await api
        .from('membros')
        .select('*')
        .eq('lider_id', liderId);

      if (mError) throw mError;
      setMembros((mData || []).map(mapToTSMembro));

      // 3. Carregar reuniões do lider
      const { data: rData, error: rError } = await api
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

      // 4. Carregar eventos do lider
      const { data: eData } = await api
        .from('eventos')
        .select('*')
        .eq('lider_id', liderId);

      setEventos((eData || []).map((e: any) => ({
        id: e.id,
        titulo: e.titulo || '',
        data: e.data ? String(e.data).substring(0, 10) : '',
        local: e.local || ''
      })));
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
      const { error } = await api
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

  // Próximos eventos (hoje em diante, do mais próximo ao mais distante)
  const hojeStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().substring(0, 10);
  const proximosEventos = eventos
    .filter(e => e.data && e.data >= hojeStr)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 5);

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
            <p className="text-[0.625rem] uppercase font-black tracking-wider text-[#0f766e]">SINCRONIZANDO PAINEL DO LÍDER</p>
          </div>
        </div>
      )}

      {/* HEADER EDITÁVEL COM INLINE MODAL */}
      <header className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-2xl shadow-xs">
        <div className="text-left">
          <h1 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight flex items-baseline gap-1.5 font-sans leading-none">
            {nomeGrupo} 
          </h1>
          <p className="text-[0.625rem] italic text-[#0f766e] mt-1 flex items-center gap-1">
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
          <span className="block text-[0.5625rem] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-wider">Jovens</span>
          <span className="block text-xl font-bold text-slate-950 dark:text-white font-sans">{totalMembros}</span>
          <span className="block text-[0.5rem] text-gray-500 dark:text-zinc-400">Total cadastrados</span>
        </button>

        <button
          onClick={() => onSelectTab("reunioes")}
          className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3 rounded-2xl text-center space-y-0.5 hover:border-teal-500 transition cursor-pointer"
        >
          <span className="block text-[0.5625rem] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-wider">Presença</span>
          <span className="block text-xl font-bold text-teal-700 dark:text-teal-400 font-sans">{presencaMedia}%</span>
          <span className="block text-[0.5rem] text-gray-500 dark:text-zinc-400">Em reuniões</span>
        </button>

        <button
          onClick={() => onSelectTab("membros", { filtro: "transicao" })}
          className="bg-white dark:bg-zinc-900 border border-teal-200/80 dark:border-teal-900/60 p-3 rounded-2xl text-center space-y-0.5 hover:border-teal-500 transition cursor-pointer"
        >
          <span className="block text-[0.5625rem] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">Transição J1</span>
          <span className="block text-xl font-bold text-emerald-600 dark:text-emerald-400 font-sans">{jovensTransicao.length}</span>
          <span className="block text-[0.5rem] text-gray-500 dark:text-zinc-400">17 ➔ 18 anos</span>
        </button>
      </section>

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
              <span className="text-[0.5625rem] font-bold text-rose-600 dark:text-rose-400">Ver todos →</span>
            </div>
            <p className="font-medium leading-relaxed text-rose-700 dark:text-rose-300 text-[0.6875rem]">
              Jovens faltando há 2+ semanas. Toque para verificar os motivos cadastrados e registrar contato pastoral.
            </p>
            {motivosFrequentes.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[0.5625rem] font-bold text-rose-800 dark:text-rose-300">Motivos informados:</span>
                {Array.from(new Set(motivosFrequentes)).slice(0, 3).map((motivo, idx) => (
                  <span key={idx} className="text-[0.5313rem] bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded font-bold">
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
            <p className="text-[0.7188rem] font-bold text-slate-900 dark:text-zinc-100">
              {aniversariantes[0].nome} ({formatarAniversario(aniversariantes[0].aniversario)})
            </p>
            {aniversariantes[0].ga && (
              <p className="text-[0.5938rem] text-teal-700 dark:text-teal-400 font-bold">
                G.A: {aniversariantes[0].ga}
              </p>
            )}
          </div>
        </button>
      )}

      {/* PRÓXIMOS EVENTOS */}
      <section className="space-y-2.5 font-sans">
        <div className="flex items-center justify-between">
          <h2 className="text-[0.6875rem] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-widest text-left">Próximos Eventos</h2>
          <button
            onClick={() => onSelectTab("eventos")}
            className="text-[0.5625rem] font-extrabold uppercase text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
          >
            Ver todos
          </button>
        </div>

        {proximosEventos.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl py-8 text-center text-xs text-gray-400">
            Nenhum evento agendado.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {proximosEventos.map(ev => {
              const d = new Date(ev.data + "T12:00:00");
              return (
                <button
                  key={ev.id}
                  onClick={() => onSelectTab("eventos")}
                  className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3 rounded-2xl flex items-center gap-3 text-left hover:border-teal-500 transition cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 flex flex-col items-center justify-center shrink-0 leading-none">
                    <span className="text-base font-black">{d.getDate()}</span>
                    <span className="text-[0.5rem] font-black uppercase mt-0.5">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white font-sans truncate">{ev.titulo}</h4>
                    {ev.local && (
                      <p className="text-[0.625rem] text-gray-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" /> {ev.local}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* COMPANION INFOBAR */}
      <footer className="text-center font-sans text-gray-400 text-[0.5313rem] font-black uppercase tracking-widest pt-1.5 opacity-40 select-none">
        ✝ Pastoreio • Jovens 1 ➔ Jovens 2
      </footer>

    </div>
  );
}
