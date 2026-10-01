import { LayoutDashboard, Users, UserCog, AlertTriangle, ClipboardCheck, HeartHandshake, Cake, CalendarDays, MapPin } from "lucide-react";
import { useDadosPastor, nomeDoLider, formatarData, hojeISO, aniversariantesProximos } from "./pastorUtils";
import { Cabecalho, EstadoCarga, cardClasse } from "./PastorUi";

interface Props {
  onSelectTab: (tab: string, extra?: any) => void;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default function PastorPainel({ onSelectTab }: Props) {
  const { dados, loading, erro, recarregar } = useDadosPastor();
  const { lideres, membros, reunioes, eventos, pedidos } = dados;

  const hoje = hojeISO();
  const limite = new Date(Date.now() - 56 * 86400000).toISOString().substring(0, 10); // últimas 8 semanas

  const membrosPorLider = (id: string) => membros.filter((m) => m.liderId === id);
  const reunioesRecentes = reunioes.filter((r) => r.data >= limite);

  // Percentual de presença de cada reunião (presentes / membros do líder)
  const percentual = (r: { liderId: string; presentes: number }) => {
    const total = membrosPorLider(r.liderId).length;
    return total > 0 ? Math.min(100, Math.round((r.presentes / total) * 100)) : 0;
  };
  const presencaMedia = reunioesRecentes.length
    ? Math.round(reunioesRecentes.reduce((acc, r) => acc + percentual(r), 0) / reunioesRecentes.length)
    : 0;

  const ausentesCriticos = membros.filter((m) => m.status === "Ausente" || m.faltas >= 2);
  const aprovacoesPendentes = eventos.filter((e) => e.precisaAprovacao && e.aprovacaoStatus === "pendente");
  const pedidosAbertos = pedidos.filter((p) => p.status === "pendente");

  // Presença por semana (agrupa as reuniões pela data)
  const semanas = (Array.from(new Set(reunioes.map((r) => r.data))) as string[])
    .sort()
    .slice(-8)
    .map((data) => {
      const doDia = reunioes.filter((r) => r.data === data);
      const presentes = doDia.reduce((a, r) => a + r.presentes, 0);
      const total = doDia.reduce((a, r) => a + membrosPorLider(r.liderId).length, 0);
      return { data, presentes, ausentes: Math.max(0, total - presentes), total, reunioes: doDia.length };
    });
  const maxSemana = Math.max(1, ...semanas.map((s) => s.total));

  const porLider = lideres.map((l) => {
    const ms = membrosPorLider(l.id);
    const rs = reunioesRecentes.filter((r) => r.liderId === l.id);
    const media = rs.length ? Math.round(rs.reduce((a, r) => a + percentual(r), 0) / rs.length) : null;
    return {
      lider: l,
      membros: ms.length,
      reunioes: rs.length,
      media,
      ausentes: ms.filter((m) => m.status === "Ausente" || m.faltas >= 2).length,
      transicao: ms.filter((m) => m.origemTransicao || m.status === "Transição" || m.faixa === "J1").length
    };
  });

  const niver = aniversariantesProximos(membros, 30).slice(0, 8);
  const proximosEventos = eventos.filter((e) => e.data >= hoje).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 5);
  const ultimasReunioes = reunioes.slice(0, 8);

  const kpi = (rotulo: string, valor: string | number, detalhe: string, Icon: any, cor: string, aoClicar?: () => void) => (
    <button
      onClick={aoClicar}
      disabled={!aoClicar}
      className={`${cardClasse} p-3.5 text-left space-y-1 ${aoClicar ? "hover:border-teal-500 cursor-pointer" : "cursor-default"} transition`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[0.5625rem] font-black uppercase tracking-wider text-gray-400">{rotulo}</span>
        <Icon className={`w-4 h-4 ${cor}`} />
      </div>
      <span className="block text-2xl font-bold text-slate-950 dark:text-white font-sans leading-none">{valor}</span>
      <span className="block text-[0.5625rem] text-gray-500 dark:text-zinc-400">{detalhe}</span>
    </button>
  );

  return (
    <div className="flex-1 flex flex-col space-y-5 px-4 py-4 animate-fadeIn text-left font-sans">
      <Cabecalho
        icone={<LayoutDashboard className="w-5 h-5 text-teal-700 dark:text-teal-400" />}
        titulo="Visão Geral"
        subtitulo="Líderes, presença, ausências e eventos"
      />

      <EstadoCarga loading={loading} erro={erro} onRecarregar={recarregar} />

      {!loading && !erro && (
        <>
          {/* INDICADORES */}
          <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
            {kpi("Líderes", lideres.length, "cadastrados", UserCog, "text-teal-600", () => onSelectTab("lideres"))}
            {kpi("Membros", membros.length, "em todos os GAs", Users, "text-indigo-600", () => onSelectTab("membros"))}
            {kpi("Presença", `${presencaMedia}%`, `média das últimas 8 semanas`, ClipboardCheck, "text-emerald-600")}
            {kpi("Ausentes", ausentesCriticos.length, "com 2+ faltas", AlertTriangle, "text-rose-600", () => onSelectTab("membros", { filtro: "ausentes" }))}
            {kpi("Aprovações", aprovacoesPendentes.length, "eventos aguardando", CalendarDays, "text-amber-600", () => onSelectTab("eventos"))}
            {kpi("Orações", pedidosAbertos.length, "pedidos em aberto", HeartHandshake, "text-rose-500", () => onSelectTab("pedidos"))}
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* PRESENÇA POR SEMANA */}
            <section className={`${cardClasse} p-4 space-y-3`}>
              <h2 className="text-[0.6875rem] font-black uppercase tracking-widest text-gray-400">Presença e ausência por semana</h2>
              {semanas.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-4">Nenhuma reunião registrada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {semanas.map((s) => (
                    <div key={s.data} className="space-y-1">
                      <div className="flex justify-between text-[0.625rem] font-bold text-slate-700 dark:text-zinc-300">
                        <span className="font-mono">{formatarData(s.data)}</span>
                        <span>
                          {s.presentes} presentes · {s.ausentes} ausentes · {s.reunioes} {s.reunioes === 1 ? "reunião" : "reuniões"}
                        </span>
                      </div>
                      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800" style={{ width: `${Math.max(8, (s.total / maxSemana) * 100)}%` }}>
                        <div className="bg-teal-600" style={{ width: `${s.total ? (s.presentes / s.total) * 100 : 0}%` }} />
                        <div className="bg-rose-300 dark:bg-rose-500/60" style={{ width: `${s.total ? (s.ausentes / s.total) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pt-1 text-[0.5625rem] font-bold uppercase text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-600" /> Presentes</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-300" /> Ausentes</span>
                  </div>
                </div>
              )}
            </section>

            {/* MEMBROS NAS ÚLTIMAS REUNIÕES */}
            <section className={`${cardClasse} p-4 space-y-3`}>
              <h2 className="text-[0.6875rem] font-black uppercase tracking-widest text-gray-400">Membros nas últimas reuniões</h2>
              {ultimasReunioes.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-4">Nenhuma reunião registrada ainda.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {ultimasReunioes.map((r) => (
                    <div key={r.id} className="py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{nomeDoLider(lideres, r.liderId)}</p>
                        <p className="text-[0.5625rem] text-gray-400 font-mono">{formatarData(r.data)}{r.tema ? ` · ${r.tema}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-xs font-black text-teal-700 dark:text-teal-400">
                          {r.presentes}/{membrosPorLider(r.liderId).length}
                        </span>
                        <span className="block text-[0.5rem] uppercase text-gray-400">presentes</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* POR LÍDER */}
          <section className={`${cardClasse} p-4 space-y-3`}>
            <h2 className="text-[0.6875rem] font-black uppercase tracking-widest text-gray-400">Resumo por líder</h2>
            {porLider.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4">Nenhum líder cadastrado. Use a aba Líderes para cadastrar o primeiro.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[34rem]">
                  <thead>
                    <tr className="text-left text-[0.5625rem] uppercase tracking-wider text-gray-400">
                      <th className="py-1.5 pr-3 font-black">Líder</th>
                      <th className="py-1.5 px-2 font-black text-center">Membros</th>
                      <th className="py-1.5 px-2 font-black text-center">Reuniões (8 sem.)</th>
                      <th className="py-1.5 px-2 font-black text-center">Presença</th>
                      <th className="py-1.5 px-2 font-black text-center">Ausentes</th>
                      <th className="py-1.5 pl-2 font-black text-center">Transição J1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {porLider.map(({ lider, membros: n, reunioes: rs, media, ausentes, transicao }) => (
                      <tr key={lider.id}>
                        <td className="py-2 pr-3">
                          <span className="block font-bold text-slate-900 dark:text-white">{lider.nome}</span>
                          {lider.nomeGrupo && <span className="block text-[0.5625rem] text-gray-400">{lider.nomeGrupo}</span>}
                        </td>
                        <td className="py-2 px-2 text-center font-bold">{n}</td>
                        <td className="py-2 px-2 text-center">{rs}</td>
                        <td className="py-2 px-2 text-center font-bold text-teal-700 dark:text-teal-400">{media === null ? "—" : `${media}%`}</td>
                        <td className={`py-2 px-2 text-center font-bold ${ausentes > 0 ? "text-rose-600" : ""}`}>{ausentes}</td>
                        <td className="py-2 pl-2 text-center">{transicao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* ANIVERSARIANTES */}
            <section className={`${cardClasse} p-4 space-y-3`}>
              <h2 className="text-[0.6875rem] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Cake className="w-3.5 h-3.5 text-pink-500" /> Aniversariantes (próximos 30 dias)
              </h2>
              {niver.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-3">Nenhum aniversário nos próximos 30 dias.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {niver.map(({ membro, faltam, dia, mes }) => (
                    <div key={membro.id} className="py-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 flex flex-col items-center justify-center shrink-0 leading-none">
                        <span className="text-sm font-black">{dia}</span>
                        <span className="text-[0.5rem] font-black uppercase mt-0.5">{MESES[mes - 1]}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{membro.nome}</p>
                        <p className="text-[0.5625rem] text-gray-400 truncate">{nomeDoLider(lideres, membro.liderId)}</p>
                      </div>
                      <span className="text-[0.5625rem] font-black uppercase text-pink-600 dark:text-pink-400 shrink-0">
                        {faltam === 0 ? "Hoje" : faltam === 1 ? "Amanhã" : `Em ${faltam} dias`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* PRÓXIMOS EVENTOS */}
            <section className={`${cardClasse} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[0.6875rem] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" /> Próximos eventos
                </h2>
                <button onClick={() => onSelectTab("eventos")} className="text-[0.5625rem] font-extrabold uppercase text-teal-700 dark:text-teal-400 hover:underline cursor-pointer">
                  Ver todos
                </button>
              </div>
              {proximosEventos.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-3">Nenhum evento agendado.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {proximosEventos.map((e) => (
                    <div key={e.id} className="py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{e.titulo}</p>
                        <p className="text-[0.5625rem] text-gray-400 truncate">
                          {formatarData(e.data)} · {nomeDoLider(lideres, e.liderId)}
                        </p>
                      </div>
                      <span
                        className={`text-[0.5rem] font-black uppercase px-2 py-0.5 rounded-lg border shrink-0 ${
                          !e.precisaAprovacao
                            ? "bg-gray-50 dark:bg-zinc-800 text-gray-500 border-gray-200 dark:border-zinc-700"
                            : e.aprovacaoStatus === "aprovado"
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40"
                            : e.aprovacaoStatus === "reprovado"
                            ? "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40"
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40"
                        }`}
                      >
                        {!e.precisaAprovacao ? "Sem aprovação" : e.aprovacaoStatus === "pendente" ? "Pendente" : e.aprovacaoStatus === "aprovado" ? "Aprovado" : "Reprovado"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
