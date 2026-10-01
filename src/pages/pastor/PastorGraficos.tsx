import { useState } from "react";
import { ClipboardCheck, UserX, Percent, MapPin } from "lucide-react";
import { EstadoDados } from "./pastorUtils";
import { BarrasVerticais, BarrasHorizontais, Proporcao, CardGrafico } from "./Graficos";
import { campoClasse, cardClasse, KpiCard } from "./PastorUi";

type Periodo = "30" | "90" | "180" | "365" | "tudo" | "personalizado";

const NOMES_MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const isoDeslocado = (dias: number) => new Date(Date.now() - dias * 86400000 - new Date().getTimezoneOffset() * 60000).toISOString().substring(0, 10);

// Painel de gráficos filtrado por período
export default function PastorGraficos({ estado }: { estado: EstadoDados }) {
  const { membros, reunioes, eventos } = estado.dados;

  const [periodo, setPeriodo] = useState<Periodo>("90");
  const [de, setDe] = useState(isoDeslocado(90));
  const [ate, setAte] = useState(isoDeslocado(0));

  const hoje = isoDeslocado(0);
  const inicio = periodo === "tudo" ? "0000-00-00" : periodo === "personalizado" ? de : isoDeslocado(parseInt(periodo, 10));
  const fim = periodo === "personalizado" ? ate : hoje;
  const noPeriodo = (data: string) => !!data && data >= inicio && data <= fim;

  // ---- Presenças e ausências nas reuniões do período
  const reunioesPeriodo = reunioes.filter((r) => noPeriodo(r.data));
  const totalMembrosLider = (id: string) => membros.filter((m) => m.liderId === id).length;
  const presencas = reunioesPeriodo.reduce((a, r) => a + r.presentes, 0);
  const ausencias = reunioesPeriodo.reduce((a, r) => a + Math.max(0, totalMembrosLider(r.liderId) - r.presentes), 0);
  const taxa = presencas + ausencias > 0 ? Math.round((presencas / (presencas + ausencias)) * 100) : 0;

  // ---- Saídas / eventos do período
  const eventosPeriodo = eventos.filter((e) => noPeriodo(e.data));
  const eventosPorMes = new Map<string, number>();
  eventosPeriodo.forEach((e) => {
    const chave = e.data.substring(0, 7);
    eventosPorMes.set(chave, (eventosPorMes.get(chave) || 0) + 1);
  });
  const barrasEventos = Array.from(eventosPorMes.entries())
    .sort((x, y) => x[0].localeCompare(y[0]))
    .map(([chave, valor]) => ({
      rotulo: `${NOMES_MESES[parseInt(chave.substring(5), 10) - 1]}/${chave.substring(2, 4)}`,
      valor,
      cor: "bg-amber-300"
    }));
  const contagemAprov = {
    aprovado: eventosPeriodo.filter((e) => e.precisaAprovacao && e.aprovacaoStatus === "aprovado").length,
    reprovado: eventosPeriodo.filter((e) => e.precisaAprovacao && e.aprovacaoStatus === "reprovado").length,
    pendente: eventosPeriodo.filter((e) => e.precisaAprovacao && e.aprovacaoStatus === "pendente").length,
    sem: eventosPeriodo.filter((e) => !e.precisaAprovacao).length
  };

  // ---- Membros (cadastrados até o fim do período)
  const membrosAteFim = membros.filter((m) => !m.dataEntrada || m.dataEntrada <= fim);
  const faixas = [
    { rotulo: "Até 17", min: 0, max: 17 },
    { rotulo: "18–20", min: 18, max: 20 },
    { rotulo: "21–24", min: 21, max: 24 },
    { rotulo: "25–30", min: 25, max: 30 },
    { rotulo: "31+", min: 31, max: 200 }
  ];
  const idadeEm = (aniv: string) => {
    if (!aniv) return null;
    const [a, m, d] = aniv.split("-").map((x) => parseInt(x, 10));
    const ref = new Date(fim === "0000-00-00" ? hoje : fim);
    let idade = ref.getFullYear() - a;
    if (ref.getMonth() + 1 < m || (ref.getMonth() + 1 === m && ref.getDate() < d)) idade--;
    return idade;
  };
  const idades = membrosAteFim.map((m) => idadeEm(m.aniversario));
  const barrasIdade = [
    ...faixas.map((f) => ({
      rotulo: f.rotulo,
      valor: idades.filter((i) => i !== null && i >= f.min && i <= f.max).length,
      cor: "bg-indigo-300"
    })),
    { rotulo: "Sem data", valor: idades.filter((i) => i === null).length, cor: "bg-slate-300" }
  ];

  // ---- Aniversariantes por mês
  const barrasNiver = NOMES_MESES.map((nome, i) => ({
    rotulo: nome,
    valor: membrosAteFim.filter((m) => parseInt((m.aniversario || "").split("-")[1], 10) === i + 1).length,
    cor: "bg-pink-300"
  }));

  const rotuloPeriodo =
    periodo === "tudo" ? "Todo o período" : periodo === "personalizado" ? `${de.split("-").reverse().join("/")} a ${ate.split("-").reverse().join("/")}` : `Últimos ${periodo} dias`;

  return (
    <div className="space-y-5">
      {/* FILTRO DE PERÍODO */}
      <section className={`${cardClasse} border-l-4 border-l-teal-300 p-3.5 flex flex-wrap items-end gap-3`}>
        <div className="space-y-1">
          <label htmlFor="filtro-periodo" className="block text-[0.5625rem] font-black text-teal-800 dark:text-teal-300 uppercase tracking-widest">Período</label>
          <select id="filtro-periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} className={`${campoClasse} w-52 cursor-pointer`}>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 3 meses</option>
            <option value="180">Últimos 6 meses</option>
            <option value="365">Últimos 12 meses</option>
            <option value="tudo">Todo o período</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        {periodo === "personalizado" && (
          <>
            <div className="space-y-1">
              <label htmlFor="periodo-de" className="block text-[0.5625rem] font-black text-teal-800 dark:text-teal-300 uppercase tracking-widest">De</label>
              <input id="periodo-de" type="date" value={de} max={ate} onChange={(e) => setDe(e.target.value)} className={campoClasse} />
            </div>
            <div className="space-y-1">
              <label htmlFor="periodo-ate" className="block text-[0.5625rem] font-black text-teal-800 dark:text-teal-300 uppercase tracking-widest">Até</label>
              <input id="periodo-ate" type="date" value={ate} min={de} onChange={(e) => setAte(e.target.value)} className={campoClasse} />
            </div>
          </>
        )}
        <p className="text-[0.625rem] font-black uppercase text-emerald-600 dark:text-emerald-400 pb-2.5">{rotuloPeriodo}</p>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard rotulo="Presenças" valor={presencas} Icon={ClipboardCheck} cor="teal" />
        <KpiCard rotulo="Ausências" valor={ausencias} Icon={UserX} cor="rose" />
        <KpiCard rotulo="Taxa de presença" valor={`${taxa}%`} Icon={Percent} cor="emerald" />
        <KpiCard rotulo="Saídas e eventos" valor={eventosPeriodo.length} Icon={MapPin} cor="amber" />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <CardGrafico titulo="Proporção presença x ausência" cor="teal">
          <Proporcao a={presencas} b={ausencias} rotuloA="Presenças" rotuloB="Ausências" />
        </CardGrafico>

        <CardGrafico titulo="Saídas e eventos por mês" cor="amber">
          {barrasEventos.length === 0 ? <p className="text-xs text-gray-400 italic py-6">Nenhum evento no período.</p> : <BarrasVerticais itens={barrasEventos} />}
          <div className="grid grid-cols-2 gap-2 text-[0.6563rem] font-bold">
            <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">Aprovados: {contagemAprov.aprovado}</span>
            <span className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400">Pendentes: {contagemAprov.pendente}</span>
            <span className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600">Reprovados: {contagemAprov.reprovado}</span>
            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">Sem aprovação: {contagemAprov.sem}</span>
          </div>
        </CardGrafico>

        <CardGrafico titulo="Membros por idade" cor="indigo">
          <BarrasHorizontais itens={barrasIdade} />
        </CardGrafico>

        <CardGrafico titulo="Aniversariantes por mês" cor="pink">
          <BarrasVerticais itens={barrasNiver} altura={110} />
        </CardGrafico>
      </div>
    </div>
  );
}
