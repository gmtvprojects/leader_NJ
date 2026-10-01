import { useState } from "react";
import { ArrowLeft, ChevronRight, Phone, MessageCircle, MapPin, Users as UsersIcon, Trash2, X, Loader2 } from "lucide-react";
import { DadosPastor, LiderP, formatarData, idadeDe, iniciais } from "./pastorUtils";
import { cardClasse, abasContainer, abaAtiva, abaInativa, campoClasse } from "./PastorUi";
import FichaMembro from "./FichaMembro";

const limpar = (f: string) => f.replace(/\D/g, "");
const wa = (f: string) => {
  const n = limpar(f);
  return n ? `https://wa.me/${n.length <= 11 ? "55" + n : n}` : "";
};

type Aba = "membros" | "reunioes" | "eventos";

// Página do líder: lista de membros, registro de reuniões e eventos
export default function PastorLiderDetalhe({ dados, lider, onVoltar, onExcluir }: { dados: DadosPastor; lider: LiderP; onVoltar: () => void; onExcluir: () => Promise<string | null> }) {
  const [aba, setAba] = useState<Aba>("membros");
  const [excluindo, setExcluindo] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erroExcluir, setErroExcluir] = useState("");

  const confirmarExclusao = async () => {
    setProcessando(true);
    setErroExcluir("");
    const erro = await onExcluir();
    setProcessando(false);
    if (erro) setErroExcluir(erro);
  };
  const [membroId, setMembroId] = useState<string | null>(null);

  const membros = dados.membros.filter((m) => m.liderId === lider.id).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const reunioes = dados.reunioes.filter((r) => r.liderId === lider.id).sort((a, b) => b.data.localeCompare(a.data));
  const eventos = dados.eventos.filter((e) => e.liderId === lider.id).sort((a, b) => b.data.localeCompare(a.data));
  const membro = membros.find((m) => m.id === membroId) || null;

  const migalhas = (
    <nav aria-label="Navegação" className="flex items-center gap-1.5 text-[0.6875rem] font-bold flex-wrap">
      <button type="button" onClick={onVoltar} className="flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:underline cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Líderes
      </button>
      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
      {membro ? (
        <>
          <button type="button" onClick={() => setMembroId(null)} className="text-teal-700 dark:text-teal-400 hover:underline cursor-pointer">{lider.nomeGrupo || lider.nome}</button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-slate-900 dark:text-white">{membro.nome}</span>
        </>
      ) : (
        <span className="text-slate-900 dark:text-white">{lider.nomeGrupo || lider.nome}</span>
      )}
    </nav>
  );

  if (membro) {
    return (
      <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
        {migalhas}
        <FichaMembro dados={dados} membro={membro} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
      {migalhas}

      <div className={`${cardClasse} border-l-4 border-l-teal-300 p-4 flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            {iniciais(lider.nome)}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">{lider.nomeGrupo || lider.nome}</h2>
            <p className="text-[0.6875rem] text-teal-700 dark:text-teal-400 font-bold truncate">Líder: {lider.nome}{lider.codigo ? ` · Código ${lider.codigo}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => { setExcluindo(true); setConfirmacao(""); setErroExcluir(""); }}
            className="p-2 bg-white dark:bg-zinc-900 border border-rose-200 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
            aria-label="Excluir líder"
            title="Excluir líder e conta"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {lider.celular && (
          <div className="flex items-center gap-1.5 shrink-0">
            <a href={`tel:${limpar(lider.celular)}`} className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-lg" aria-label="Ligar">
              <Phone className="w-4 h-4" />
            </a>
            <a href={wa(lider.celular)} target="_blank" rel="noreferrer" className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg" aria-label="WhatsApp">
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      <div className={abasContainer}>
        {([["membros", `Membros (${membros.length})`], ["reunioes", `Reuniões (${reunioes.length})`], ["eventos", `Eventos (${eventos.length})`]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`px-4 py-1.5 rounded-lg text-[0.6563rem] font-extrabold uppercase tracking-wider transition cursor-pointer ${aba === id ? abaAtiva : abaInativa}`}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === "membros" && (
        membros.length === 0 ? (
          <div className={`${cardClasse} py-10 text-center text-xs text-gray-400`}>Nenhum membro cadastrado.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-6">
            {membros.map((m) => {
              const idade = idadeDe(m.aniversario);
              return (
                <button
                  key={m.id}
                  onClick={() => setMembroId(m.id)}
                  className={`${cardClasse} border-l-4 ${m.status === "Ausente" || m.faltas >= 2 ? "border-l-rose-300" : "border-l-teal-300"} p-3.5 text-left flex items-center gap-3 hover:shadow-lg transition cursor-pointer`}
                >
                  <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">{iniciais(m.nome)}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.nome}</h4>
                    <p className="text-[0.625rem] text-gray-500 dark:text-zinc-400 truncate">
                      {m.status}{idade !== null ? ` · ${idade} anos` : ""}{m.faltas > 0 ? ` · ${m.faltas} falta${m.faltas === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              );
            })}
          </div>
        )
      )}

      {aba === "reunioes" && (
        reunioes.length === 0 ? (
          <div className={`${cardClasse} py-10 text-center text-xs text-gray-400`}>Nenhuma reunião registrada.</div>
        ) : (
          <div className="space-y-2.5 pb-6">
            {reunioes.map((r) => (
              <div key={r.id} className={`${cardClasse} border-l-4 border-l-indigo-300 p-3.5 flex items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white font-mono">{formatarData(r.data)}</p>
                  {r.tema && <p className="text-[0.6875rem] text-gray-500 dark:text-zinc-400 truncate">{r.tema}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[0.625rem] font-black uppercase px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 flex items-center gap-1">
                    <UsersIcon className="w-3 h-3" /> {r.presentes}/{membros.length}
                  </span>
                  {r.ausencias > 0 && (
                    <span className="text-[0.625rem] font-black uppercase px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600">{r.ausencias} aus.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {aba === "eventos" && (
        eventos.length === 0 ? (
          <div className={`${cardClasse} py-10 text-center text-xs text-gray-400`}>Nenhum evento cadastrado.</div>
        ) : (
          <div className="space-y-2.5 pb-6">
            {eventos.map((e) => (
              <div key={e.id} className={`${cardClasse} border-l-4 border-l-amber-300 p-3.5 flex items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{e.titulo}</p>
                  <p className="text-[0.6875rem] text-gray-500 dark:text-zinc-400 flex items-center gap-1 truncate">
                    <span className="font-mono">{formatarData(e.data)}</span>
                    {e.local && (<><MapPin className="w-3 h-3 shrink-0" /> {e.local}</>)}
                  </p>
                </div>
                <span className={`text-[0.5625rem] font-black uppercase px-2 py-0.5 rounded-lg border shrink-0 ${
                  !e.precisaAprovacao
                    ? "bg-gray-50 dark:bg-zinc-800 text-gray-500 border-gray-200 dark:border-zinc-700"
                    : e.aprovacaoStatus === "aprovado"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40"
                    : e.aprovacaoStatus === "reprovado"
                    ? "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40"
                    : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40"
                }`}>
                  {!e.precisaAprovacao ? "Sem aprovação" : e.aprovacaoStatus === "pendente" ? "Pendente" : e.aprovacaoStatus === "aprovado" ? "Aprovado" : "Reprovado"}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      {excluindo && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !processando && setExcluindo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-xs font-black uppercase text-rose-600 flex items-center gap-1"><Trash2 className="w-4 h-4" /> Excluir líder</span>
              <button onClick={() => setExcluindo(false)} disabled={processando} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer" aria-label="Fechar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-zinc-300">
              Isto exclui a conta de <strong>{lider.nomeGrupo || lider.nome}</strong> e apaga, <strong>de forma permanente</strong>, os {membros.length} membros, as {reunioes.length} reuniões,
              os eventos, os pedidos de oração e todos os demais dados desse líder. Não dá para desfazer.
            </p>
            <div className="space-y-1">
              <label htmlFor="confirma-exclusao" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">Digite EXCLUIR para confirmar</label>
              <input id="confirma-exclusao" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="off" className={campoClasse} />
            </div>
            {erroExcluir && <p className="text-xs font-semibold text-rose-600">{erroExcluir}</p>}
            <button
              onClick={confirmarExclusao}
              disabled={processando || confirmacao.trim().toUpperCase() !== "EXCLUIR"}
              className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processando && <Loader2 className="w-4 h-4 animate-spin" />} Excluir líder e conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

