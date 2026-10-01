import { useState } from "react";
import { EstadoDados } from "./pastorUtils";
import { BarrasVerticais, BarrasHorizontais, ColunasEmpilhadas, Proporcao, CardGrafico } from "./Graficos";
import { campoClasse, cardClasse } from "./PastorUi";

type Periodo = "30" | "90" | "180" | "365" | "tudo" | "personalizado";

const NOMES_MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const isoDeslocado = (dias: number) => new Date(Date.now() - dias * 86400000 - new Date().getTimezoneOffset() * 60000).toISOString().substring(0, 10);

const formatarCurta = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

// Painel de gráficos filtrado por período
export default function PastorGraficos({ estado }: { estado: EstadoDados }) {
  const { lideres, membros, reunioes, eventos } = estado.dados;

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
  const linhas = reunioesPeriodo.map((r) => {
    const total = totalMembrosLider(r.liderId);
    return { data: r.data, presentes: r.presentes, ausentes: Math.max(0, total - r.presentes) };
  });
  const presencas = linhas.reduce((a, l) => a + l.presentes, 0);
  const ausencias = linhas.reduce((a, l) => a + l.ausentes, 0);
  const taxa = presencas + ausencias > 0 ? Math.round((presencas / (presencas + ausencias)) * 100) : 0;

  const porData = new Map<string, { a: number; b: number }>();
  linhas.forEach((l) => {
    const atual = porData.get(l.data) || { a: 0, b: 0 };
    atual.a += l.presentes;
    atual.b += l.ausentes;
    porData.set(l.data, atual);
  });
  const colunas = Array.from(porData.entries())
    .sort((x, y) => x[0].localeCompare(y[0]))
    .slice(-16)
    .map(([data, v]) => ({ rotulo: formatarCurta(data), a: v.a, b: v.b }));

  // ---- Saídas / eventos do período
  const eventosPeriodo = eventos.filter((e) => noPeriodo(e.data));
  const eventosPorMes = new Map<string, number>();
  eventosPeriodo.forEach((e) => {
    const chave = e.data.substring(0, 7);
    eventosPorMes.set(chave, (eventosPorMes.get(chave) || 0) + 1);
  });
  const barrasEventos = Array.from(eventosPorMes.entries())
    .sort((x, y) => x[0].localeCompare(y[0]))
    .map(([chave, valor]) => ({ rotulo: `${NOMES_MESES[parseInt(chave.substring(5), 10) - 1]}/${chave.substring(2, 4)}`, valor, cor: "bg-amber-500" }));
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
    ...faixas.map((f) => ({ rotulo: f.rotulo, valor: idades.filter((i) => i !== null && i >= f.min && i <= f.max).length, cor: "bg-indigo-500" })),
    { rotulo: "Sem data", valor: idades.filter((i) => i === null).length, cor: "bg-gray-300" }
  ];

  // ---- Aniversariantes por mês
  const barrasNiver = NOMES_MESES.map((nome, i) => ({
    rotulo: nome,
    valor: membrosAteFim.filter((m) => parseInt((m.aniversario || "").split("-")[1], 10) === i + 1).length,
    cor: "bg-pink-500"
  }));

  const rotuloPeriodo =
    periodo === "tudo" ? "Todo o período" : periodo === "personalizado" ? `${de.split("-").reverse().join("/")} a ${ate.split("-").reverse().join("/")}` : `Últimos ${periodo} dias`;

  const resumo = (rotulo: string, valor: string | number, detalhe: string) => (
    <div className={`${cardClasse} p-3.5 space-y-1`}>
      <span className="text-[0.5625rem] font-black uppercase tracking-wider text-gray-400">{rotulo}</span>
      <span className="block text-2xl font-bold text-slate-950 dark:text-white leading-none">{valor}</span>
      <span className="block text-[0.5625rem] text-gray-500 dark:text-zinc-400">{detalhe}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* FILTRO DE PERÍODO */}
      <section className={`${cardClasse} p-3.5 flex flex-wrap items-end gap-3`}>
        <div className="space-y-1">
          <label htmlFor="filtro-periodo" className="block text-[0.5625rem] font-black text-gray-400 uppercase tracking-widest">Período</label>
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
              <label htmlFor="periodo-de" className="block text-[0.5625rem] font-black text-gray-400 uppercase tracking-widest">De</label>
              <input id="periodo-de" type="date" value={de} max={ate} onChange={(e) => setDe(e.target.value)} className={campoClasse} />
            </div>
            <div className="space-y-1">
              <label htmlFor="periodo-ate" className="block text-[0.5625rem] font-black text-gray-400 uppercase tracking-widest">Até</label>
              <input id="periodo-ate" type="date" value={ate} min={de} onChange={(e) => setAte(e.target.value)} className={campoClasse} />
            </div>
          </>
        )}
        <p className="text-[0.625rem] font-bold uppercase text-teal-700 dark:text-teal-400 pb-2.5">{rotuloPeriodo}</p>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {resumo("Presenças", presencas, `${reunioesPeriodo.length} ${reunioesPeriodo.length === 1 ? "reunião" : "reuniões"} no período`)}
        {resumo("Ausências", ausencias, "membros que não compareceram")}
        {resumo("Taxa de presença", `${taxa}%`, "presenças ÷ total esperado")}
        {resumo("Saídas e eventos", eventosPeriodo.length, `${lideres.length} ${lideres.length === 1 ? "líder" : "líderes"} no total`)}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <CardGrafico titulo="Presenças e ausências por reunião" nota="Soma de todos os líderes em cada data (até as 16 mais recentes do período).">
          {colunas.length === 0 ? <p className="text-xs text-gray-400 italic py-6">Nenhuma reunião no período.</p> : <ColunasEmpilhadas colunas={colunas} />}
          <div className="flex items-center gap-3 text-[0.5625rem] font-bold uppercase text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-600" /> Presentes</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-300" /> Ausentes</span>
          </div>
        </CardGrafico>

        <CardGrafico titulo="Proporção presença x ausência">
          <Proporcao a={presencas} b={ausencias} rotuloA="Presenças" rotuloB="Ausências" />
        </CardGrafico>

        <CardGrafico titulo="Saídas e eventos por mês">
          {barrasEventos.length === 0 ? <p className="text-xs text-gray-400 italic py-6">Nenhum evento no período.</p> : <BarrasVerticais itens={barrasEventos} />}
          <div className="grid grid-cols-2 gap-2 text-[0.6563rem] font-bold">
            <span className="text-emerald-700 dark:text-emerald-400">Aprovados: {contagemAprov.aprovado}</span>
            <span className="text-amber-700 dark:text-amber-400">Pendentes: {contagemAprov.pendente}</span>
            <span className="text-rose-600">Reprovados: {contagemAprov.reprovado}</span>
            <span className="text-gray-500">Sem aprovação: {contagemAprov.sem}</span>
          </div>
        </CardGrafico>

        <CardGrafico titulo="Membros por idade" nota={`${membrosAteFim.length} membros cadastrados até o fim do período.`}>
          <BarrasHorizontais itens={barrasIdade} />
        </CardGrafico>

        <div className="xl:col-span-2">
          <CardGrafico titulo="Aniversariantes por mês" nota="Considera os membros cadastrados até o fim do período.">
            <BarrasVerticais itens={barrasNiver} altura={110} />
          </CardGrafico>
        </div>
      </div>
    </div>
  );
}
