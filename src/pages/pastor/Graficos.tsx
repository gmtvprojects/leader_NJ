import React from "react";

export interface ItemBarra {
  rotulo: string;
  valor: number;
  cor?: string; // classe Tailwind de fundo
}

// Barras verticais simples (com valor acima de cada barra)
export function BarrasVerticais({ itens, altura = 140 }: { itens: ItemBarra[]; altura?: number }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2 min-w-fit" style={{ height: altura + 36 }}>
        {itens.map((i) => (
          <div key={i.rotulo} className="flex flex-col items-center justify-end gap-1 flex-1 min-w-[2rem]" style={{ height: "100%" }}>
            <span className="text-[0.625rem] font-black text-slate-700 dark:text-zinc-300">{i.valor}</span>
            <div className={`w-full max-w-[2.5rem] rounded-t-lg shadow-sm ${i.cor || "bg-gradient-to-t from-teal-600 to-emerald-400"}`} style={{ height: Math.max(3, (i.valor / max) * altura) }} />
            <span className="text-[0.5625rem] font-bold uppercase text-gray-500 whitespace-nowrap">{i.rotulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Barras horizontais com rótulo à esquerda (bom para listas de categorias)
export function BarrasHorizontais({ itens }: { itens: ItemBarra[] }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <div className="space-y-2.5">
      {itens.map((i) => (
        <div key={i.rotulo} className="space-y-1">
          <div className="flex justify-between text-[0.6563rem] font-bold text-slate-700 dark:text-zinc-300">
            <span className="truncate pr-2">{i.rotulo}</span>
            <span>{i.valor}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden shadow-inner">
            <div className={`h-full rounded-full ${i.cor || "bg-gradient-to-r from-teal-600 to-emerald-400"}`} style={{ width: `${(i.valor / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Proporção entre duas partes (ex.: presenças x ausências) em barra única com legenda
export function Proporcao({ a, b, rotuloA, rotuloB }: { a: number; b: number; rotuloA: string; rotuloB: string }) {
  const total = a + b;
  const pa = total ? Math.round((a / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex h-5 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 shadow-inner">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-400" style={{ width: `${total ? (a / total) * 100 : 0}%` }} />
        <div className="bg-gradient-to-r from-rose-400 to-pink-400" style={{ width: `${total ? (b / total) * 100 : 0}%` }} />
      </div>
      <div className="flex justify-between text-[0.6563rem] font-bold">
        <span className="text-teal-700 dark:text-teal-400">{rotuloA}: {a} ({pa}%)</span>
        <span className="text-rose-500">{rotuloB}: {b} ({total ? 100 - pa : 0}%)</span>
      </div>
    </div>
  );
}

type CorGrafico = "teal" | "indigo" | "amber" | "pink" | "rose" | "emerald";
const TOPO: Record<CorGrafico, string> = {
  teal: "border-t-teal-500 text-teal-800 dark:text-teal-300",
  indigo: "border-t-indigo-500 text-indigo-800 dark:text-indigo-300",
  amber: "border-t-amber-500 text-amber-800 dark:text-amber-300",
  pink: "border-t-pink-500 text-pink-800 dark:text-pink-300",
  rose: "border-t-rose-500 text-rose-800 dark:text-rose-300",
  emerald: "border-t-emerald-500 text-emerald-800 dark:text-emerald-300"
};

export function CardGrafico({ titulo, cor = "teal", children }: { titulo: string; cor?: CorGrafico; children: React.ReactNode }) {
  return (
    <section className={`bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 border-t-4 rounded-2xl p-4 space-y-3 shadow-md shadow-slate-200/70 dark:shadow-none ${TOPO[cor]}`}>
      <h2 className="text-[0.6875rem] font-black uppercase tracking-widest">{titulo}</h2>
      <div className="text-slate-700 dark:text-zinc-300">{children}</div>
    </section>
  );
}
