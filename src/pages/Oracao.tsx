import React, { useState, useEffect } from "react";
import { 
  Heart, 
  Plus, 
  Check, 
  Trash2, 
  ArrowLeft,
  Calendar,
  User,
  MessageSquareHeart,
  ChevronDown,
  Loader2
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Membro } from "../types";

export interface PedidoOracao {
  id: string;
  membroId: string;
  membroNome: string;
  texto: string;
  data: string; // YYYY-MM-DD
  respondido: boolean;
}

interface OracaoProps {
  onVoltar?: () => void;
  liderId: string;
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

const mapToTS = (db: any): PedidoOracao => ({
  id: db.id,
  membroId: db.membro_id || '',
  membroNome: db.membro_nome || '',
  texto: db.texto || '',
  data: db.criado_em ? db.criado_em.substring(0, 10) : new Date().toISOString().substring(0, 10),
  respondido: db.respondido || false
});

const mapToDB = (ts: Omit<PedidoOracao, 'id'> & { id?: string }, liderId: string) => ({
  id: ts.id,
  lider_id: liderId,
  membro_id: ts.membroId || null,
  membro_nome: ts.membroNome,
  texto: ts.texto,
  respondido: ts.respondido
});

export default function Oracao({ onVoltar, liderId }: OracaoProps) {
  const [oracoes, setOracoes] = useState<PedidoOracao[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Estados de Filtro e Busca
  const [filtro, setFiltro] = useState<"todos" | "pendentes" | "respondidos">("todos");
  
  // Estados do Formulário Criador
  const [mostrarForm, setMostrarForm] = useState(false);
  const [membroId, setMembroId] = useState("");
  const [texto, setTexto] = useState("");
  const [data, setData] = useState("");

  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Carregar membros do Supabase
      const { data: membrosData, error: membrosError } = await supabase
        .from('membros')
        .select('*')
        .eq('lider_id', liderId);

      if (membrosError) throw membrosError;

      const formattedMembros = (membrosData || []).map(mapToTSMembro);
      setMembros(formattedMembros);
      if (formattedMembros.length > 0) {
        setMembroId(formattedMembros[0].id);
      }

      // 2. Carregar pedidos de oração de Supabase
      const { data: oracaoData, error: oracaoError } = await supabase
        .from('oracao_pedidos')
        .select('*')
        .eq('lider_id', liderId)
        .order('criado_em', { ascending: false });

      if (oracaoError) throw oracaoError;

      setOracoes((oracaoData || []).map(mapToTS));
    } catch (error: any) {
      console.error('Erro ao carregar orações:', error);
      alert('Não foi possível sincronizar os clamores do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    // Setar data atual padrão
    setData(new Date().toISOString().substring(0, 10));
  }, [liderId]);

  const handleSalvarOracao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || !membroId) return;

    const membroSelecionado = membros.find(m => m.id === membroId);
    const mNome = membroSelecionado ? membroSelecionado.nome : "Visitante / Convidado";

    setLoading(true);
    try {
      const nova: Omit<PedidoOracao, 'id'> = {
        membroId,
        membroNome: mNome,
        texto: texto.trim(),
        data,
        respondido: false
      };

      const { data: insertData, error } = await supabase
        .from('oracao_pedidos')
        .insert(mapToDB(nova, liderId))
        .select()
        .single();

      if (error) throw error;

      const formatado = mapToTS(insertData);
      setOracoes(prev => [formatado, ...prev]);

      // Resetar Form
      setTexto("");
      setMostrarForm(false);
      alert('Pedido de intercessão registrado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar pedido de oração:', error);
      alert('Não foi possível gravar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  const alternarRespondida = async (id: string) => {
    const selecionado = oracoes.find(o => o.id === id);
    if (!selecionado) return;

    setLoading(true);
    try {
      const { data: updatedData, error } = await supabase
        .from('oracao_pedidos')
        .update({ respondido: !selecionado.respondido })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const formatado = mapToTS(updatedData);
      setOracoes(prev => prev.map(o => o.id === id ? formatado : o));
    } catch (error: any) {
      console.error('Erro ao atualizar status do pedido:', error);
      alert('Não foi possível salvar a alteração de status.');
    } finally {
      setLoading(false);
    }
  };

  const deletarPedido = async (id: string) => {
    if (confirm("Deseja deletar este pedido de oração permanentemente?")) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('oracao_pedidos')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setOracoes(prev => prev.filter(o => o.id !== id));
        alert('Pedido de clamor removido com sucesso.');
      } catch (error: any) {
        console.error('Erro ao excluir pedido:', error);
        alert('Não foi possível remover o registro pastoral.');
      } finally {
        setLoading(false);
      }
    }
  };

  const filtradas = oracoes.filter(o => {
    if (filtro === "pendentes") return !o.respondido;
    if (filtro === "respondidos") return o.respondido;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn font-sans text-left">
      
      {loading && (
        <div className="fixed inset-0 bg-white/60 dark:bg-zinc-950/60 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f766e]" />
            <p className="text-[10px] uppercase font-black tracking-wider text-[#0f766e]">Intercedendo e salvando...</p>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <header className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          {onVoltar && (
            <button
              onClick={onVoltar}
              className="p-1.5 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl text-slate-700 dark:text-zinc-350 cursor-pointer"
              aria-label="Voltar para tela anterior"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="text-left">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#0f766e] dark:text-teal-400">Intercessão Individual</span>
            <h1 className="text-lg font-bold text-slate-950 dark:text-white tracking-tight leading-none mt-0.5 flex items-center gap-1.5 font-sans">
              Clamores do Rebanho
            </h1>
          </div>
        </div>

        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="p-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-sm font-bold text-xs uppercase tracking-wider"
          aria-label={mostrarForm ? "Fechar formulário" : "Cadastrar pedido de oração"}
        >
          {mostrarForm ? "Esconder" : <Plus className="w-4.5 h-4.5" />}
        </button>
      </header>

      {/* COMPONENTE MAKER/CRIADOR INLINE */}
      {mostrarForm && (
        <form 
          onSubmit={handleSalvarOracao} 
          className="bg-white dark:bg-zinc-900 border border-teal-100 dark:border-zinc-800 p-4 rounded-2xl shadow-md space-y-3.5 animate-slideDown"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
            <MessageSquareHeart className="w-4.5 h-4.5 text-[#0f766e]" /> Novo Clamor de Membro
          </h3>

          <div className="space-y-3 font-sans">
            {/* Membro Dropdown */}
            <div className="space-y-1">
              <label htmlFor="form-ora-membro" className="block text-[8px] font-bold uppercase text-gray-400">Membro do Grupo de Amigos *</label>
              <div className="relative">
                <select
                  id="form-ora-membro"
                  required
                  value={membroId}
                  onChange={(e) => setMembroId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white cursor-pointer appearance-none"
                >
                  {membros.length === 0 ? (
                    <option value="">(Crie membros primeiro na aba Membros)</option>
                  ) : (
                    membros.map(m => (
                      <option key={m.id} value={m.id}>{m.nome} ({m.faixa})</option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 dark:text-zinc-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Texto do Pedido */}
            <div className="space-y-1">
              <label htmlFor="form-ora-texto" className="block text-[8px] font-bold uppercase text-gray-400">Descrição do Clamor / Motivo *</label>
              <textarea
                id="form-ora-texto"
                required
                rows={3}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Qual o motivo específico de intercessão deste membro?"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-gray-250 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white leading-relaxed resize-none font-sans"
              />
            </div>

            {/* Data de Registro */}
            <div className="space-y-1">
              <label htmlFor="form-ora-data" className="block text-[8px] font-bold uppercase text-gray-400">Data de Anotação *</label>
              <input
                id="form-ora-data"
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-805 rounded-lg focus:outline-none focus:border-[#0f766e] text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={membros.length === 0}
              className={`w-full h-10 text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-sm ${
                membros.length === 0
                  ? "bg-gray-100 dark:bg-zinc-805 text-gray-400 cursor-not-allowed"
                  : "bg-teal-700 hover:bg-teal-600 text-white"
              }`}
            >
              <Check className="w-4 h-4 font-bold" /> Registrar Pedido de Fé
            </button>
          </div>
        </form>
      )}

      {/* FILTROS NO TOPO DAS ORAÇÕES */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-2 rounded-2xl flex justify-between items-center shadow-sm">
        <span className="text-[9.5px] font-extrabold uppercase text-gray-400 pl-2">Filtrar Pedidos</span>
        
        <div className="flex gap-1 font-sans">
          {(["todos", "pendentes", "respondidos"] as const).map(f => (
            <button
               key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-[9.5px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                filtro === f
                   ? "bg-teal-700 text-white shadow-sm font-bold"
                  : "bg-gray-50 hover:bg-gray-100 dark:bg-zinc-955 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-400"
              }`}
            >
              {f === "todos" ? "Todos" : f === "pendentes" ? "Ativos" : "Respondidos"}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA EXPANDIDA DE PEDIDOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3 font-sans">
        {filtradas.length === 0 ? (
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 py-12 rounded-2xl text-center space-y-1.5">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500/10 mx-auto animate-pulse" />
            <p className="text-xs font-bold text-slate-900 dark:text-white">Nenhum pedido encontrado</p>
            <p className="text-[10px] text-gray-400 uppercase font-medium">Use do filtro acima ou crie um novo pedido no botão "+"</p>
          </div>
        ) : (
          filtradas.map(ora => (
            <div 
              key={ora.id} 
              className={`bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-3xl flex flex-col space-y-3.5 shadow-sm transition-all hover:scale-[1.005] duration-200 ${
                ora.respondido ? "opacity-90 dark:opacity-75 border-emerald-500/20" : ""
              }`}
            >
              <div className="flex justify-between items-start gap-1">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    ora.respondido 
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" 
                      : "bg-[#E1F5EE] dark:bg-teal-950/40 text-teal-700 dark:text-teal-400"
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none font-sans">{ora.membroNome}</h3>
                    <p className="text-[9px] text-gray-400 font-mono mt-1 uppercase flex items-center gap-1.5 select-none text-left">
                      <Calendar className="w-3 h-3 shrink-0" />
                      Anotado em: {new Date(ora.data + "T12:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => deletarPedido(ora.id)}
                  className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 text-slate-350 dark:text-zinc-650 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Corpo do pedido adaptado */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-gray-105 dark:border-zinc-800/80">
                <p className={`text-[11.5px] leading-relaxed font-semibold italic text-left ${
                  ora.respondido 
                    ? "line-through text-gray-400 dark:text-zinc-500 shrink-0" 
                    : "text-slate-800 dark:text-slate-200"
                }`}>
                  "{ora.texto}"
                </p>
              </div>

              {/* Botão de Marcar respondido */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => alternarRespondida(ora.id)}
                  className={`py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${
                    ora.respondido
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/60"
                      : "bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 hover:border-teal-500 text-slate-700 hover:text-teal-700 dark:text-zinc-350"
                  }`}
                >
                  {ora.respondido ? "✓ Clamor Respondido!" : "Clamado / Em Oração"}
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
