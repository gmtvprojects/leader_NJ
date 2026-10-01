import React from "react";
import { Loader2, RefreshCw } from "lucide-react";

export const cardClasse =
  "bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-md shadow-slate-200/70 dark:shadow-none";

export const campoClasse =
  "w-full text-xs px-3.5 py-2.5 bg-white dark:bg-zinc-950 border border-teal-100 dark:border-zinc-800 rounded-xl shadow-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/40 text-slate-900 dark:text-white";

// Fundo suave do perfil Pastor (usado pelo Shell)
export const fundoPastor = "bg-gradient-to-br from-teal-50 via-white to-indigo-50/50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950";

export const abaAtiva = "bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md";
export const abaInativa = "text-slate-600 dark:text-zinc-400 hover:bg-teal-50 dark:hover:bg-zinc-800";
export const abasContainer = "inline-flex self-start bg-white dark:bg-zinc-900 border border-teal-100 dark:border-zinc-800 rounded-xl p-1 gap-1 flex-wrap shadow-md shadow-slate-200/70 dark:shadow-none";

export function Cabecalho({ icone, titulo, subtitulo, acao }: { icone: React.ReactNode; titulo: string; subtitulo?: string; acao?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <div className="flex items-center gap-3">
        <span className="p-2.5 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/30 shadow-sm">{icone}</span>
        <div>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight leading-none font-sans">{titulo}</h1>
          {subtitulo && <p className="text-[0.625rem] uppercase font-black text-teal-700/70 dark:text-teal-400/70 mt-1 tracking-wider">{subtitulo}</p>}
        </div>
      </div>
      {acao}
    </div>
  );
}

export type CorKpi = "teal" | "indigo" | "amber" | "emerald" | "rose" | "pink" | "sky";

const GRADIENTE: Record<CorKpi, string> = {
  teal: "from-teal-600 to-emerald-500 shadow-teal-600/30",
  indigo: "from-indigo-600 to-violet-500 shadow-indigo-600/30",
  amber: "from-amber-500 to-orange-500 shadow-amber-500/30",
  emerald: "from-emerald-600 to-green-500 shadow-emerald-600/30",
  rose: "from-rose-500 to-pink-500 shadow-rose-500/30",
  pink: "from-pink-500 to-fuchsia-500 shadow-pink-500/30",
  sky: "from-sky-600 to-cyan-500 shadow-sky-600/30"
};

// Indicador colorido (sem legenda): rótulo, valor grande e ícone
export function KpiCard({ rotulo, valor, Icon, cor = "teal", aoClicar }: { rotulo: string; valor: string | number; Icon: React.ComponentType<{ className?: string }>; cor?: CorKpi; aoClicar?: () => void }) {
  return (
    <button
      onClick={aoClicar}
      disabled={!aoClicar}
      className={`bg-gradient-to-br ${GRADIENTE[cor]} text-white rounded-2xl p-4 text-left space-y-2 shadow-lg transition ${aoClicar ? "hover:scale-[1.02] hover:shadow-xl cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.625rem] font-black uppercase tracking-wider text-white/85">{rotulo}</span>
        <span className="p-1.5 rounded-lg bg-white/20">
          <Icon className="w-4 h-4 text-white" />
        </span>
      </div>
      <span className="block text-3xl font-bold leading-none">{valor}</span>
    </button>
  );
}

export function EstadoCarga({ loading, erro, onRecarregar }: { loading: boolean; erro: string; onRecarregar: () => void }) {
  if (erro) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3 shadow-sm">
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
