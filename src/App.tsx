import { useState, useEffect } from "react";
import { 
  House, 
  Users, 
  BookOpen, 
  MapPin, 
  Menu,
  HeartHandshake,
  Library,
  Cake
} from "lucide-react";

import { supabase } from "./lib/supabase";
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
  { id: "mais", label: "Mais", Icon: Menu },
];

// Atalhos extras exibidos apenas no menu lateral (tablet / desktop)
const NAV_SECUNDARIA = [
  { id: "oracao", label: "Oração", Icon: HeartHandshake },
  { id: "bancodolider", label: "Banco do Líder", Icon: Library },
  { id: "aniversariantes", label: "Aniversariantes", Icon: Cake },
];

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingLocal, setLoadingLocal] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("inicio");
  const [membrosFiltro, setMembrosFiltro] = useState<string>("Todos");

  useEffect(() => {
    // Sincronizar tema de cores na inicialização
    const savedTheme = localStorage.getItem("ga_theme") || "light";
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Inicializar e escutar a sessão do Supabase com tratamento resiliente
    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data?.session || null);
        setLoadingLocal(false);
      })
      .catch((err) => {
        console.warn("Aviso ao carregar sessão:", err);
        setLoadingLocal(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_e, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      if (data?.subscription?.unsubscribe) {
        data.subscription.unsubscribe();
      }
    };
  }, []);

  // Handler inteligente para mudar de aba e propagar configurações adicionais
  const handleSelectTab = (tab: string, extra?: any) => {
    setActiveTab(tab);
    
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
          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">Liderança Pastoral</p>
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

        {/* RODAPÉ E ABAS DE NAVEGAÇÃO FIXO (MOBILE) */}
        <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800/80 flex justify-around items-center h-16 z-40 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
          {NAV_PRINCIPAL.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => handleSelectTab(id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center cursor-pointer transition-all ${
                activeTab === id
                  ? "text-teal-700 dark:text-teal-400 scale-[1.05]"
                  : "text-gray-400 hover:text-gray-600 dark:text-zinc-500"
              }`}
              aria-label={`Aba ${label}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-sans font-bold mt-1.5 uppercase tracking-wide">{label}</span>
            </button>
          ))}
        </footer>

      </div>
    </div>
  );
}
