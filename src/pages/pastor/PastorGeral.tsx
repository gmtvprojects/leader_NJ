import { useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { useDadosPastor } from "./pastorUtils";
import { Cabecalho, EstadoCarga, abasContainer, abaAtiva, abaInativa } from "./PastorUi";
import PastorPainel from "./PastorPainel";
import PastorGraficos from "./PastorGraficos";

interface Props {
  onSelectTab: (tab: string, extra?: any) => void;
}

// Área "Geral": aba Visão Geral (resumo) e aba Painel (gráficos por período)
export default function PastorGeral({ onSelectTab }: Props) {
  const estado = useDadosPastor();
  const [aba, setAba] = useState<"visao" | "painel">("visao");

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
      <Cabecalho
        icone={<LayoutDashboard className="w-5 h-5 text-teal-700 dark:text-teal-400" />}
        titulo="Geral"
        subtitulo="Líderes, membros, presença e eventos"
      />

      <div className={abasContainer}>
        {([["visao", "Visão Geral"], ["painel", "Painel"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`px-4 py-1.5 rounded-lg text-[0.6563rem] font-extrabold uppercase tracking-wider transition cursor-pointer ${
              aba === id ? abaAtiva : abaInativa
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <EstadoCarga loading={estado.loading} erro={estado.erro} onRecarregar={estado.recarregar} />

      {!estado.loading && !estado.erro && (aba === "visao" ? <PastorPainel estado={estado} onSelectTab={onSelectTab} /> : <PastorGraficos estado={estado} />)}
    </div>
  );
}
