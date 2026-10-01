import React, { useState, useEffect } from "react";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  Info, 
  CheckSquare, 
  ArrowLeft,
  Loader2,
  CheckCircle
} from "lucide-react";
import { supabase } from "../lib/supabase";

export interface Regra {
  id: number;
  texto: string;
  obrigatorio: boolean;
}

export const REGRAS_EVENTO: Regra[] = [
  { id: 3, texto: "Todos permanecerão sempre juntos", obrigatorio: false },
  { id: 4, texto: "Sem brincadeiras perigosas", obrigatorio: false },
  { id: 5, texto: "Cuidados contra afogamentos definidos", obrigatorio: true },
  { id: 6, texto: "Horário de retorno definido e comunicado", obrigatorio: false },
  { id: 7, texto: "Transporte garantido pra ida e volta de todos", obrigatorio: true },
  { id: 8, texto: "Nenhum compromisso de ministério ou igreja prejudicado", obrigatorio: false },
  { id: 9, texto: "Proporção na água: 1 líder por 10 jovens (se houver piscina/igarapé)", obrigatorio: true },
  { id: 10, texto: "Horário máximo: 22h (ônibus: saída até 21h)", obrigatorio: true },
  { id: 11, texto: "Programação acessível financeiramente a todos", obrigatorio: true },
  { id: 12, texto: "Pernoite só com aprovação pastoral prévia", obrigatorio: false },
  { id: 13, texto: "Sem dança (exceto social com pastor presente)", obrigatorio: false },
  { id: 14, texto: "Descrentes comunicados ao pastor | Sem álcool em nenhuma atividade", obrigatorio: true },
  { id: 15, texto: "Convidados só com aprovação pastoral — não ultrapassar número proposto", obrigatorio: true },
  { id: 16, texto: "Proporção de líderes: 1 casal casado por 20 pessoas", obrigatorio: true },
  { id: 17, texto: "Tudo planejado para a Glória de Deus", obrigatorio: false },
  { id: 18, texto: "Cuidado com postagens em redes sociais", obrigatorio: false },
  { id: 19, texto: "Sem músicas seculares", obrigatorio: false },
  { id: 20, texto: "Todas as ações têm propósito claro", obrigatorio: false },
  { id: 21, texto: "Sem chá de lingerie — apenas chá de bênçãos se for o caso", obrigatorio: false },
  { id: 22, texto: "Festa do pijama: apenas mulheres, somente com checklist de autorização completo", obrigatorio: false }
];

export const CHECKLIST_22_REGRAS = REGRAS_EVENTO;

export interface EventoPWA_Local {
  id: string;
  titulo: string;
  data: string;
  local: string;
  tipo: "saída" | "festa" | "reunião especial";
  participantes: number;
  lideresConfirmados: number;
  checklistMarcados: number[]; // ID das regras marcadas
  comprovanteAprovacao: string;
  status: "planejado" | "aprovado" | "realizado";
}

interface EventosProps {
  liderId: string;
}

const mapToTS = (db: any): EventoPWA_Local => ({
  id: db.id,
  titulo: db.titulo || '',
  data: db.data || '',
  local: db.local || '',
  tipo: db.tipo || 'saída',
  participantes: db.participantes || 0,
  lideresConfirmados: db.lideres_confirmados || 0,
  checklistMarcados: db.checklist_marcados || [],
  comprovanteAprovacao: db.comprovante || '',
  status: db.status || 'planejado'
});

const mapToDB = (ts: Omit<EventoPWA_Local, 'id'> & { id?: string }, liderId: string) => ({
  id: ts.id,
  lider_id: liderId,
  titulo: ts.titulo,
  data: ts.data,
  local: ts.local,
  tipo: ts.tipo,
  participantes: ts.participantes,
  lideres_confirmados: ts.lideresConfirmados,
  checklist_marcados: ts.checklistMarcados,
  comprovante: ts.comprovanteAprovacao,
  status: ts.status
});

export default function Eventos({ liderId }: EventosProps) {
  const [eventos, setEventos] = useState<EventoPWA_Local[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [view, setView] = useState<"lista" | "detalhe" | "cadastro">("lista");
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoPWA_Local | null>(null);

  // Estados do Novo Evento
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [local, setLocal] = useState("");
  const [tipo, setTipo] = useState<"saída" | "festa" | "reunião especial">("saída");
  const [participantes, setParticipantes] = useState<number>(20);
  const [lideresConfirmados, setLideresConfirmados] = useState<number>(3);
  const [comprovanteAprovacao, setComprovanteAprovacao] = useState("");

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data: eventosData, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('lider_id', liderId)
        .order('data', { ascending: false });

      if (error) throw error;

      setEventos((eventosData || []).map(mapToTS));
    } catch (error: any) {
      console.error('Erro ao carregar eventos:', error);
      alert('Não foi possível sincronizar os eventos do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    setData(new Date().toISOString().split("T")[0]);
  }, [liderId]);

  const [itensMarcados, setItensMarcados] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (eventoSelecionado) {
      const indices = CHECKLIST_22_REGRAS
        .map((r, idx) => ({ id: r.id, idx }))
        .filter(x => eventoSelecionado.checklistMarcados.includes(x.id))
        .map(x => x.idx);
      setItensMarcados(new Set(indices));
    } else {
      setItensMarcados(new Set());
    }
  }, [eventoSelecionado?.id]);

  const toggleItem = async (index: number) => {
    if (!eventoSelecionado) return;
    const item = CHECKLIST_22_REGRAS[index];
    if (!item) return;

    const jaMarcado = eventoSelecionado.checklistMarcados.includes(item.id);
    const novosMarcados = jaMarcado 
      ? eventoSelecionado.checklistMarcados.filter(id => id !== item.id)
      : [...eventoSelecionado.checklistMarcados, item.id];

    // 1. Salva no banco PRIMEIRO
    try {
      const { data: updatedData, error } = await supabase
        .from('eventos')
        .update({
          checklist_marcados: novosMarcados
        })
        .eq('id', eventoSelecionado.id)
        .select()
        .single();

      if (error) throw error;

      // 2. Só atualiza o estado LOCAL após confirmar o banco
      const formatado = mapToTS(updatedData);
      setEventos(prev => prev.map(e => e.id === eventoSelecionado.id ? formatado : e));
      setEventoSelecionado(formatado);

      setItensMarcados(prev => {
        const novo = new Set(prev);
        if (novo.has(index)) {
          novo.delete(index);
        } else {
          novo.add(index);
        }
        return novo;
      });
    } catch (error: any) {
      console.error('Erro ao salvar checklist:', error);
      alert('Não foi possível salvar o checklist no servidor.');
    }
  };

  const handlesNovoEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !local.trim()) return;

    setLoading(true);
    try {
      const dadosNovo: Omit<EventoPWA_Local, 'id'> = {
        titulo: titulo.trim(),
        data,
        local: local.trim(),
        tipo,
        participantes: Number(participantes) || 0,
        lideresConfirmados: Number(lideresConfirmados) || 0,
        checklistMarcados: [], // Começa vazio
        comprovanteAprovacao: comprovanteAprovacao.trim(),
        status: "planejado"
      };

      const { data: insertData, error } = await supabase
        .from('eventos')
        .insert(mapToDB(dadosNovo, liderId))
        .select()
        .single();

      if (error) throw error;

      const formatado = mapToTS(insertData);
      setEventos(prev => [formatado, ...prev]);

      // Resetar campos
      setTitulo("");
      setLocal("");
      setTipo("saída");
      setParticipantes(20);
      setLideresConfirmados(3);
      setComprovanteAprovacao("");
      setView("lista");
      alert('Evento de Célula agendado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar evento:', error);
      alert('Não foi possível gravar o evento no servidor.');
    } finally {
      setLoading(false);
    }
  };


  const salvarComprovanteDirect = async (eventoId: string, val: string) => {
    try {
      const { data: updatedData, error } = await supabase
        .from('eventos')
        .update({ comprovante: val })
        .eq('id', eventoId)
        .select()
        .single();

      if (error) throw error;

      const formatado = mapToTS(updatedData);
      setEventos(prev => prev.map(e => e.id === eventoId ? formatado : e));
      setEventoSelecionado(formatado);
    } catch (error: any) {
      console.error('Erro ao salvar comprovante:', error);
    }
  };

  const deletarEvento = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza de que deseja excluir este evento e seu respectivo checklist?")) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('eventos')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setEventos(prev => prev.filter(evt => evt.id !== id));
        setView("lista");
        setEventoSelecionado(null);
        alert('Evento excluído do servidor.');
      } catch (error: any) {
        console.error('Erro ao excluir evento:', error);
        alert('Não foi possível remover o evento do banco de dados.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
      
      {loading && (
        <div className="fixed inset-0 bg-white/60 dark:bg-zinc-950/60 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f766e]" />
            <p className="text-[10px] uppercase font-black tracking-wider text-[#0f766e]">Sincronizando Atividade...</p>
          </div>
        </div>
      )}

      {/* SEÇÃO 1: LISTA PRINCIPAL */}
      {view === "lista" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight leading-none flex items-center gap-1.5 font-sans">
                <MapPin className="w-5 h-5 text-teal-700 dark:text-teal-400" /> Eventos & Atividades
              </h1>
              <p className="text-[10px] uppercase font-black text-gray-400 mt-1 tracking-wider">Formulação de Logística e Segurança</p>
            </div>
            
            <button
              onClick={() => {
                setView("cadastro");
                setTitulo("");
                setLocal("");
                setTipo("saída");
                setParticipantes(20);
                setLideresConfirmados(3);
                setComprovanteAprovacao("");
              }}
              className="p-3 bg-teal-700 hover:bg-teal-600 text-white rounded-2xl shadow-lg cursor-pointer transition active:scale-95"
              aria-label="Planejar novo evento"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none/0">
            {eventos.length} Eventos Cadastrados
          </div>

          {eventos.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-805 rounded-2xl text-gray-400 space-y-2">
              <CheckSquare className="w-8 h-8 mx-auto opacity-35 text-slate-400" />
              <p className="text-xs font-semibold">Sem eventos agendados.</p>
              <button
                onClick={() => setView("cadastro")}
                className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-400 hover:underline"
              >
                Cadastrar o primeiro agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3">
              {eventos.map((evt) => {
                const totalObrigatorios = REGRAS_EVENTO.filter(r => r.obrigatorio).length;
                const marcadosObrigatorios = REGRAS_EVENTO
                  .filter(r => r.obrigatorio)
                  .filter(r => evt.checklistMarcados.includes(r.id)).length;
                
                const completouObrigatorios = marcadosObrigatorios === totalObrigatorios;

                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setEventoSelecionado(evt);
                      setView("detalhe");
                    }}
                    className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl flex flex-col justify-between hover:border-teal-500 transition shadow-sm cursor-pointer space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[9px] text-gray-400 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>{new Date(evt.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                          <span className="h-2 w-2 rounded-full bg-gray-300 mx-1"></span>
                          <span className="capitalize">{evt.tipo}</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight font-sans">
                          {evt.titulo}
                        </h3>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" /> {evt.local}
                        </p>
                      </div>
                    </div>

                    {/* Progress Checklist bar */}
                    <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-zinc-800/60">
                      <div className="flex justify-between items-center text-[8.5px] font-black uppercase text-gray-400">
                        <span>Checklist de Segurança</span>
                        <span className={completouObrigatorios ? "text-emerald-600" : "text-amber-600"}>
                          Regras Obrigatórias: {marcadosObrigatorios}/{totalObrigatorios}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            completouObrigatorios ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${(marcadosObrigatorios / totalObrigatorios) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 2: DETALHES DO EVENTO & CHECKLIST DE 22 REGRAS */}
      {view === "detalhe" && eventoSelecionado && (
        <div className="space-y-4 animate-slideUp">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("lista")}
                className="p-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-slate-800 dark:text-white rounded-xl hover:bg-slate-50 cursor-pointer"
                aria-label="Voltar para lista"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Acompanhamento e Segurança</span>
                <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[210px] font-sans">
                  {eventoSelecionado.titulo}
                </h1>
              </div>
            </div>

            <button
              onClick={(e) => deletarEvento(eventoSelecionado.id, e)}
              className="p-2 bg-red-50/20 text-rose-600 border border-red-100 dark:border-red-950/20 rounded-xl hover:bg-red-50 cursor-pointer"
              title="Excluir evento"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </header>

          {/* DADOS LOGÍSTICOS GERAIS */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 space-y-3.5 text-xs font-sans">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100 dark:border-zinc-800/80">
              <div>
                <span className="block text-[8.5px] font-bold text-gray-400 uppercase">Local do Evento</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">{eventoSelecionado.local}</span>
              </div>
              <div>
                <span className="block text-[8.5px] font-bold text-gray-400 uppercase">Data Marcada</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono">
                  {new Date(eventoSelecionado.data + "T12:00:00").toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800">
                <span className="block text-[8px] font-semibold text-gray-400 uppercase">Tipo</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200 uppercase text-[10px]">{eventoSelecionado.tipo}</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
                <span className="block text-[8px] font-semibold text-gray-400 uppercase">Participantes</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs">{eventoSelecionado.participantes}</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 text-center">
                <span className="block text-[8px] font-semibold text-gray-400 uppercase">Líderes Conf.</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs">{eventoSelecionado.lideresConfirmados}</span>
              </div>
            </div>

          </div>

          {/* CHECKLIST DAS 22 REGRAS */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 space-y-3.5 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white uppercase text-[9.5px] tracking-wider flex items-center gap-1 leading-none font-sans">
                <CheckSquare className="w-4 h-4 text-teal-600" /> Checklist Geral das 22 Regras
              </h3>
              <p className="text-[10px] text-gray-400 mt-1 pb-1">Marque cada regra à medida que for completada.</p>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {CHECKLIST_22_REGRAS.map((item, index) => {
                const marcado = itensMarcados.has(index);
                return (
                  <div
                    key={index}
                    onClick={() => toggleItem(index)}
                    className={`
                      flex items-center gap-3 p-4 rounded-2xl cursor-pointer
                      border transition-all duration-200 select-none
                      ${marcado 
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-400 dark:border-green-500 text-green-800 dark:text-green-300' 
                        : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center 
                      justify-center flex-shrink-0 transition-all duration-200
                      ${marcado 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                      }
                    `}>
                      {marcado && (
                        <svg className="w-3 h-3 text-white" fill="none" 
                             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" 
                                d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-medium flex-1
                      ${marcado ? 'line-through opacity-70' : ''}
                    `}>
                      {item.texto}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 3: FORMULÁRIO DE CADASTRO */}
      {view === "cadastro" && (
        <form onSubmit={handlesNovoEvento} className="space-y-4 animate-slideUp">
          <header className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setView("lista")}
              className="p-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-slate-800 dark:text-white rounded-xl hover:bg-slate-50 cursor-pointer"
              aria-label="Voltar para lista"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Apoio de Liderança</span>
              <h1 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                Planejar Atividade / Social
              </h1>
            </div>
          </header>

          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-5 space-y-4 text-xs font-sans">
            
            {/* Título */}
            <div className="space-y-1">
              <label htmlFor="evt-titulo" className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Título do Evento *
              </label>
              <input
                id="evt-titulo"
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Piquenique de Férias, Churrasco do Rebanho..."
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white font-medium"
              />
            </div>

            {/* Local & Data */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="evt-local" className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  Local do Evento *
                </label>
                <input
                  id="evt-local"
                  type="text"
                  required
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Ex: Igreja, casa do liderado etc..."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="evt-data" className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  Data Prevista
                </label>
                <input
                  id="evt-data"
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Tipo */}
            <div className="space-y-1">
              <label htmlFor="evt-tipo" className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Tipo do Evento
              </label>
              <select
                id="evt-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white font-medium cursor-pointer"
              >
                <option value="saída">Saída</option>
                <option value="festa">Festa</option>
                <option value="reunião especial">Reunião Especial</option>
              </select>
            </div>

            {/* Participantes & Líderes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="evt-part" className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  Participantes Previstos
                </label>
                <input
                  id="evt-part"
                  type="number"
                  min={1}
                  required
                  value={participantes}
                  onChange={(e) => setParticipantes(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="evt-lideres" className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  Líderes Confirmados
                </label>
                <input
                  id="evt-lideres"
                  type="number"
                  min={0}
                  required
                  value={lideresConfirmados}
                  onChange={(e) => setLideresConfirmados(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-955 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Comprovante Pastoral Descrição */}
            <div className="space-y-1">
              <label htmlFor="evt-comp" className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Precisa de aprovação pastoral se sim ja fez?
              </label>
              <textarea
                id="evt-comp"
                rows={2}
                value={comprovanteAprovacao}
                onChange={(e) => setComprovanteAprovacao(e.target.value)}
                placeholder="Insira os detalhes da aprovação pastoral aqui..."
                className="w-full text-xs p-3 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white leading-relaxed resize-none"
              />
            </div>

            {/* Checklist Info */}
            <div className="text-[10px] text-gray-400 leading-normal flex items-start gap-1 pb-1">
              <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5 animate-pulse" />
              <span>O checklist completo com as <strong>22 regras oficiais de segurança</strong> será anexado automaticamente a esta atividade para marcação.</span>
            </div>

            {/* Enviar */}
            <button
               id="btn-adicionar-atividade"
              type="submit"
              className="w-full hover:scale-[1.01] transition-transform h-11 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition shadow-md flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <CheckSquare className="w-4 h-4 text-white" /> Cadastrar Atividade
            </button>

          </div>
        </form>
      )}

    </div>
  );
}
