import { useState, useEffect } from "react";
import {
  House,
  Users,
  BookOpen,
  MapPin,
  Settings,
  HeartHandshake,
  Library,
  Cake,
  LayoutDashboard,
  UserCog,
  CalendarCheck,
  ScrollText,
  Sparkles
} from "lucide-react";

import { api } from "./lib/api";
import Login from "./pages/Login";
import Shell, { ItemNav } from "./components/Shell";

import Inicio from "./pages/Inicio";
import Membros from "./pages/Membros";
import Reunioes from "./pages/Reunioes";
import Eventos from "./pages/Eventos";
import Mais from "./pages/Mais";
import Oracao from "./pages/Oracao";
import BancoDoLider from "./pages/BancoDoLider";
import Aniversariantes from "./pages/Aniversariantes";

import PastorGeral from "./pages/pastor/PastorGeral";
import PastorTransicao from "./pages/pastor/PastorTransicao";
import PastorLideres from "./pages/pastor/PastorLideres";
import PastorMembros from "./pages/pastor/PastorMembros";
import PastorEventos from "./pages/pastor/PastorEventos";
import PastorPedidos from "./pages/pastor/PastorPedidos";
import PastorManual from "./pages/pastor/PastorManual";
import PastorConfig from "./pages/pastor/PastorConfig";
import { fundoPastor } from "./pages/pastor/PastorUi";

// Menu do perfil Líder
const NAV_LIDER: ItemNav[] = [
  { id: "inicio", label: "Início", Icon: House },
  { id: "membros", label: "Membros", Icon: Users },
  { id: "reunioes", label: "Reuniões", Icon: BookOpen },
  { id: "eventos", label: "Eventos", Icon: MapPin },
  { id: "oracao", label: "Pedidos de Oração", Icon: HeartHandshake },
  { id: "bancodolider", label: "Banco do Líder", Icon: Library },
  { id: "aniversariantes", label: "Aniversariantes", Icon: Cake },
  { id: "mais", label: "Configurações", Icon: Settings },
];

// Menu do perfil Pastor
const NAV_PASTOR: ItemNav[] = [
  { id: "geral", label: "Geral", Icon: LayoutDashboard },
  { id: "lideres", label: "Líderes", Icon: UserCog },
  { id: "membros", label: "Membros", Icon: Users },
  { id: "transicao", label: "Transição", Icon: Sparkles },
  { id: "eventos", label: "Eventos", Icon: CalendarCheck },
  { id: "pedidos", label: "Pedidos de Oração", Icon: HeartHandshake },
  { id: "manual", label: "Manual", Icon: ScrollText },
  { id: "config", label: "Configurações", Icon: Settings },
];

// Lê a aba ativa a partir do hash da URL (ex.: #/membros)
function abaDoHash(validas: string[], padrao: string): string {
  const id = window.location.hash.replace(/^#\/?/, "");
  return validas.includes(id) ? id : padrao;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingLocal, setLoadingLocal] = useState<boolean>(true);
  const [hash, setHash] = useState<string>(window.location.hash);
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
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      if (data?.subscription?.unsubscribe) {
        data.subscription.unsubscribe();
      }
    };
  }, []);

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

  const ehPastor = session.user.papel === "pastor";
  const nav = ehPastor ? NAV_PASTOR : NAV_LIDER;
  const padrao = ehPastor ? "geral" : "inicio";
  const activeTab = (() => {
    const id = hash.replace(/^#\/?/, "");
    return nav.some((n) => n.id === id) ? id : padrao;
  })();

  // Handler inteligente para mudar de aba e propagar configurações adicionais
  const handleSelectTab = (tab: string, extra?: any) => {
    if (abaDoHash(nav.map((n) => n.id), padrao) !== tab || !window.location.hash) {
      window.location.hash = `/${tab}`;
    }
    setHash(`#/${tab}`);
    window.scrollTo(0, 0);

    if (tab === "membros" && extra && extra.filtro) {
      setMembrosFiltro(extra.filtro);
    } else if (tab === "membros") {
      setMembrosFiltro("Todos");
    }
  };

  const liderId = session.user.id;

  if (ehPastor) {
    return (
      <Shell nav={NAV_PASTOR} activeTab={activeTab} onSelect={handleSelectTab} titulo="Painel do Pastor" larguraMax="max-w-6xl" fundo={fundoPastor}>
        {activeTab === "geral" && <PastorGeral onSelectTab={handleSelectTab} />}
        {activeTab === "transicao" && <PastorTransicao />}
        {activeTab === "lideres" && <PastorLideres />}
        {activeTab === "membros" && <PastorMembros />}
        {activeTab === "eventos" && <PastorEventos />}
        {activeTab === "pedidos" && <PastorPedidos />}
        {activeTab === "manual" && <PastorManual />}
        {activeTab === "config" && <PastorConfig email={session.user.email} codigo={session.user.codigo} />}
      </Shell>
    );
  }

  return (
    <Shell nav={NAV_LIDER} activeTab={activeTab} onSelect={handleSelectTab} titulo="Painel do Líder">
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
    </Shell>
  );
}
