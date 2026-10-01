import React from "react";
import { Loader2, RefreshCw } from "lucide-react";

export function Cabecalho({ icone, titulo, subtitulo, acao }: { icone: React.ReactNode; titulo: string; subtitulo?: string; acao?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight leading-none flex items-center gap-1.5 font-sans">
          {icone} {titulo}
        </h1>
        {subtitulo && <p className="text-[0.625rem] uppercase font-black text-gray-400 mt-1 tracking-wider">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  );
}

export function EstadoCarga({ loading, erro, onRecarregar }: { loading: boolean; erro: string; onRecarregar: () => void }) {
  if (erro) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3">
        <span>{erro}</span>
        <button onClick={onRecarregar} className="flex items-center gap-1 font-bold uppercase text-[0.625rem] cursor-pointer hover:underline">
          <RefreshCw className="w-3.5 h-3.5" /> Tentar de novo
        </button>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-[0.625rem] uppercase font-black tracking-wider text-[#0f766e]">
        <Loader2 className="w-5 h-5 animate-spin" /> Carregando...
      </div>
    );
  }
  return null;
}

export const campoClasse =
  "w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white";

export const cardClasse = "bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl";

export function BotaoFlutuante({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 md:bottom-8 right-6 md:right-8 z-30 p-4 bg-teal-700 hover:bg-teal-600 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 cursor-pointer transition-transform flex items-center justify-center"
      aria-label={label}
    >
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}
