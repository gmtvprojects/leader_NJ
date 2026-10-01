import React, { useState, useEffect } from "react";
import {
  Heart,
  Plus,
  Check,
  Trash2,
  ArrowLeft,
  ChevronRight,
  Calendar,
  User,
  MessageSquareHeart,
  ChevronDown,
  Search,
  ClipboardList,
  Loader2
} from "lucide-react";
import { api } from "../lib/api";
import { Membro } from "../types";

export type StatusPedido = "pendente" | "finalizado" | "resolvido";

export interface PedidoOracao {
  id: string;
  membroId: string;
  membroNome: string;
  texto: string;
  data: string; // YYYY-MM-DD
  status: StatusPedido;
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
  data: db.criado_em ? String(db.criado_em).substring(0, 10) : new Date().toISOString().substring(0, 10),
  status: db.status === "finalizado" || db.status === "resolvido" ? db.status : (db.respondido ? "resolvido" : "pendente")
});

const STATUS_LABEL: Record<StatusPedido, string> = {
  pendente: "Em oração",
  finalizado: "Finalizado",
  resolvido: "Resolvido"
};

export default function Oracao({ onVoltar, liderId }: OracaoProps) {
  const [oracoes, setOracoes] = useState<PedidoOracao[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [view, setView] = useState<"lista" | "novo" | "registro">("lista");

  // Busca no Registro de Pedidos
  const [buscaRegistro, setBuscaRegistro] = useState("");

  // Estados do Formulário Criador
  const [membroId, setMembroId] = useState("");
  const [texto, setTexto] = useState("");
  const [data, setData] = useState("");

  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Carregar membros do servidor
      const { data: membrosData, error: membrosError } = await api
        .from('membros')
        .select('*')
        .eq('lider_id', liderId);

      if (membrosError) throw membrosError;

      const formattedMembros = (membrosData || []).map(mapToTSMembro);
      setMembros(formattedMembros);
      if (formattedMembros.length > 0) {
        setMembroId(formattedMembros[0].id);
      }

      // 2. Carregar pedidos de oração do servidor
      const { data: oracaoData, error: oracaoError } = await api
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

  const abrirNovo = () => {
    setTexto("");
    setData(new Date().toISOString().substring(0, 10));
    if (!membroId && membros.length > 0) setMembroId(membros[0].id);
    setView("novo");
  };

  const handleSalvarOracao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || !membroId) return;

    const membroSelecionado = membros.find(m => m.id === membroId);
    const mNome = membroSelecionado ? membroSelecionado.nome : "Visitante / Convidado";

    setLoading(true);
    try {
      const { data: insertData, error } = await api
        .from('oracao_pedidos')
        .insert({
          lider_id: liderId,
          membro_id: membroId || null,
          membro_nome: mNome,
          texto: texto.trim(),
          respondido: false,
          status: "pendente",
          criado_em: `${data}T12:00:00`
        })
        .select()
        .single();

      if (error) throw error;

      setOracoes(prev => [mapToTS(insertData), ...prev]);
      setTexto("");
      setView("lista");
    } catch (error: any) {
      console.error('Erro ao criar pedido de oração:', error);
      alert('Não foi possível gravar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  const alterarStatus = async (id: string, status: StatusPedido) => {
    setLoading(true);
    try {
      const { data: updatedData, error } = await api
        .from('oracao_pedidos')
        .update({ status, respondido: status !== "pendente" })
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
        const { error } = await api
          .from('oracao_pedidos')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setOracoes(prev => prev.filter(o => o.id !== id));
      } catch (error: any) {
        console.error('Erro ao excluir pedido:', error);
        alert('Não foi possível remover o registro pastoral.');
      } finally {
        setLoading(false);
      }
    }
  };

  const concluidos = oracoes.filter(o => o.status !== "pendente");
  const registroFiltrado = concluidos.filter(o =>
    o.membroNome.toLowerCase().includes(buscaRegistro.trim().toLowerCase())
  );

  const renderCard = (ora: PedidoOracao, comAcoes: boolean) => {
    const concluido = ora.status !== "pendente";
    return (
      <div
        key={ora.id}
        className={`bg-white dark:bg-zinc-900 border-2 p-4 rounded-3xl flex flex-col space-y-3.5 shadow-sm transition-all ${
          concluido ? "border-emerald-500" : "border-gray-300 dark:border-zinc-700"
        }`}
      >
        <div className="flex justify-between items-start gap-1">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl shrink-0 ${
              concluido
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                : "bg-[#E1F5EE] dark:bg-teal-950/40 text-teal-700 dark:text-teal-400"
            }`}>
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none font-sans">{ora.membroNome}</h3>
              <p className="text-[0.5625rem] text-gray-400 font-mono mt-1 uppercase flex items-center gap-1.5 select-none text-left">
                <Calendar className="w-3 h-3 shrink-0" />
                {new Date(ora.data + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <button
            onClick={() => deletarPedido(ora.id)}
            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 text-slate-350 dark:text-zinc-650 rounded-lg transition cursor-pointer"
            aria-label="Excluir pedido"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-gray-105 dark:border-zinc-800/80">
          <p className="text-[0.7188rem] leading-relaxed font-semibold italic text-left text-slate-800 dark:text-slate-200">
            "{ora.texto}"
          </p>
        </div>

        {comAcoes && (
          <div className="flex flex-wrap justify-end items-center gap-2 pt-1">
            {concluido ? (
              <>
                <span className="py-1.5 px-3 rounded-lg text-[0.5625rem] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/60">
                  ✓ {STATUS_LABEL[ora.status]}
                </span>
                <button
                  onClick={() => alterarStatus(ora.id, "pendente")}
                  className="text-[0.5625rem] font-bold uppercase text-gray-400 hover:text-teal-700 hover:underline cursor-pointer"
                >
                  Reabrir
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => alterarStatus(ora.id, "finalizado")}
                  className="py-1.5 px-3 rounded-lg text-[0.5625rem] font-black uppercase tracking-wider transition cursor-pointer bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 dark:text-zinc-300"
                >
                  Finalizar Pedido
                </button>
                <button
                  onClick={() => alterarStatus(ora.id, "resolvido")}
                  className="py-1.5 px-3 rounded-lg text-[0.5625rem] font-black uppercase tracking-wider transition cursor-pointer bg-teal-700 hover:bg-teal-600 text-white border border-teal-700"
                >
                  Pedido Resolvido
                </button>
              </>
            )}
          </div>
        )}

        {!comAcoes && (
          <div className="flex justify-end">
            <span className="py-1 px-2.5 rounded-lg text-[0.5625rem] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/60">
              ✓ {STATUS_LABEL[ora.status]}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn font-sans text-left">

      {loading && (
        <div className="fixed inset-0 bg-white/60 dark:bg-zinc-950/60 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f766e]" />
            <p className="text-[0.625rem] uppercase font-black tracking-wider text-[#0f766e]">Intercedendo e salvando...</p>
          </div>
        </div>
      )}

      {/* BREADCRUMB (telas internas) */}
      {view !== "lista" && (
        <nav aria-label="Navegação" className="flex items-center gap-1.5 text-[0.6875rem] font-bold">
          <button
            type="button"
            onClick={() => setView("lista")}
            className="flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Pedidos de Oração
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-slate-900 dark:text-white">{view === "novo" ? "Novo Pedido" : "Registro de Pedidos"}</span>
        </nav>
      )}

      {/* LISTA PRINCIPAL */}
      {view === "lista" && (
        <>
          <header className="flex justify-between items-center gap-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
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
                <span className="text-[0.625rem] uppercase font-black tracking-widest text-[#0f766e] dark:text-teal-400">Intercessão Individual</span>
                <h1 className="text-lg font-bold text-slate-950 dark:text-white tracking-tight leading-none mt-0.5 flex items-center gap-1.5 font-sans">
                  Pedidos de Oração
                </h1>
              </div>
            </div>

            <button
              onClick={() => { setBuscaRegistro(""); setView("registro"); }}
              className="px-3 py-2 bg-white dark:bg-zinc-900 border border-teal-700 text-teal-700 dark:text-teal-400 dark:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-bold text-[0.625rem] uppercase tracking-wider"
            >
              <ClipboardList className="w-4 h-4" /> Registro de Pedidos
            </button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3 font-sans pb-24">
            {oracoes.length === 0 ? (
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 py-12 rounded-2xl text-center space-y-1.5">
                <Heart className="w-8 h-8 text-rose-500 fill-rose-500/10 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Nenhum pedido encontrado</p>
                <p className="text-[0.625rem] text-gray-400 uppercase font-medium">Crie um novo pedido no botão "+"</p>
              </div>
            ) : (
              oracoes.map(ora => renderCard(ora, true))
            )}
          </div>

          <button
            id="btn-adicionar-pedido"
            onClick={abrirNovo}
            className="fixed bottom-20 md:bottom-8 right-6 md:right-8 z-30 p-4 bg-teal-700 hover:bg-teal-600 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 cursor-pointer transition-transform flex items-center justify-center"
            aria-label="Adicionar pedido de oração"
          >
            <Plus className="w-6 h-6" />
          </button>
        </>
      )}

      {/* NOVO PEDIDO */}
      {view === "novo" && (
        <form
          onSubmit={handleSalvarOracao}
          className="bg-white dark:bg-zinc-900 border border-teal-100 dark:border-zinc-800 p-4 lg:p-6 rounded-2xl shadow-md space-y-3.5 w-full max-w-3xl"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
            <MessageSquareHeart className="w-4.5 h-4.5 text-[#0f766e]" /> Novo Pedido de Oração
          </h3>

          <div className="space-y-3 font-sans">
            <div className="space-y-1">
              <label htmlFor="form-ora-membro" className="block text-[0.5rem] font-bold uppercase text-gray-400">Membro do Grupo *</label>
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

            <div className="space-y-1">
              <label htmlFor="form-ora-texto" className="block text-[0.5rem] font-bold uppercase text-gray-400">Descrição do Pedido *</label>
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

            <div className="space-y-1">
              <label htmlFor="form-ora-data" className="block text-[0.5rem] font-bold uppercase text-gray-400">Data *</label>
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
              <Check className="w-4 h-4 font-bold" /> Registrar Pedido
            </button>
          </div>
        </form>
      )}

      {/* REGISTRO DE PEDIDOS (FINALIZADOS E RESOLVIDOS) */}
      {view === "registro" && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight leading-none flex items-center gap-1.5 font-sans">
              <ClipboardList className="w-5 h-5 text-teal-700 dark:text-teal-400" /> Registro de Pedidos
            </h1>
            <p className="text-[0.625rem] uppercase font-black text-gray-400 mt-1 tracking-wider">
              {concluidos.length} {concluidos.length === 1 ? "pedido registrado" : "pedidos registrados"} · {concluidos.filter(o => o.status === "resolvido").length} resolvidos · {concluidos.filter(o => o.status === "finalizado").length} finalizados
            </p>
          </div>

          <div className="relative max-w-3xl">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="busca-registro-pedidos"
              type="text"
              value={buscaRegistro}
              onChange={(e) => setBuscaRegistro(e.target.value)}
              placeholder="Pesquisar por membro..."
              className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
            />
          </div>

          {buscaRegistro.trim() && (
            <p className="text-[0.625rem] font-bold text-gray-400 uppercase tracking-widest">
              {registroFiltrado.length} {registroFiltrado.length === 1 ? "resultado" : "resultados"}
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3 pb-6">
            {registroFiltrado.length === 0 ? (
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 py-12 rounded-2xl text-center text-xs text-gray-400">
                Nenhum pedido finalizado ou resolvido encontrado.
              </div>
            ) : (
              registroFiltrado.map(ora => renderCard(ora, false))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
