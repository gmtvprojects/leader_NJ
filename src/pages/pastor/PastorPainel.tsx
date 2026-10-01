import { Users, UserCog, CalendarDays, Sparkles, Cake, MapPin } from "lucide-react";
import { EstadoDados, nomeDoLider, formatarData, hojeISO, ehTransicao } from "./pastorUtils";
import { cardClasse } from "./PastorUi";

interface Props {
  estado: EstadoDados;
  onSelectTab: (tab: string, extra?: any) => void;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Visão geral: indicadores principais, aniversariantes (hoje e neste mês) e próximos eventos
export default function PastorPainel({ estado, onSelectTab }: Props) {
  const { lideres, membros, eventos } = estado.dados;

  const hoje = hojeISO();
  const mesAtual = new Date().getMonth() + 1;
  const diaHoje = new Date().getDate();

  const aprovacoesPendentes = eventos.filter((e) => e.precisaAprovacao && e.aprovacaoStatus === "pendente");
  const transicao = membros.filter(ehTransicao);

  // Aniversariantes do mês (dia/mês extraídos da data cadastrada)
  const doMes = membros
    .map((m) => {
      const [, mes, dia] = (m.aniversario || "").split("-").map((x) => parseInt(x, 10));
      return mes === mesAtual && dia ? { membro: m, dia } : null;
    })
    .filter((x): x is { membro: (typeof membros)[number]; dia: number } => !!x)
    .sort((a, b) => a.dia - b.dia);
  const aniversariosHoje = doMes.filter((x) => x.dia === diaHoje);
  const aniversariosMes = doMes.filter((x) => x.dia !== diaHoje);

  const proximosEventos = eventos.filter((e) => e.data >= hoje).sort((a, b) => a.data.localeCompare(b.data)).slice(0, 5);

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

  const linhaNiver = ({ membro, dia }: { membro: (typeof membros)[number]; dia: number }, passou: boolean) => (
    <div key={membro.id} className={`py-2 flex items-center gap-3 ${passou ? "opacity-55" : ""}`}>
      <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 flex flex-col items-center justify-center shrink-0 leading-none">
        <span className="text-sm font-black">{dia}</span>
        <span className="text-[0.5rem] font-black uppercase mt-0.5">{MESES[mesAtual - 1]}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{membro.nome}</p>
        <p className="text-[0.5625rem] text-gray-400 truncate">{nomeDoLider(lideres, membro.liderId)}</p>
      </div>
      <span className="text-[0.5625rem] font-black uppercase text-pink-600 dark:text-pink-400 shrink-0">
        {dia === diaHoje ? "Hoje" : passou ? "Já passou" : `Em ${dia - diaHoje} ${dia - diaHoje === 1 ? "dia" : "dias"}`}
      </span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* INDICADORES */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {kpi("Líderes", lideres.length, "cadastrados", UserCog, "text-teal-600", () => onSelectTab("lideres"))}
        {kpi("Membros", membros.length, "em todos os GAs", Users, "text-indigo-600", () => onSelectTab("membros"))}
        {kpi("Aprovações", aprovacoesPendentes.length, "eventos aguardando", CalendarDays, "text-amber-600", () => onSelectTab("eventos"))}
        {kpi("Transição J1", transicao.length, "membros em transição", Sparkles, "text-emerald-600", () => onSelectTab("transicao"))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        {/* ANIVERSARIANTES */}
        <section className={`${cardClasse} p-4 space-y-3`}>
          <h2 className="text-[0.6875rem] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
            <Cake className="w-3.5 h-3.5 text-pink-500" /> Aniversariantes
          </h2>

          <div className="max-h-96 overflow-y-auto pr-1 space-y-4">
            <div>
              <h3 className="text-[0.625rem] font-black uppercase tracking-wider text-pink-600 dark:text-pink-400 mb-1">Hoje</h3>
              {aniversariosHoje.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-1.5">Ninguém faz aniversário hoje.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">{aniversariosHoje.map((x) => linhaNiver(x, false))}</div>
              )}
            </div>

            <div>
              <h3 className="text-[0.625rem] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">Neste mês</h3>
              {aniversariosMes.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-1.5">Nenhum outro aniversariante neste mês.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">{aniversariosMes.map((x) => linhaNiver(x, x.dia < diaHoje))}</div>
              )}
            </div>
          </div>
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
    </div>
  );
}

