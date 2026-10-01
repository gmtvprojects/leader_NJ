import React, { useState, useEffect } from "react";
import { 
  Cake, 
  Phone, 
  MessageCircle, 
  Heart, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  Calendar,
  Loader2
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface MembroAniversariante {
  id: string;
  nome: string;
  aniversario: string; // YYYY-MM-DD
  linguagemAmor: string;
  contato1: string;
  contato2: string;
  diffDays: number;
  mesNiver: number;
  diaNiver: number;
  proximoNiver: Date;
}

interface AniversariantesProps {
  liderId: string;
  onVoltar: () => void;
}

export default function Aniversariantes({ liderId, onVoltar }: AniversariantesProps) {
  const [membros, setMembros] = useState<MembroAniversariante[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [celebrados, setCelebrados] = useState<{ [key: string]: boolean }>({});
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Obter formato YYYY-MM-DD para hoje
  const obterDataHojeStr = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  const obterDataCelebId = (membroId: string) => {
    return `ga_celebrado_${membroId}_${obterDataHojeStr()}`;
  };

  useEffect(() => {
    carregarAniversariantes();
  }, [liderId]);

  const carregarAniversariantes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("membros")
        .select("id, nome, aniversario, linguagem_amor, contato1, contato2")
        .eq("lider_id", liderId);

      if (error) throw error;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const listaMapeada: MembroAniversariante[] = [];
      const celebradosState: { [key: string]: boolean } = {};

      if (data) {
        data.forEach((m: any) => {
          if (!m.aniversario) return;

          const partes = m.aniversario.split("-");
          if (partes.length < 3) return;

          const mesNiver = parseInt(partes[1], 10) - 1; // 0-11
          const diaNiver = parseInt(partes[2], 10);

          // Criar aniversário deste ano
          const niverEsteAno = new Date(hoje.getFullYear(), mesNiver, diaNiver);
          niverEsteAno.setHours(0, 0, 0, 0);

          let proximoNiver = new Date(niverEsteAno);
          if (niverEsteAno.getTime() < hoje.getTime() - 1000 * 60 * 60 * 24) {
            proximoNiver.setFullYear(hoje.getFullYear() + 1);
          }

          // Diferença em dias
          const diffTime = proximoNiver.getTime() - hoje.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          listaMapeada.push({
            id: m.id,
            nome: m.nome || "",
            aniversario: m.aniversario,
            linguagemAmor: m.linguagem_amor || "",
            contato1: m.contato1 || "",
            contato2: m.contato2 || "",
            diffDays,
            mesNiver,
            diaNiver,
            proximoNiver
          });

          // Carregar status do localStorage
          const celebKey = `ga_celebrado_${m.id}_${obterDataHojeStr()}`;
          if (localStorage.getItem(celebKey) === "true") {
            celebradosState[m.id] = true;
          }
        });
      }

      // Ordenar do mais próximo para o mais distante
      listaMapeada.sort((a, b) => a.diffDays - b.diffDays);
      setMembros(listaMapeada);
      setCelebrados(celebradosState);
    } catch (err) {
      console.error("Erro ao carregar aniversariantes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCelebrado = (membroId: string) => {
    const key = obterDataCelebId(membroId);
    const novoStatus = !celebrados[membroId];
    
    if (novoStatus) {
      localStorage.setItem(key, "true");
    } else {
      localStorage.removeItem(key);
    }

    setCelebrados(prev => ({
      ...prev,
      [membroId]: novoStatus
    }));
  };

  const obterIniciais = (nome: string) => {
    const partes = nome.split(" ");
    if (partes.length >= 2) {
      return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  const obterLinguagemAmorMeta = (linguagem: string) => {
    const normalized = (linguagem || "").trim().toLowerCase();
    if (normalized.includes("palavra")) {
      return {
        emoji: "💬",
        label: "Palavras de Afirmação",
        dica: "Envie uma mensagem especial e de coração"
      };
    }
    if (normalized.includes("toque")) {
      return {
        emoji: "🤝",
        label: "Toque Físico",
        dica: "Um abraço caloroso vai significar muito"
      };
    }
    if (normalized.includes("serviço") || normalized.includes("servico")) {
      return {
        emoji: "🛠️",
        label: "Atos de Serviço",
        dica: "Ofereça ajuda com algo prático hoje"
      };
    }
    if (normalized.includes("presente")) {
      return {
        emoji: "🎁",
        label: "Presentes",
        dica: "Um presente surpresa, por menor que seja, vai alegrar"
      };
    }
    if (normalized.includes("tempo")) {
      return {
        emoji: "⏱️",
        label: "Tempo de Qualidade",
        dica: "Reserve um tempo só pra conversar com ele(a)"
      };
    }
    return {
      emoji: "❤️",
      label: linguagem || "Amor",
      dica: "Demonstre amor e carinho nessa data especial"
    };
  };

  const formatarDataLocal = (mesNiver: number, diaNiver: number) => {
    const meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    return `${diaNiver} de ${meses[mesNiver]}`;
  };

  const obterLinkWhatsapp = (numero: string) => {
    let limpo = (numero || "").replace(/\D/g, "");
    if (!limpo) return "";
    if (limpo.length <= 11) {
      limpo = "55" + limpo;
    }
    return `https://wa.me/${limpo}`;
  };

  const obterLinkTelefone = (numero: string) => {
    let limpo = (numero || "").replace(/\D/g, "");
    if (!limpo) return "";
    return `tel:${limpo}`;
  };

  const obterContatoPrincipal = (m: MembroAniversariante) => {
    return m.contato1 || m.contato2 || "";
  };

  // Filtragem por seções
  const hoje = new Date();
  const hojeMes = hoje.getMonth();

  const secHoje = membros.filter(m => m.diffDays === 0);
  const secEstaSemana = membros.filter(m => m.diffDays >= 1 && m.diffDays <= 7);
  const secEsteMes = membros.filter(m => m.diffDays >= 8 && m.proximoNiver.getMonth() === hojeMes);
  const secProximos = membros.filter(m => m.diffDays > 7 && m.proximoNiver.getMonth() !== hojeMes);

  const obterNomeMesAtual = () => {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${meses[hojeMes]} ${hoje.getFullYear()}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-zinc-950 min-h-screen text-slate-900 dark:text-zinc-100 font-sans pb-10">
      
      {/* HEADER */}
      <header className="sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-gray-150 dark:border-zinc-850 px-4 py-4 flex items-center gap-3 z-30 shadow-sm">
        <button 
          onClick={onVoltar}
          className="p-2 -ml-1 text-teal-700 dark:text-teal-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
          aria-label="Voltar para início"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-black uppercase tracking-wider">Aniversariantes</h1>
            <Cake className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-[10px] italic text-[#0f766e]">Firme na Palavra e no Amor</p>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-950/40 text-[#0f766e] dark:text-teal-300 px-3 py-1.5 rounded-xl border border-teal-200/40">
          {obterNomeMesAtual()}
        </span>
      </header>

      <div className="flex-1 p-4 space-y-6">

        {loading ? (
          /* SKELETON LOADERS */
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 p-4 rounded-2xl animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-zinc-805 rounded-full" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 dark:bg-zinc-805 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-zinc-805 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : membros.length === 0 ? (
          /* ESTADO VAZIO */
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <span className="text-6xl mb-4 select-none animate-bounce">🎂</span>
            <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">Nenhum aniversário próximo</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 max-w-xs leading-relaxed">
              Cadastre as datas de aniversário dos membros na ficha de cada um no menu Membros.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* SEÇÃO HOJE */}
            {secHoje.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                  <span>🎉</span> HOJE — Celebração Especial
                </h2>
                <div className="space-y-3">
                  {secHoje.map(m => {
                    const meta = obterLinguagemAmorMeta(m.linguagemAmor);
                    const fone = obterContatoPrincipal(m);
                    const linkWa = obterLinkWhatsapp(fone);
                    const linkTel = obterLinkTelefone(fone);
                    const isCel = celebrados[m.id];

                    return (
                      <div 
                        key={m.id}
                        className="relative overflow-hidden bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border-2 border-teal-200 dark:border-teal-900/60 p-5 rounded-2xl flex flex-col gap-4 text-left shadow-md transition-all hover:scale-[1.01]"
                      >
                        {/* Confetes em CSS absolute */}
                        <div className="absolute top-2 left-6 text-2xl opacity-15 select-none pointer-events-none">🎉</div>
                        <div className="absolute bottom-4 right-10 text-2xl opacity-15 select-none pointer-events-none">🎊</div>
                        <div className="absolute top-1/2 right-4 text-xl opacity-10 select-none pointer-events-none">✨</div>
                        
                        <div className="flex items-center gap-4 relative z-10">
                          {/* Avatar Iniciais Teal Grande */}
                          <div className="w-14 h-14 bg-teal-600 dark:bg-teal-500 rounded-full flex items-center justify-center text-white font-black text-lg tracking-tight shadow-md shrink-0 border border-teal-100">
                            {obterIniciais(m.nome)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white leading-tight truncate">
                              {m.nome}
                            </h3>
                            <p className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1 mt-0.5">
                              <span>🎂 Hoje é seu aniversário!</span>
                            </p>
                          </div>
                        </div>

                        {/* Linguagem do Amor */}
                        <div className="bg-white/80 dark:bg-zinc-900/80 p-3 rounded-xl border border-teal-100/50 dark:border-zinc-800 text-left relative z-10">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300">
                            <span>{meta.emoji}</span>
                            <span>{meta.label}</span>
                          </div>
                          <p className="text-[10.5px] text-gray-500 dark:text-zinc-400 font-medium mt-1">
                            {meta.dica}
                          </p>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex gap-2 relative z-10">
                          {linkWa && (
                            <a
                              href={linkWa}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 h-9 bg-[#25d366] hover:bg-[#20ba56] text-white font-bold text-[10.5px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                          {linkTel && (
                            <a
                              href={linkTel}
                              className="flex-1 h-9 bg-teal-700 hover:bg-teal-800 text-white font-bold text-[10.5px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                              <Phone className="w-4 h-4" />
                              <span>Ligar</span>
                            </a>
                          )}
                          <button
                            onClick={() => handleToggleCelebrado(m.id)}
                            className={`h-9 px-3 font-bold text-[10.5px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 select-none ${
                              isCel 
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                : "bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-850 hover:bg-teal-100"
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            <span>{isCel ? "Celebrado" : "Celebrar"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SEÇÃO ESTA SEMANA */}
            {secEstaSemana.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <span>📅</span> ESTA SEMANA — Próximos 7 dias
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-2.5">
                  {secEstaSemana.map(m => {
                    const isExpanded = expandedCardId === m.id;
                    const meta = obterLinguagemAmorMeta(m.linguagemAmor);
                    const fone = obterContatoPrincipal(m);
                    const linkWa = obterLinkWhatsapp(fone);
                    const linkTel = obterLinkTelefone(fone);

                    return (
                      <div 
                        key={m.id}
                        onClick={() => setExpandedCardId(isExpanded ? null : m.id)}
                        className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-400/40 rounded-2xl p-3 flex flex-col gap-3 text-left shadow-sm cursor-pointer transition-all duration-150 overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                              {obterIniciais(m.nome)}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[140px]">
                                {m.nome}
                              </h4>
                              <p className="text-[10px] text-gray-400 uppercase font-semibold font-sans mt-0.5">
                                {formatarDataLocal(m.mesNiver, m.diaNiver)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg">
                              Em {m.diffDays} {m.diffDays === 1 ? "dia" : "dias"}
                            </span>
                            {linkWa && (
                              <a
                                href={linkWa}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                target="_blank"
                                rel="noreferrer"
                                className="w-8 h-8 rounded-full bg-[#25d366]/10 text-[#25d366] flex items-center justify-center hover:bg-[#25d366]/20 transition shrink-0"
                                aria-label="Enviar mensagem no WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            <div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* EXPANSÃO INLINE */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-3 flex flex-col gap-2 bg-slate-50/50 dark:bg-zinc-950/20 px-3.5 py-2.5 rounded-xl animate-fadeIn text-left">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-400">
                              <span>{meta.emoji}</span>
                              <span>Dica: {meta.label}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-zinc-400 font-medium">
                              "{meta.dica}"
                            </p>
                            {linkTel && (
                              <a
                                href={linkTel}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 h-8 w-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-gray-100 font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5 text-teal-600" />
                                <span>Ligar para Líderado</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SEÇÃO ESTE MÊS */}
            {secEsteMes.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <span>📆</span> ESTE MÊS — Restante do mês
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-2.5">
                  {secEsteMes.map(m => {
                    const isExpanded = expandedCardId === m.id;
                    const meta = obterLinguagemAmorMeta(m.linguagemAmor);
                    const fone = obterContatoPrincipal(m);
                    const linkWa = obterLinkWhatsapp(fone);
                    const linkTel = obterLinkTelefone(fone);

                    return (
                      <div 
                        key={m.id}
                        onClick={() => setExpandedCardId(isExpanded ? null : m.id)}
                        className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-400/40 rounded-2xl p-3 flex flex-col gap-3 text-left shadow-sm cursor-pointer transition-all duration-150 overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                              {obterIniciais(m.nome)}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[140px]">
                                {m.nome}
                              </h4>
                              <p className="text-[10px] text-gray-400 uppercase font-semibold font-sans mt-0.5">
                                {formatarDataLocal(m.mesNiver, m.diaNiver)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-lg">
                              Em {m.diffDays} dias
                            </span>
                            {linkWa && (
                              <a
                                href={linkWa}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                target="_blank"
                                rel="noreferrer"
                                className="w-8 h-8 rounded-full bg-[#25d366]/10 text-[#25d366] flex items-center justify-center hover:bg-[#25d366]/20 transition shrink-0"
                                aria-label="Enviar mensagem no WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            <div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* EXPANSÃO INLINE */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-3 flex flex-col gap-2 bg-slate-50/50 dark:bg-zinc-950/20 px-3.5 py-2.5 rounded-xl animate-fadeIn text-left">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-blue-800 dark:text-blue-400">
                              <span>{meta.emoji}</span>
                              <span>Dica: {meta.label}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-zinc-400 font-medium">
                              "{meta.dica}"
                            </p>
                            {linkTel && (
                              <a
                                href={linkTel}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 h-8 w-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-gray-100 font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5 text-teal-600" />
                                <span>Ligar para Líderado</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SEÇÃO PRÓXIMOS */}
            {secProximos.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <span>🗓</span> PRÓXIMOS — Além do mês atual
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-2.5">
                  {secProximos.map(m => {
                    const isExpanded = expandedCardId === m.id;
                    const meta = obterLinguagemAmorMeta(m.linguagemAmor);
                    const fone = obterContatoPrincipal(m);
                    const linkWa = obterLinkWhatsapp(fone);
                    const linkTel = obterLinkTelefone(fone);

                    return (
                      <div 
                        key={m.id}
                        onClick={() => setExpandedCardId(isExpanded ? null : m.id)}
                        className="bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 hover:border-gray-400 dark:hover:border-zinc-700 rounded-2xl p-3 flex flex-col gap-3 text-left shadow-sm cursor-pointer transition-all duration-150 overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm text-center">
                              {obterIniciais(m.nome)}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[140px]">
                                {m.nome}
                              </h4>
                              <p className="text-[10px] text-gray-400 uppercase font-semibold font-sans mt-0.5">
                                {formatarDataLocal(m.mesNiver, m.diaNiver)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-gray-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-2.5 py-1 rounded-lg">
                              Em {m.diffDays} dias
                            </span>
                            {linkWa && (
                              <a
                                href={linkWa}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                target="_blank"
                                rel="noreferrer"
                                className="w-8 h-8 rounded-full bg-[#25d366]/10 text-[#25d366] flex items-center justify-center hover:bg-[#25d366]/20 transition shrink-0"
                                aria-label="Enviar mensagem no WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            <div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* EXPANSÃO INLINE */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-3 flex flex-col gap-2 bg-slate-50/50 dark:bg-zinc-950/20 px-3.5 py-2.5 rounded-xl animate-fadeIn text-left">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-600 dark:text-zinc-400">
                              <span>{meta.emoji}</span>
                              <span>Dica: {meta.label}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-zinc-400 font-medium">
                              "{meta.dica}"
                            </p>
                            {linkTel && (
                              <a
                                href={linkTel}
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 h-8 w-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-gray-100 font-bold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5 text-teal-600" />
                                <span>Ligar para Líderado</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
