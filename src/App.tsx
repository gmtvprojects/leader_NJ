import { useState, useEffect } from "react";
import { 
  House, 
  Users, 
  BookOpen, 
  MapPin, 
  Menu 
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
    <div className="min-h-screen bg-gray-100 dark:bg-black flex flex-col items-center justify-start transition-colors duration-200">
      
      {/* DISPOSITIVO CONTAINER MOBILE-FIRST COM CENTRADO NO DESKTOP */}
      <div className="w-full max-w-md bg-neutral-50 dark:bg-zinc-950 min-h-screen flex flex-col relative shadow-2xl border-x border-gray-200/50 dark:border-zinc-900 pb-[72px] md:pb-[80px]">
        
        {/* COMPONENTE PRINCIPAL SELECIONADO NA ABA */}
        <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
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

        {/* RODAPÉ E ABAS DE NAVEGAÇÃO FIXO */}
        <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-gray-100 dark:border-zinc-800/80 flex justify-around items-center h-16 z-40 px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
          
          <button
            onClick={() => handleSelectTab("inicio")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center cursor-pointer transition-all ${
              activeTab === "inicio"
                ? "text-teal-700 dark:text-teal-400 scale-[1.05]"
                : "text-gray-400 hover:text-gray-600 dark:text-zinc-500"
            }`}
            aria-label="Aba Início"
          >
            <House className="w-5 h-5" />
            <span className="text-[10px] font-sans font-bold mt-1.5 uppercase tracking-wide">Início</span>
          </button>

          <button
            onClick={() => handleSelectTab("membros")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center cursor-pointer transition-all ${
              activeTab === "membros"
                ? "text-teal-700 dark:text-teal-400 scale-[1.05]"
                : "text-gray-400 hover:text-gray-600 dark:text-zinc-500"
            }`}
            aria-label="Aba Membros"
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-sans font-bold mt-1.5 uppercase tracking-wide">Membros</span>
          </button>

          <button
            onClick={() => handleSelectTab("reunioes")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center cursor-pointer transition-all ${
              activeTab === "reunioes"
                ? "text-teal-700 dark:text-teal-400 scale-[1.05]"
                : "text-gray-400 hover:text-gray-600 dark:text-zinc-500"
            }`}
            aria-label="Aba Reuniões"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-sans font-bold mt-1.5 uppercase tracking-wide">Reuniões</span>
          </button>

          <button
            onClick={() => handleSelectTab("eventos")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center cursor-pointer transition-all ${
              activeTab === "eventos"
                ? "text-teal-700 dark:text-teal-400 scale-[1.05]"
                : "text-gray-400 hover:text-gray-600 dark:text-zinc-500"
            }`}
            aria-label="Aba Eventos"
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] font-sans font-bold mt-1.5 uppercase tracking-wide">Eventos</span>
          </button>

          <button
            onClick={() => handleSelectTab("mais")}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center cursor-pointer transition-all ${
              activeTab === "mais"
                ? "text-teal-700 dark:text-teal-400 scale-[1.05]"
                : "text-gray-400 hover:text-gray-600 dark:text-zinc-500"
            }`}
            aria-label="Aba Mais"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-sans font-bold mt-1.5 uppercase tracking-wide">Mais</span>
          </button>

        </footer>

      </div>
    </div>
  );
}
