import { useState } from "react";
import { HeartHandshake, Search, Calendar, User } from "lucide-react";
import { useDadosPastor, nomeDoLider, formatarData } from "./pastorUtils";
import { Cabecalho, EstadoCarga, campoClasse, cardClasse } from "./PastorUi";

const ROTULO = { pendente: "Em oração", finalizado: "Finalizado", resolvido: "Resolvido" } as const;

export default function PastorPedidos() {
  const { dados, loading, erro, recarregar } = useDadosPastor();
  const { lideres, pedidos } = dados;
  const [status, setStatus] = useState<"todos" | "pendente" | "finalizado" | "resolvido">("pendente");
  const [liderFiltro, setLiderFiltro] = useState("todos");
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const lista = pedidos
    .filter((p) => status === "todos" || p.status === status)
    .filter((p) => liderFiltro === "todos" || p.liderId === liderFiltro)
    .filter((p) => !termo || p.membroNome.toLowerCase().includes(termo) || p.texto.toLowerCase().includes(termo) || nomeDoLider(lideres, p.liderId).toLowerCase().includes(termo));

  const contar = (s: string) => pedidos.filter((p) => p.status === s).length;

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
      <Cabecalho
        icone={<HeartHandshake className="w-5 h-5 text-teal-700 dark:text-teal-400" />}
        titulo="Pedidos de Oração"
        subtitulo={`${pedidos.length} pedidos de todos os membros · ${contar("pendente")} em oração`}
      />

      <EstadoCarga loading={loading} erro={erro} onRecarregar={recarregar} />

      {!loading && !erro && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_12rem_14rem] gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por membro, líder ou pedido..." className={`${campoClasse} pl-9 rounded-2xl`} />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} aria-label="Filtrar por situação" className={`${campoClasse} rounded-2xl cursor-pointer`}>
              <option value="pendente">Em oração ({contar("pendente")})</option>
              <option value="resolvido">Resolvidos ({contar("resolvido")})</option>
              <option value="finalizado">Finalizados ({contar("finalizado")})</option>
              <option value="todos">Todos ({pedidos.length})</option>
            </select>
            <select value={liderFiltro} onChange={(e) => setLiderFiltro(e.target.value)} aria-label="Filtrar por líder" className={`${campoClasse} rounded-2xl cursor-pointer`}>
              <option value="todos">Todos os líderes</option>
              {lideres.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </div>

          <p className="text-[0.625rem] font-semibold text-gray-400 uppercase tracking-widest">{lista.length} {lista.length === 1 ? "pedido" : "pedidos"}</p>

          {lista.length === 0 ? (
            <div className={`${cardClasse} py-12 text-center text-xs text-gray-400`}>Nenhum pedido de oração encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3 pb-6">
              {lista.map((p) => {
                const concluido = p.status !== "pendente";
                return (
                  <div key={p.id} className={`bg-white dark:bg-zinc-900 border-2 p-4 rounded-3xl space-y-3 ${concluido ? "border-emerald-500" : "border-gray-300 dark:border-zinc-700"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-2 rounded-xl shrink-0 ${concluido ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600" : "bg-[#E1F5EE] dark:bg-teal-950/40 text-teal-700 dark:text-teal-400"}`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none truncate">{p.membroNome || "Membro"}</h3>
                          <p className="text-[0.5625rem] text-gray-400 font-mono mt-1 uppercase flex items-center gap-1.5 truncate">
                            <Calendar className="w-3 h-3 shrink-0" /> {formatarData(p.data)} · {nomeDoLider(lideres, p.liderId)}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[0.5625rem] font-black uppercase px-2 py-0.5 rounded-lg border shrink-0 ${
                        concluido
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40"
                          : "bg-gray-50 dark:bg-zinc-800 text-gray-500 border-gray-200 dark:border-zinc-700"
                      }`}>
                        {ROTULO[p.status]}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800/80">
                      <p className="text-[0.7188rem] leading-relaxed font-semibold italic text-slate-800 dark:text-slate-200">“{p.texto}”</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
