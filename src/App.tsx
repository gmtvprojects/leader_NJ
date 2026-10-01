import { useState, useEffect, useRef } from "react";
import { 
  House, 
  Users, 
  BookOpen, 
  MapPin, 
  Settings,
  HeartHandshake,
  Library,
  Cake,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { api } from "./lib/api";
import Login from "./pages/Login";

import Inicio from "./pages/Inicio";
import Membros from "./pages/Membros";
import Reunioes from "./pages/Reunioes";
import Eventos from "./pages/Eventos";
import Mais from "./pages/Mais";
import Oracao from "./pages/Oracao";
import BancoDoLider from "./pages/BancoDoLider";
import Aniversariantes from "./pages/Aniversariantes";

const NAV_PRINCIPAL = [
  { id: "inicio", label: "Início", Icon: House },
  { id: "membros", label: "Membros", Icon: Users },
  { id: "reunioes", label: "Reuniões", Icon: BookOpen },
  { id: "eventos", label: "Eventos", Icon: MapPin },
  { id: "mais", label: "Configurações", Icon: Settings },
];

// Atalhos extras exibidos apenas no menu lateral (tablet / desktop)
const NAV_SECUNDARIA = [
  { id: "oracao", label: "Oração", Icon: HeartHandshake },
  { id: "bancodolider", label: "Banco do Líder", Icon: Library },
  { id: "aniversariantes", label: "Aniversariantes", Icon: Cake },
];

// Menu inferior (mobile): carrossel com todas as opções; "Mais" fica por último
const NAV_MOBILE = [
  ...NAV_PRINCIPAL.filter((n) => n.id !== "mais"),
  ...NAV_SECUNDARIA,
  NAV_PRINCIPAL.find((n) => n.id === "mais")!,
];

const ABAS_VALIDAS = [...NAV_PRINCIPAL, ...NAV_SECUNDARIA].map((n) => n.id);

// Lê a aba ativa a partir do hash da URL (ex.: #/membros)
function abaDoHash(): string {
  const id = window.location.hash.replace(/^#\/?/, "");
  return ABAS_VALIDAS.includes(id) ? id : "inicio";
}

function MenuInferiorMobile({ activeTab, onSelect }: { activeTab: string; onSelect: (id: string) => void }) {
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
        {NAV_MOBILE.map(({ id, label, Icon }) => (
          <button
            key={id}
            data-ativo={activeTab === id}
            onClick={() => onSelect(id)}
            className={`snap-center shrink-0 w-[22vw] max-w-24 flex flex-col items-center justify-center h-full py-1 text-center cursor-pointer transition-all ${
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

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingLocal, setLoadingLocal] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>(abaDoHash);
  const [membrosFiltro, setMembrosFiltro] = useState<string>("Todos");

  useEffect(() => {
    // Sincronizar tema de cores na inicialização
    const savedTheme = localStorage.getItem("ga_theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Inicializar e escutar a sessão
    api.auth.getSession()
      .then(({ data }) => {
        setSession(data?.session || null);
        setLoadingLocal(false);
      })
      .catch((err) => {
        console.warn("Aviso ao carregar sessão:", err);
        setLoadingLocal(false);
      });

    const { data } = api.auth.onAuthStateChange((_e, currentSession) => {
      setSession(currentSession);
    });

    // Manter a aba em sincronia com o botão voltar/avançar do navegador
    const onHashChange = () => setActiveTab(abaDoHash());
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      if (data?.subscription?.unsubscribe) {
        data.subscription.unsubscribe();
      }
    };
  }, []);

  // Handler inteligente para mudar de aba e propagar configurações adicionais
  const handleSelectTab = (tab: string, extra?: any) => {
    setActiveTab(tab);
    if (abaDoHash() !== tab || !window.location.hash) {
      window.location.hash = `/${tab}`;
    }
    window.scrollTo(0, 0);
    
    if (tab === "membros" && extra && extra.filtro) {
      setMembrosFiltro(extra.filtro);
    } else if (tab === "membros") {
      setMembrosFiltro("Todos");
    }
  };

  if (loadingLocal) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-700"></div>
        <p className="mt-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest font-sans">Carregando Sessão...</p>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const liderId = session.user.id;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 flex transition-colors duration-200">

      {/* MENU LATERAL (TABLET / DESKTOP) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-20 lg:w-60 flex-col bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800/80 z-40 py-5 px-3">
        <div className="px-2 pb-5 hidden lg:block">
          <p className="text-[0.625rem] font-sans font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">Liderança Pastoral</p>
          <p className="text-sm font-sans font-bold text-slate-900 dark:text-white mt-0.5">Painel do Líder</p>
        </div>

        <nav className="flex flex-col gap-1">
          {[...NAV_PRINCIPAL, ...NAV_SECUNDARIA].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => handleSelectTab(id)}
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

        {/* COMPONENTE PRINCIPAL SELECIONADO NA ABA */}
        <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto md:px-4 lg:px-8 md:py-4">
          {activeTab === "inicio" && (
            <Inicio liderId={liderId} onSelectTab={handleSelectTab} />
          )}

          {activeTab === "membros" && (
            <Membros liderId={liderId} filtroInicial={membrosFiltro} />
          )}

          {activeTab === "reunioes" && (
            <Reunioes liderId={liderId} />
          )}

          {activeTab === "eventos" && (
            <Eventos liderId={liderId} />
          )}

          {activeTab === "mais" && (
            <Mais liderId={liderId} onSelectTab={handleSelectTab} />
          )}

          {activeTab === "oracao" && (
            <Oracao liderId={liderId} onVoltar={() => handleSelectTab("inicio")} />
          )}

          {activeTab === "bancodolider" && (
            <BancoDoLider liderId={liderId} onVoltar={() => handleSelectTab("inicio")} />
          )}

          {activeTab === "aniversariantes" && (
            <Aniversariantes liderId={liderId} onVoltar={() => handleSelectTab("inicio")} />
          )}
        </main>

        {/* MENU INFERIOR EM CARROSSEL (MOBILE) */}
        <MenuInferiorMobile activeTab={activeTab} onSelect={handleSelectTab} />

      </div>
    </div>
  );
}
