import { useState } from "react";
import { CalendarCheck, MapPin, Check, X, Users as UsersIcon, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useDadosPastor, nomeDoLider, formatarData, hojeISO, EventoP } from "./pastorUtils";
import { Cabecalho, EstadoCarga, campoClasse, cardClasse, abasContainer, abaAtiva, abaInativa } from "./PastorUi";

type Aba = "pendentes" | "proximos" | "todos";

export default function PastorEventos() {
  const { dados, loading, erro, recarregar } = useDadosPastor();
  const { lideres, eventos } = dados;
  const [aba, setAba] = useState<Aba>("pendentes");
  const [reprovando, setReprovando] = useState<EventoP | null>(null);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroAcao, setErroAcao] = useState("");

  const hoje = hojeISO();
  const pendentes = eventos.filter((e) => e.precisaAprovacao && e.aprovacaoStatus === "pendente");
  const proximos = eventos.filter((e) => e.data >= hoje);

  const lista =
    aba === "pendentes"
      ? pendentes.sort((a, b) => a.data.localeCompare(b.data))
      : aba === "proximos"
      ? [...proximos].sort((a, b) => a.data.localeCompare(b.data))
      : eventos;

  const decidir = async (evento: EventoP, decisao: "aprovado" | "reprovado" | "pendente", obs = "") => {
    setSalvando(true);
    setErroAcao("");
    const { error } = await api.pastor.decidirEvento(evento.id, decisao, obs);
    setSalvando(false);
    if (error) {
      setErroAcao(error.message);
      return false;
    }
    await recarregar();
    return true;
  };

  const confirmarReprovacao = async () => {
    if (!reprovando) return;
    if (!motivo.trim()) {
      setErroAcao("Informe o motivo da reprovação.");
      return;
    }
    if (await decidir(reprovando, "reprovado", motivo.trim())) {
      setReprovando(null);
      setMotivo("");
    }
  };

  const selo = (e: EventoP) => {
    if (!e.precisaAprovacao)
      return <span className="text-[0.5625rem] font-black uppercase px-2 py-0.5 rounded-lg border bg-gray-50 dark:bg-zinc-800 text-gray-500 border-gray-200 dark:border-zinc-700">Não requer aprovação</span>;
    if (e.aprovacaoStatus === "aprovado")
      return <span className="text-[0.5625rem] font-black uppercase px-2 py-0.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40">Aprovado</span>;
    if (e.aprovacaoStatus === "reprovado")
      return <span className="text-[0.5625rem] font-black uppercase px-2 py-0.5 rounded-lg border bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40">Reprovado</span>;
    return <span className="text-[0.5625rem] font-black uppercase px-2 py-0.5 rounded-lg border bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40">Aguardando aprovação</span>;
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
      <Cabecalho
        icone={<CalendarCheck className="w-5 h-5 text-teal-700 dark:text-teal-400" />}
        titulo="Eventos e Autorizações"
        subtitulo="Aprove ou reprove as atividades dos líderes"
      />

      <EstadoCarga loading={loading} erro={erro} onRecarregar={recarregar} />

      {!loading && !erro && (
        <>
          <div className={abasContainer}>
            {([
              ["pendentes", `Aguardando aprovação (${pendentes.length})`],
              ["proximos", `Próximos (${proximos.length})`],
              ["todos", `Todos (${eventos.length})`]
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setAba(id)}
                className={`px-3.5 py-1.5 rounded-lg text-[0.6563rem] font-extrabold uppercase tracking-wider transition cursor-pointer ${
                  aba === id ? abaAtiva : abaInativa
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {erroAcao && !reprovando && <p className="text-xs font-semibold text-rose-600">{erroAcao}</p>}

          {lista.length === 0 ? (
            <div className={`${cardClasse} py-12 text-center text-xs text-gray-400`}>
              {aba === "pendentes" ? "Nenhum evento aguardando aprovação." : "Nenhum evento encontrado."}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3 pb-6">
              {lista.map((e) => (
                <div key={e.id} className={`${cardClasse} border-l-4 p-4 space-y-3 ${!e.precisaAprovacao ? "border-l-slate-300" : e.aprovacaoStatus === "aprovado" ? "border-l-emerald-500" : e.aprovacaoStatus === "reprovado" ? "border-l-rose-500" : "border-l-amber-500"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{e.titulo}</h3>
                      <p className="text-[0.6875rem] text-teal-700 dark:text-teal-400 font-bold">{nomeDoLider(lideres, e.liderId)}</p>
                    </div>
                    {selo(e)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-gray-500 dark:text-zinc-400">
                    <span className="font-mono">{formatarData(e.data)}</span>
                    {e.local && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.local}</span>}
                    <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3" /> {e.participantes} participantes · {e.lideresConfirmados} líderes</span>
                  </div>

                  {e.descricao && <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300 whitespace-pre-line">{e.descricao}</p>}

                  {e.lideresNomes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {e.lideresNomes.map((n) => (
                        <span key={n} className="bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-400 border border-teal-200/50 dark:border-teal-900/40 text-[0.625rem] font-bold px-2 py-0.5 rounded-lg">{n}</span>
                      ))}
                    </div>
                  )}

                  {e.precisaAprovacao && e.aprovacaoStatus !== "pendente" && (
                    <div className="bg-slate-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-2.5 text-[0.6875rem] text-slate-600 dark:text-zinc-300">
                      <span className="font-bold">{e.aprovacaoStatus === "aprovado" ? "Aprovado" : "Reprovado"} em {formatarData(e.aprovacaoEm)}.</span>
                      {e.aprovacaoObs && <span className="italic"> “{e.aprovacaoObs}”</span>}
                    </div>
                  )}

                  {e.precisaAprovacao && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {e.aprovacaoStatus === "pendente" ? (
                        <>
                          <button
                            disabled={salvando}
                            onClick={() => decidir(e, "aprovado")}
                            className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[0.6563rem] uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1 disabled:opacity-60"
                          >
                            <Check className="w-4 h-4" /> Aprovar
                          </button>
                          <button
                            disabled={salvando}
                            onClick={() => { setReprovando(e); setMotivo(""); setErroAcao(""); }}
                            className="flex-1 h-9 bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-[0.6563rem] uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1 disabled:opacity-60"
                          >
                            <X className="w-4 h-4" /> Reprovar
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={salvando}
                          onClick={() => decidir(e, "pendente")}
                          className="text-[0.5625rem] font-bold uppercase text-gray-400 hover:text-teal-700 hover:underline cursor-pointer"
                        >
                          Desfazer decisão
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL DE REPROVAÇÃO */}
      {reprovando && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setReprovando(null)}>
          <div onClick={(ev) => ev.stopPropagation()} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-5 space-y-4 animate-slideUp">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-xs font-black uppercase text-rose-600">Reprovar “{reprovando.titulo}”</span>
              <button onClick={() => setReprovando(null)} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer" aria-label="Fechar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <label htmlFor="motivo-reprovacao" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">Motivo / orientação ao líder *</label>
              <textarea id="motivo-reprovacao" rows={4} value={motivo} onChange={(ev) => setMotivo(ev.target.value)} placeholder="Explique o motivo para o líder ajustar o evento." className={`${campoClasse} resize-none leading-relaxed`} />
            </div>
            {erroAcao && <p className="text-xs font-semibold text-rose-600">{erroAcao}</p>}
            <button
              onClick={confirmarReprovacao}
              disabled={salvando}
              className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1 disabled:opacity-60"
            >
              {salvando && <Loader2 className="w-4 h-4 animate-spin" />} Confirmar reprovação
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
