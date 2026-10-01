import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ItemNav {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface ShellProps {
  nav: ItemNav[];
  activeTab: string;
  onSelect: (id: string) => void;
  titulo: string;
  larguraMax?: string; // classe Tailwind de largura máxima do conteúdo
  fundo?: string; // classes de fundo da página
  children: React.ReactNode;
}

// Menu inferior (mobile): carrossel com todas as opções e setas quando há mais itens
function MenuInferiorMobile({ nav, activeTab, onSelect }: Pick<ShellProps, "nav" | "activeTab" | "onSelect">) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [podeEsquerda, setPodeEsquerda] = useState(false);
  const [podeDireita, setPodeDireita] = useState(false);

  const atualizarSetas = () => {
    const el = scrollRef.current;
    if (!el) return;
    setPodeEsquerda(el.scrollLeft > 4);
    setPodeDireita(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    atualizarSetas();
    window.addEventListener("resize", atualizarSetas);
    return () => window.removeEventListener("resize", atualizarSetas);
  }, []);

  // Mantém a aba ativa visível no carrossel
  useEffect(() => {
    const ativo = scrollRef.current?.querySelector<HTMLElement>('[data-ativo="true"]');
    ativo?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeTab]);

  const rolar = (direcao: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direcao * el.clientWidth * 0.6, behavior: "smooth" });
  };

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800/80 h-16 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
      <div
        ref={scrollRef}
        onScroll={atualizarSetas}
        className="no-scrollbar h-full flex items-center overflow-x-auto snap-x snap-proximity scroll-smooth px-6"
      >
        {nav.map(({ id, label, Icon }) => (
          <button
            key={id}
            data-ativo={activeTab === id}
            onClick={() => onSelect(id)}
            className={`snap-center shrink-0 min-w-16 px-3 flex flex-col items-center justify-center h-full py-1 text-center cursor-pointer transition-all ${
              activeTab === id
                ? "text-teal-700 dark:text-teal-400 scale-[1.05]"
                : "text-gray-400 hover:text-gray-600 dark:text-zinc-500"
            }`}
            aria-label={`Aba ${label}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[0.625rem] font-sans font-bold mt-1.5 uppercase tracking-wide whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>

      {podeEsquerda && (
        <button
          type="button"
          onClick={() => rolar(-1)}
          className="absolute left-0 top-0 h-full w-6 flex items-center justify-center bg-gradient-to-r from-white dark:from-zinc-900 to-transparent text-teal-700 dark:text-teal-400 cursor-pointer"
          aria-label="Ver opções anteriores"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {podeDireita && (
        <button
          type="button"
          onClick={() => rolar(1)}
          className="absolute right-0 top-0 h-full w-6 flex items-center justify-center bg-gradient-to-l from-white dark:from-zinc-900 to-transparent text-teal-700 dark:text-teal-400 cursor-pointer"
          aria-label="Ver mais opções"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </footer>
  );
}

// Estrutura comum aos perfis: menu lateral (tablet/desktop), conteúdo e menu inferior (mobile)
export default function Shell({ nav, activeTab, onSelect, titulo, larguraMax = "max-w-5xl", fundo = "bg-neutral-50 dark:bg-zinc-950", children }: ShellProps) {
  return (
    <div className={`min-h-screen ${fundo} flex transition-colors duration-200`}>

      {/* MENU LATERAL (TABLET / DESKTOP) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-20 lg:w-60 flex-col bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800/80 z-40 py-5 px-3">
        <div className="px-2 pb-5 hidden lg:block">
          <p className="text-sm font-sans font-bold text-slate-900 dark:text-white mt-0.5">{titulo}</p>
        </div>

        <nav className="flex flex-col gap-1">
          {nav.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              title={label}
              className={`flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                activeTab === id
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
              }`}
              aria-label={`Aba ${label}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline text-xs font-sans font-bold uppercase tracking-wide">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ÁREA DE CONTEÚDO: LARGURA TOTAL NO MOBILE, AO LADO DO MENU NO DESKTOP */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen relative pb-[72px] md:pb-0 md:pl-20 lg:pl-60">
        <main className={`flex-1 flex flex-col w-full ${larguraMax} mx-auto md:px-4 lg:px-8 md:py-4`}>
          {children}
        </main>

        <MenuInferiorMobile nav={nav} activeTab={activeTab} onSelect={onSelect} />
      </div>
    </div>
  );
}
