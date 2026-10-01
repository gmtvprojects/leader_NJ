import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Check, 
  Trash2, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Coffee, 
  Heart, 
  CheckCircle, 
  X,
  FileText,
  Pencil,
  ArrowLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { api } from "../lib/api";
import { Membro, Reuniao } from "../types";
import { extrairMetadadosMembro } from "../utils/membroUtils";

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

const getSabado = () => {
  const hoje = new Date()
  const diaSemana = hoje.getDay() // 0=Dom, 6=Sab
  const diasParaSabado = diaSemana === 6 ? 0 : (6 - diaSemana)
  const sabado = new Date(hoje)
  sabado.setDate(hoje.getDate() + diasParaSabado)
  return sabado.toISOString().split('T')[0]
}

interface ReunioesProps {
  liderId: string;
}

export default function Reunioes({ liderId }: ReunioesProps) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Formulário da reunião do sábado
  const [dataReuniao, setDataReuniao] = useState(getSabado());
  const [tema, setTema] = useState("");
  const [lanche, setLanche] = useState("");
  const [lancheEquipe, setLancheEquipe] = useState("");
  const [oracoes, setOracoes] = useState("");
  const [presentesIds, setPresentesIds] = useState<string[]>([]);
  
  // Controle de Interface
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [isFazerChamada, setIsFazerChamada] = useState(false);
  const [mostrarChecklistSeguranca, setMostrarChecklistSeguranca] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  
  // Checklist "NADA ACONTECEU"
  const [limpeza, setLimpeza] = useState(false);
  const [mobiliario, setMobiliario] = useState(false);
  const [fotoEnviada, setFotoEnviada] = useState(false);
  const [comidaRecolhida, setComidaRecolhida] = useState(false);

  // Reunião em Detalhe
  const [reuniaoDetalhada, setReuniaoDetalhada] = useState<Reuniao | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // 1. Carregar membros do servidor
      const { data: membrosData, error: membrosError } = await api
        .from('membros')
        .select('*')
        .eq('lider_id', liderId);

      if (membrosError) throw membrosError;
      setMembros((membrosData || []).map(mapToTSMembro));

      // 2. Carregar reuniões com JOIN de presenças
      const { data: reunioesData, error: reunioesError } = await api
        .from('reunioes')
        .select('*, reuniao_presencas(membro_id)')
        .eq('lider_id', liderId)
        .order('data', { ascending: false });

      if (reunioesError) throw reunioesError;

      const formattedReunioes: Reuniao[] = (reunioesData || []).map((r: any) => ({
        id: r.id,
        data: r.data,
        tema: r.tema || '',
        lanche: r.lanche || '',
        lancheEquipe: r.lanche_equipe || '',
        oracoes: r.oracoes || '',
        presentes: (r.reuniao_presencas || []).map((p: any) => p.membro_id)
      }));

      setReunioes(formattedReunioes);
    } catch (error: any) {
      console.error('Erro ao carregar reuniões:', error);
      alert('Não foi possível carregar as reuniões do servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    setDataReuniao(getSabado());
  }, [liderId]);

  // Salvar uma Reunião
  const handleSalvarReuniao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim()) {
      alert("Por favor, preencha o Tema/Roteiro da reunião!");
      return;
    }

    setLoading(true);
    try {
      if (editandoId) {
        // Edição: atualiza a ata e substitui a lista de presenças (faltas dos membros não são recalculadas)
        const { error: updError } = await api
          .from('reunioes')
          .update({
            data: dataReuniao,
            tema: tema.trim(),
            lanche: lanche.trim(),
            lanche_equipe: lancheEquipe || null,
            oracoes: oracoes.trim()
          })
          .eq('id', editandoId);
        if (updError) throw updError;

        const { error: delError } = await api
          .from('reuniao_presencas')
          .delete()
          .eq('reuniao_id', editandoId);
        if (delError) throw delError;

        if (presentesIds.length > 0) {
          const { error: insError } = await api
            .from('reuniao_presencas')
            .insert(presentesIds.map(mId => ({ reuniao_id: editandoId, membro_id: mId })));
          if (insError) throw insError;
        }

        fecharForm();
        await carregarDados();
        setMensagemSucesso("Reunião atualizada!");
        setTimeout(() => setMensagemSucesso(""), 4000);
        return;
      }

      // 1. Criar reunião
      const { data: novaReuniaoData, error: reuniaoError } = await api
        .from('reunioes')
        .insert({
          lider_id: liderId,
          data: dataReuniao,
          tema: tema.trim(),
          lanche: lanche.trim(),
          lanche_equipe: lancheEquipe || null,
          oracoes: oracoes.trim()
        })
        .select()
        .single();

      if (reuniaoError) throw reuniaoError;

      const reuniaoCriadaId = novaReuniaoData.id;

      // 2. Registrar lista de presenças em reuniao_presencas
      if (presentesIds.length > 0) {
        const presencasParaInserir = presentesIds.map(mId => ({
          reuniao_id: reuniaoCriadaId,
          membro_id: mId
        }));

        const { error: presencasError } = await api
          .from('reuniao_presencas')
          .insert(presencasParaInserir);

        if (presencasError) throw presencasError;
      }

      // 3. Atualizar inteligência de faltas e status dos membros
      const promises = membros.map(async (m) => {
        const presente = presentesIds.includes(m.id);
        let novasFaltas = presente ? 0 : m.faltas + 1;
        let novoStatus = m.status;

        if (presente) {
          if (m.status === "Ausente") novoStatus = "Ativo";
        } else {
          if (novasFaltas >= 2) novoStatus = "Ausente";
        }

        return api
          .from('membros')
          .update({
            faltas: novasFaltas,
            status: novoStatus
          })
          .eq('id', m.id);
      });

      await Promise.all(promises);

      // Limpar e fechar formulário
      fecharForm();

      // Recarregar dados para atualizar histórico e painel
      await carregarDados();

      // Exibe checklist de segurança de encerramento do local "NADA ACONTECEU"
      setMostrarChecklistSeguranca(true);
      setMensagemSucesso("Reunião salva e presença registrada! 🎉");
      setTimeout(() => {
        setMensagemSucesso("");
      }, 4000);
    } catch (error: any) {
      console.error('Erro ao salvar reunião:', error);
      alert('Não foi possível gravar a reunião no servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Equipes disponíveis para o lanche: os G.A.s dos membros (mantém o valor já salvo ao editar)
  const equipesLanche = Array.from(
    new Set([...membros.map(m => m.ga?.trim()), lancheEquipe.trim()].filter((g): g is string => !!g))
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const fecharForm = () => {
    setMostrarForm(false);
    setEditandoId(null);
    setTema("");
    setLanche("");
    setLancheEquipe("");
    setOracoes("");
    setPresentesIds([]);
    setIsFazerChamada(false);
    setDataReuniao(getSabado());
  };

  const abrirNovaReuniao = () => {
    fecharForm();
    setMostrarForm(true);
  };

  const abrirEdicao = (r: Reuniao, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReuniaoDetalhada(null);
    setEditandoId(r.id);
    setDataReuniao(r.data);
    setTema(r.tema);
    setLanche(r.lanche || "");
    setLancheEquipe(r.lancheEquipe || "");
    setOracoes(r.oracoes || "");
    setPresentesIds(r.presentes || []);
    setIsFazerChamada(false);
    setMostrarForm(true);
  };

  // Excluir reunião do histórico
  const handleExcluirReuniao = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o modal de detalhe
    if (confirm("Deseja mesmo remover esta reunião do histórico?")) {
      setLoading(true);
      try {
        const { error } = await api
          .from('reunioes')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setReunioes(prev => prev.filter(r => r.id !== id));
        alert('Reunião removida com sucesso.');
      } catch (error: any) {
        console.error('Erro ao remover reunião:', error);
        alert('Não foi possível apagar os dados da reunião.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Alternar presença do membro no formulário de hoje
  const togglePresenca = (id: string) => {
    if (presentesIds.includes(id)) {
      setPresentesIds(presentesIds.filter(item => item !== id));
    } else {
      setPresentesIds([...presentesIds, id]);
    }
  };

  // Fechar o checklist de segurança e salvar estado
  const concluirSeguranca = () => {
    setLimpeza(false);
    setMobiliario(false);
    setFotoEnviada(false);
    setComidaRecolhida(false);
    setMostrarChecklistSeguranca(false);
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left no-scrollbar">
      
      {loading && (
        <div className="fixed inset-0 bg-white/60 dark:bg-zinc-950/60 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f766e]" />
            <p className="text-[0.625rem] uppercase font-black tracking-wider text-[#0f766e]">Gravando com segurança...</p>
          </div>
        </div>
      )}

      {!mostrarForm && (
      <>
      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight leading-none flex items-center gap-1.5 font-sans">
          <BookOpen className="w-5 h-5 text-teal-700 dark:text-teal-400" /> Histórico de Reuniões
        </h1>
        <p className="text-[0.625rem] uppercase font-black text-gray-400 mt-1 tracking-wider">Atas, presenças e roteiros</p>
      </div>

      {mensagemSucesso && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-950/30 p-3 rounded-2xl flex items-center gap-2 text-emerald-800 dark:text-emerald-400 text-xs font-semibold animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* HISTÓRICO DE REUNIÕES */}
      <section className="space-y-2.5 pb-24">
        {reunioes.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl text-gray-400 font-sans">
            Nenhuma reunião registrada. Use o botão + para criar a primeira.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3">
            {reunioes.map((r) => (
              <div
                key={r.id}
                onClick={() => setReuniaoDetalhada(r)}
                className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800/85 p-3.5 rounded-2xl flex items-center justify-between hover:border-teal-500 cursor-pointer transition shadow-sm"
              >
                <div className="space-y-1 pr-4 min-w-0">
                  <div className="flex items-center gap-1 text-[0.625rem] text-gray-400 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                    <span className="bg-teal-50 dark:bg-teal-950/25 px-1.5 py-0.5 rounded text-teal-700 dark:text-teal-400 font-bold shrink-0 ml-1.5 uppercase text-[0.5rem] font-sans">
                      {r.presentes ? r.presentes.length : 0} PRESENTES
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 italic font-sans leading-relaxed">
                    "{r.tema}"
                  </h3>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => abrirEdicao(r, e)}
                    className="p-2.5 text-gray-400 hover:text-teal-600 border border-transparent hover:border-teal-100 rounded-xl transition cursor-pointer"
                    aria-label="Editar reunião"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleExcluirReuniao(r.id, e)}
                    className="p-2.5 text-gray-400 hover:text-rose-500 border border-transparent hover:border-rose-100 hover:bg-rose-50/10 rounded-xl transition cursor-pointer"
                    aria-label="Excluir reunião"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BOTÃO FLUTUANTE: NOVA REUNIÃO */}
      <button
        id="btn-nova-reuniao"
        onClick={abrirNovaReuniao}
        className="fixed bottom-20 md:bottom-8 right-6 md:right-8 z-30 p-4 bg-teal-700 hover:bg-teal-600 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 cursor-pointer transition-transform flex items-center justify-center"
        aria-label="Nova Reunião"
      >
        <Plus className="w-6 h-6" />
      </button>
      </>
      )}

      {/* FORMULÁRIO (NOVA REUNIÃO / EDIÇÃO) */}
      {mostrarForm && (
      <>
      {/* BREADCRUMB */}
      <nav aria-label="Navegação" className="flex items-center gap-1.5 text-[0.6875rem] font-bold font-sans">
        <button
          type="button"
          onClick={fecharForm}
          className="flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Reuniões
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-slate-900 dark:text-white">{editandoId ? "Editar Reunião" : "Nova Reunião"}</span>
      </nav>

      <section className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-4.5 lg:p-7 space-y-4 w-full max-w-5xl">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800/40">
          <span className="text-xs font-black uppercase text-teal-750 dark:text-teal-450 tracking-wider flex items-center gap-1">
            <Clock className="w-4 h-4 text-teal-600" /> {editandoId ? "Editar Reunião" : "Nova Reunião"}
          </span>
          <div className="flex items-center gap-2">
            <input
              id="data-reuniao-input"
              type="date"
              value={dataReuniao}
              onChange={(e) => setDataReuniao(e.target.value)}
              className="text-[0.6563rem] font-bold px-2 py-1 bg-slate-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-805 rounded-lg text-slate-900 dark:text-white outline-none cursor-pointer"
            />
          </div>
        </div>

        <form onSubmit={handleSalvarReuniao} className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-x-8 text-xs font-sans">
          
          {/* LANÇAMENTO CHAMADA BUTTON */}
          <div className="space-y-1.5 text-left lg:col-span-2">
            <div className="flex justify-between items-center">
              <span className="text-[0.625rem] font-black uppercase text-gray-400 dark:text-zinc-500 tracking-widest font-sans">
                PRESENÇA
              </span>
              <span className="text-[0.5938rem] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded-full font-sans">
                {presentesIds.length} presentes
              </span>
            </div>

            {!isFazerChamada ? (
              <button
                id="btn-abrir-chamada"
                type="button"
                onClick={() => setIsFazerChamada(true)}
                className="w-full py-3 border border-dashed border-gray-200 dark:border-zinc-800 hover:border-teal-500 bg-slate-50/40 dark:bg-zinc-900 text-slate-800 dark:text-slate-300 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center font-extrabold uppercase tracking-wider text-[0.625rem]"
              >
                <Users className="w-4 h-4 text-teal-600" /> REALIZAR CHAMADA
              </button>
            ) : (
              <div className="bg-slate-50 dark:bg-[#161618] border border-gray-100 dark:border-zinc-800 p-3.5 rounded-2xl space-y-3 max-h-56 overflow-y-auto animate-fadeIn">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-zinc-800 pb-1.5">
                  <span className="text-[0.5625rem] font-black text-gray-400 uppercase">Selecione os Presentes</span>
                  <button
                    type="button"
                    onClick={() => setIsFazerChamada(false)}
                    className="text-[0.5938rem] font-extrabold text-teal-700 dark:text-teal-400 uppercase hover:underline"
                  >
                    Fechar Chamada
                  </button>
                </div>
                
                {membros.length === 0 ? (
                  <p className="text-center text-[0.625rem] text-gray-400 py-3">Adicione membros na aba Membros para chamá-los.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {membros.map(m => {
                       const isPresent = presentesIds.includes(m.id);
                       return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => togglePresenca(m.id)}
                          className={`p-2.5 rounded-xl border text-[0.6875rem] font-bold text-left flex justify-between items-center cursor-pointer transition ${
                            isPresent
                              ? "bg-teal-50/60 dark:bg-teal-950/20 border-teal-500 text-teal-800 dark:text-teal-400"
                              : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-slate-700 dark:text-gray-400 opacity-80"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-sans font-semibold">{m.nome}</span>
                              {m.origemTransicao && (
                                <span className="text-[0.4688rem] font-black uppercase px-1 py-0.2 bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 rounded">
                                  J1 ➔ J2
                                </span>
                              )}
                            </div>
                            <span className="text-[0.5313rem] text-gray-400 block">
                              📍 {m.ga || "Sem G.A"} • {m.status}
                            </span>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isPresent ? "bg-teal-600 border-teal-700 text-white" : "border-gray-200 bg-transparent"
                          }`}>
                            {isPresent && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tema / Roteiro da Reunião (Textarea) */}
          <div className="space-y-1">
            <label htmlFor="tema-reuniao" className="block text-[0.625rem] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest font-sans">
              ROTEIRO *
            </label>
            <textarea
              id="tema-reuniao"
              rows={4}
              required
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex. Parábola do Semeador • Aplicando o Fruto do Espírito..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white leading-relaxed resize-none"
            />
          </div>

          {/* Quem Trouxe o lanche (Input) */}
          <div className="space-y-1">
            <label htmlFor="lanche-reuniao" className="block text-[0.625rem] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest font-sans flex items-center gap-1">
              <Coffee className="w-3.5 h-3.5 text-amber-500" /> LANCHE
            </label>
            <select
              id="lanche-equipe"
              aria-label="Equipe que levou o lanche"
              value={lancheEquipe}
              onChange={(e) => setLancheEquipe(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="">Selecione a equipe que levou</option>
              {equipesLanche.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
            <input
              id="lanche-reuniao"
              type="text"
              value={lanche}
              onChange={(e) => setLanche(e.target.value)}
              placeholder="Qual foi o lanche? (opcional) Ex. bolo de chocolate e suco..."
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Pedidos de oração do dia */}
          <div className="space-y-1 lg:col-span-2">
            <label htmlFor="oracao-reuniao" className="block text-[0.625rem] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest font-sans flex items-center gap-1">
               <Heart className="w-3.5 h-3.5 text-rose-500" /> PEDIDOS DE ORAÇÃO
            </label>
            <textarea
              id="oracao-reuniao"
              rows={2}
              value={oracoes}
              onChange={(e) => setOracoes(e.target.value)}
              placeholder="Insira pedidos importantes de oração do grupo..."
              className="w-full text-xs p-3 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white leading-relaxed resize-none"
            />
          </div>

          {/* SALVAR REUNIÃO */}
          <button
            id="btn-salvar-ata"
            type="submit"
            className="w-full lg:col-span-2 h-11 bg-teal-700 hover:bg-teal-600 font-bold text-xs uppercase tracking-widest rounded-xl text-white transition shadow-md flex items-center justify-center gap-1 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 text-white" /> {editandoId ? "Salvar Alterações" : "Concluir e Salvar Reunião"}
          </button>

        </form>
      </section>
      </>
      )}

      {/* CHECKLIST "NADA ACONTECEU" (SEGURANÇA APÓS SALVAR) */}
      {mostrarChecklistSeguranca && (
        <section className="bg-amber-50/50 dark:bg-[#1c1917]/25 border border-amber-200 dark:border-amber-900/40 p-4.5 rounded-3xl space-y-3 animate-fadeIn text-left">
          <div className="flex items-center gap-1.5 pb-1">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[0.625rem] font-black uppercase text-amber-800 dark:text-amber-400 tracking-wider">
              Segurança e Manual: NADA ACONTECEU!
            </span>
          </div>
          <p className="text-[0.6563rem] leading-relaxed text-amber-700 dark:text-amber-400/90 font-medium font-sans">
            Para a integridade e excelente testemunho do local, complete o protocolo obrigatório de saída de templo/casa:
          </p>

          <div className="space-y-2.5 mt-2">
            <button
              onClick={() => setLimpeza(!limpeza)}
              className="w-full p-2.5 bg-white dark:bg-zinc-900/60 border border-amber-100 dark:border-zinc-800 rounded-xl flex items-center gap-2.5 text-[0.6875rem] font-semibold text-left cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                limpeza ? "bg-amber-600 border-amber-700 text-white" : "border-gray-300 dark:border-zinc-700"
              }`}>
                {limpeza && <Check className="w-2.5 h-2.5" />}
              </div>
              <span className="font-sans text-slate-800 dark:text-zinc-200">Limpeza completa do local de reunião ✓</span>
            </button>

            <button
              onClick={() => setMobiliario(!mobiliario)}
              className="w-full p-2.5 bg-white dark:bg-zinc-900/60 border border-amber-100 dark:border-zinc-800 rounded-xl flex items-center gap-2.5 text-[0.6875rem] font-semibold text-left cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                mobiliario ? "bg-amber-600 border-amber-700 text-white" : "border-gray-300 dark:border-zinc-700"
              }`}>
                {mobiliario && <Check className="w-2.5 h-2.5" />}
              </div>
              <span className="font-sans text-slate-800 dark:text-zinc-200">Arrumação e mobiliário de volta aos lugares ✓</span>
            </button>

            <button
              onClick={() => setFotoEnviada(!fotoEnviada)}
              className="w-full p-2.5 bg-white dark:bg-zinc-900/60 border border-amber-100 dark:border-zinc-800 rounded-xl flex items-center gap-2.5 text-[0.6875rem] font-semibold text-left cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                fotoEnviada ? "bg-amber-600 border-amber-700 text-white" : "border-gray-300 dark:border-zinc-700"
              }`}>
                {fotoEnviada && <Check className="w-2.5 h-2.5" />}
              </div>
              <span className="font-sans text-slate-800 dark:text-zinc-200">Foto enviada ao responsável pelo espaço ✓</span>
            </button>

            <button
              onClick={() => setComidaRecolhida(!comidaRecolhida)}
              className="w-full p-2.5 bg-white dark:bg-zinc-900/60 border border-amber-100 dark:border-zinc-800 rounded-xl flex items-center gap-2.5 text-[0.6875rem] font-semibold text-left cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                comidaRecolhida ? "bg-amber-600 border-amber-700 text-white" : "border-gray-300 dark:border-zinc-700"
              }`}>
                {comidaRecolhida && <Check className="w-2.5 h-2.5" />}
              </div>
              <span className="font-sans text-slate-800 dark:text-zinc-200">Lixos e restos de lanche recolhidos ✓</span>
            </button>
          </div>

          <button
            onClick={concluirSeguranca}
            disabled={!(limpeza && mobiliario && fotoEnviada && comidaRecolhida)}
            className={`w-full py-2 bg-amber-600 hover:bg-amber-500 font-bold uppercase text-[0.625rem] tracking-widest rounded-xl text-white transition-all mt-4 cursor-pointer text-center ${
              limpeza && mobiliario && fotoEnviada && comidaRecolhida ? "opacity-100" : "opacity-40 cursor-not-allowed"
            }`}
          >
            Protocolo Concluído com Sucesso! 🛡️
          </button>
        </section>
      )}

      {/* MODAL DETALHADO — ATA DE REUNIÃO SECUNDÁRIA */}
      {reuniaoDetalhada && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-3xl w-full max-w-sm max-h-[80vh] overflow-y-auto p-5 animate-slideUp space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-xs font-black uppercase text-teal-710 dark:text-teal-400 flex items-center gap-1 font-sans">
                <FileText className="w-4 h-4 text-teal-600" /> Detalhes da Ata Pastoral
              </span>
              <button
                onClick={() => setReuniaoDetalhada(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-left text-slate-800 dark:text-zinc-200 font-sans">
              
              <div>
                <span className="text-[0.5625rem] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Data da Reunião</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {new Date(reuniaoDetalhada.data + "T12:00:00").toLocaleDateString("pt-BR")}
                </p>
              </div>

              <div>
                <span className="text-[0.5625rem] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Tema / Roteiro</span>
                <p className="font-medium p-3 bg-slate-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl italic leading-relaxed">
                  "{reuniaoDetalhada.tema}"
                </p>
              </div>

              <div>
                <span className="text-[0.5625rem] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Comunhão e Lanche</span>
                <p className="font-bold text-slate-800 dark:text-white">
                  {[reuniaoDetalhada.lancheEquipe, reuniaoDetalhada.lanche].filter(Boolean).join(" — ") || "Nenhum cadastrado"}
                </p>
              </div>

              <div>
                <span className="text-[0.5625rem] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Pedidos de Intercessão</span>
                <p className="font-medium p-3 bg-red-50/10 dark:bg-zinc-950 border border-rose-100/30 dark:border-zinc-850 rounded-xl italic leading-relaxed">
                  {reuniaoDetalhada.oracoes || "Nenhum registrado"}
                </p>
              </div>

              <div>
                <span className="text-[0.5625rem] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Participantes Presentes ({reuniaoDetalhada.presentes ? reuniaoDetalhada.presentes.length : 0})</span>
                {reuniaoDetalhada.presentes && reuniaoDetalhada.presentes.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {reuniaoDetalhada.presentes.map(pId => {
                      const mInfo = membros.find(m => m.id === pId);
                      return (
                        <span key={pId} className="bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-400 border border-teal-200/50 dark:border-teal-900/40 text-[0.5938rem] font-bold px-2 py-0.5 rounded-lg">
                          {mInfo ? mInfo.nome : "Participante"}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="italic text-gray-400 text-[0.625rem]">Sem registros de presenças nesta ata.</p>
                )}
              </div>

            </div>

            <button
              onClick={() => abrirEdicao(reuniaoDetalhada)}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" /> Editar Reunião
            </button>

            <button
              onClick={() => setReuniaoDetalhada(null)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-800 text-slate-800 dark:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              Fechar Detalhes
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
