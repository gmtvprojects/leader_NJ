import { useState } from "react";
import { Settings, Moon, Sun, LogOut, UserCircle } from "lucide-react";
import { api } from "../../lib/api";
import { Cabecalho, cardClasse } from "./PastorUi";

export default function PastorConfig({ codigo }: { codigo?: string | null }) {
  const [tema, setTema] = useState<"light" | "dark">(() => ((localStorage.getItem("ga_theme") as "light" | "dark") || "light"));

  const alternarTema = () => {
    const proximo = tema === "light" ? "dark" : "light";
    setTema(proximo);
    localStorage.setItem("ga_theme", proximo);
    document.documentElement.classList.toggle("dark", proximo === "dark");
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
      <Cabecalho icone={<Settings className="w-5 h-5 text-teal-700 dark:text-teal-400" />} titulo="Configurações" subtitulo="Conta e aparência" />

      <div className="grid grid-cols-1 gap-3.5 max-w-2xl">
        <div className={`${cardClasse} p-4 flex items-center gap-3`}>
          <div className="p-2 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 rounded-xl">
            <UserCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-none">Perfil Pastor</h3>
            <p className="text-[0.6875rem] text-gray-500 dark:text-zinc-400 mt-1 truncate">{codigo ? `Código de acesso ${codigo}` : ""}</p>
          </div>
        </div>

        <div className={`${cardClasse} p-4 flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl">
              {tema === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-none">Tema Escuro</h3>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={tema === "dark"}
            aria-label="Alternar tema escuro"
            onClick={alternarTema}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${tema === "dark" ? "bg-teal-700" : "bg-gray-300 dark:bg-zinc-700"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tema === "dark" ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <button
          onClick={() => api.auth.signOut()}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" /> Sair da conta
        </button>
      </div>
    </div>
  );
}
