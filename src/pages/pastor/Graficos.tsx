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
            <div className={`w-full max-w-[2.5rem] rounded-t-md ${i.cor || "bg-teal-600"}`} style={{ height: Math.max(2, (i.valor / max) * altura) }} />
            <span className="text-[0.5625rem] font-bold uppercase text-gray-400 whitespace-nowrap">{i.rotulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface ColunaEmpilhada {
  rotulo: string;
  a: number; // presentes
  b: number; // ausentes
}

// Colunas empilhadas: presentes (verde) + ausentes (rosa)
export function ColunasEmpilhadas({ colunas, altura = 150 }: { colunas: ColunaEmpilhada[]; altura?: number }) {
  const max = Math.max(1, ...colunas.map((c) => c.a + c.b));
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2 min-w-fit" style={{ height: altura + 34 }}>
        {colunas.map((c) => (
          <div key={c.rotulo} className="flex flex-col items-center justify-end gap-1 flex-1 min-w-[2.5rem]" style={{ height: "100%" }}>
            <span className="text-[0.5625rem] font-black text-slate-600 dark:text-zinc-300">{c.a}/{c.a + c.b}</span>
            <div className="w-full max-w-[2.5rem] flex flex-col-reverse rounded-t-md overflow-hidden" style={{ height: Math.max(2, ((c.a + c.b) / max) * altura) }}>
              <div className="bg-teal-600" style={{ height: `${(c.a + c.b) > 0 ? (c.a / (c.a + c.b)) * 100 : 0}%` }} />
              <div className="bg-rose-300 dark:bg-rose-500/60" style={{ height: `${(c.a + c.b) > 0 ? (c.b / (c.a + c.b)) * 100 : 0}%` }} />
            </div>
            <span className="text-[0.5rem] font-bold text-gray-400 whitespace-nowrap font-mono">{c.rotulo}</span>
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
    <div className="space-y-2">
      {itens.map((i) => (
        <div key={i.rotulo} className="space-y-1">
          <div className="flex justify-between text-[0.6563rem] font-bold text-slate-700 dark:text-zinc-300">
            <span className="truncate pr-2">{i.rotulo}</span>
            <span>{i.valor}</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
            <div className={`h-full rounded-full ${i.cor || "bg-teal-600"}`} style={{ width: `${(i.valor / max) * 100}%` }} />
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
      <div className="flex h-4 rounded-full overflow-hidden bg-gray-100 dark:bg-zinc-800">
        <div className="bg-teal-600" style={{ width: `${total ? (a / total) * 100 : 0}%` }} />
        <div className="bg-rose-300 dark:bg-rose-500/60" style={{ width: `${total ? (b / total) * 100 : 0}%` }} />
      </div>
      <div className="flex justify-between text-[0.6563rem] font-bold">
        <span className="text-teal-700 dark:text-teal-400">{rotuloA}: {a} ({pa}%)</span>
        <span className="text-rose-500">{rotuloB}: {b} ({total ? 100 - pa : 0}%)</span>
      </div>
    </div>
  );
}

export function CardGrafico({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
      <div>
        <h2 className="text-[0.6875rem] font-black uppercase tracking-widest text-gray-400">{titulo}</h2>
        {nota && <p className="text-[0.5938rem] text-gray-400 mt-0.5">{nota}</p>}
      </div>
      {children}
    </section>
  );
}
