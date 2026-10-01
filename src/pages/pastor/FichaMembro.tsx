import React, { useState } from "react";
import { Phone, MessageCircle, Heart } from "lucide-react";
import { DadosPastor, MembroP, nomeDoLider, formatarData, idadeDe, iniciais, registroDoMembro, ehTransicao } from "./pastorUtils";
import { cardClasse } from "./PastorUi";

const limpar = (f: string) => f.replace(/\D/g, "");
const linkWa = (f: string) => {
  const n = limpar(f);
  return n ? `https://wa.me/${n.length <= 11 ? "55" + n : n}` : "";
};

const Info = ({ rotulo, valor }: { rotulo: string; valor?: React.ReactNode }) => (
  <div>
    <span className="block text-[0.5625rem] font-black text-gray-400 uppercase tracking-wide">{rotulo}</span>
    <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs">{valor || "—"}</span>
  </div>
);

// Ficha completa de um membro para o Pastor (somente leitura)
export default function FichaMembro({ dados, membro }: { dados: DadosPastor; membro: MembroP }) {
  const [aba, setAba] = useState<"presenca" | "ausencias">("presenca");

  const registro = registroDoMembro(dados, membro);
  const ultimas = registro.slice(0, 8);
  const ausencias = registro.filter((r) => !r.presente);
  const presencasUltimas = ultimas.filter((r) => r.presente).length;
  const idade = idadeDe(membro.aniversario);
  const pedidos = dados.pedidos.filter((p) => p.membroId === membro.id && p.status === "pendente");

  return (
    <div className="space-y-4 w-full max-w-3xl">
      <div className={`${cardClasse} border-l-4 border-l-teal-300 p-4 space-y-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">{iniciais(membro.nome)}</div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">{membro.nome}</h2>
              <p className="text-[0.6875rem] text-gray-500 dark:text-zinc-400 truncate">
                {nomeDoLider(dados.lideres, membro.liderId)}{membro.ga ? ` · ${membro.ga}` : ""}
              </p>
            </div>
          </div>
          {membro.contato1 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <a href={`tel:${limpar(membro.contato1)}`} className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-lg" aria-label="Ligar">
                <Phone className="w-4 h-4" />
              </a>
              <a href={linkWa(membro.contato1)} target="_blank" rel="noreferrer" className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg" aria-label="WhatsApp">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 text-[0.5625rem] font-bold">
          <span className="px-1.5 py-0.5 rounded-md border bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/30">{membro.status}</span>
          {idade !== null && <span className="px-1.5 py-0.5 rounded-md border bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700">{idade} anos</span>}
          {ehTransicao(membro) && <span className="px-1.5 py-0.5 rounded-md border bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30">Transição J1</span>}
          {membro.treinando && <span className="px-1.5 py-0.5 rounded-md border bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30">Treinando</span>}
        </div>

        {/* ABAS: PRESENÇA / AUSÊNCIAS */}
        <div className="space-y-2.5">
          <div className="flex bg-slate-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-1 gap-1">
            {([["presenca", "Presença"], ["ausencias", `Ausências (${ausencias.length})`]] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setAba(id)}
                className={`flex-1 py-1.5 rounded-lg text-[0.625rem] font-extrabold uppercase tracking-wider transition cursor-pointer ${
                  aba === id ? "bg-teal-50 text-teal-800 border border-teal-200 shadow-sm" : "text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {aba === "presenca" ? (
            <div className="space-y-1.5">
              <p className="text-[0.5625rem] font-black text-gray-400 uppercase tracking-wide">
                Últimas {ultimas.length || 8} reuniões · {presencasUltimas} presença{presencasUltimas === 1 ? "" : "s"}
              </p>
              {ultimas.length === 0 ? (
                <p className="text-[0.6875rem] text-gray-400 italic py-2">Nenhuma reunião registrada ainda.</p>
              ) : (
                ultimas.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl">
                    <div className="min-w-0">
                      <span className="block text-[0.6875rem] font-bold text-slate-800 dark:text-zinc-200 font-mono">{formatarData(r.data)}</span>
                      {r.tema && <span className="block text-[0.5938rem] text-gray-400 truncate">{r.tema}</span>}
                    </div>
                    <span className={`text-[0.5625rem] font-black uppercase px-2 py-0.5 rounded-lg border shrink-0 ${
                      r.presente
                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40"
                        : "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40"
                    }`}>
                      {r.presente ? "Presente" : "Ausente"}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {membro.motivoAusencia && (
                <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 p-2.5 rounded-xl space-y-0.5">
                  <span className="block text-[0.5625rem] font-black uppercase text-amber-800 dark:text-amber-400">Situação registrada pelo líder</span>
                  <p className="font-bold text-slate-800 dark:text-white text-xs">{membro.motivoAusencia}</p>
                  {membro.detalheAusencia && <p className="text-[0.625rem] text-gray-600 dark:text-zinc-300 italic">“{membro.detalheAusencia}”</p>}
                </div>
              )}
              {ausencias.length === 0 ? (
                <p className="text-[0.6875rem] text-gray-400 italic py-2">Nenhuma ausência registrada.</p>
              ) : (
                ausencias.map((r) => (
                  <div key={r.id} className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl space-y-0.5">
                    <span className="block text-[0.6875rem] font-bold text-slate-800 dark:text-zinc-200 font-mono">{formatarData(r.data)}</span>
                    <p className={`text-[0.6875rem] ${r.motivo ? "text-slate-700 dark:text-zinc-300" : "text-gray-400 italic"}`}>{r.motivo || "Sem justificativa"}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* INFORMAÇÕES */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
          <Info rotulo="Faixa" valor={membro.faixa} />
          <Info rotulo="Admissão" valor={formatarData(membro.dataEntrada)} />
          <Info rotulo="Aniversário" valor={formatarData(membro.aniversario)} />
          <Info rotulo="Celular" valor={membro.contato1} />
          <Info rotulo="Alternativo" valor={membro.contato2} />
          <Info rotulo="Ministério" valor={membro.ministerio} />
          <Info rotulo="Batizado" valor={membro.batizado ? "Sim" : "Não"} />
          <Info rotulo="Um com Deus" valor={membro.umComDeus ? "Sim" : "Não"} />
          <Info rotulo="Linguagem de amor" valor={membro.linguagemAmor} />
          <Info rotulo="Culto" valor={membro.culto} />
          <Info rotulo="SENIB" valor={membro.senib} />
          <Info rotulo="Pais / responsáveis" valor={membro.contatoPais} />
        </div>
      </div>

      {/* PEDIDOS DE ORAÇÃO EM ABERTO */}
      <div className="space-y-2 bg-rose-50/30 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-900/30 p-3.5 rounded-2xl">
        <span className="block text-[0.5625rem] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Pedidos de Oração
        </span>
        {pedidos.length === 0 ? (
          <p className="text-[0.6875rem] text-gray-400 italic">Nenhum pedido de oração em aberto.</p>
        ) : (
          pedidos.map((p) => (
            <div key={p.id} className="p-2.5 bg-white dark:bg-zinc-900 border border-rose-100/70 dark:border-zinc-800 rounded-xl">
              <span className="block text-[0.5625rem] font-mono text-gray-400 mb-0.5">{formatarData(p.data)}</span>
              <p className="text-[0.6875rem] leading-relaxed text-slate-700 dark:text-zinc-300 italic">“{p.texto}”</p>
            </div>
          ))
        )}
      </div>

      {/* ACOMPANHAMENTO PASTORAL */}
      <div className="space-y-1.5 bg-yellow-50/20 dark:bg-amber-950/5 border border-yellow-100 dark:border-amber-900/30 p-3.5 rounded-2xl">
        <span className="block text-[0.5625rem] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">Acompanhamento Pastoral</span>
        <p className="text-[0.6875rem] leading-relaxed text-slate-700 dark:text-zinc-300 italic whitespace-pre-line">
          {membro.observacoes || "Nenhum registro de acompanhamento pelo líder."}
        </p>
      </div>
    </div>
  );
}
