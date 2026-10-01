import React, { useEffect, useState } from "react";
import { Users, Search, Phone, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useDadosPastor, nomeDoLider, formatarData, idadeDe, iniciais, CATEGORIAS_MEMBRO, MembroP } from "./pastorUtils";
import { Cabecalho, EstadoCarga, campoClasse, cardClasse } from "./PastorUi";

const limpar = (f: string) => f.replace(/\D/g, "");
const wa = (f: string) => {
  const n = limpar(f);
  return n ? `https://wa.me/${n.length <= 11 ? "55" + n : n}` : "";
};

const Chip = ({ children, cor = "slate" }: { children: React.ReactNode; cor?: "slate" | "teal" | "rose" | "amber" | "indigo" | "emerald" }) => {
  const mapa: Record<string, string> = {
    slate: "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700",
    teal: "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/30",
    rose: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
    indigo: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
  };
  return <span className={`px-1.5 py-0.5 rounded-md font-bold text-[0.5625rem] border ${mapa[cor]}`}>{children}</span>;
};

export default function PastorMembros({ categoriaInicial = "todos" }: { categoriaInicial?: string }) {
  const { dados, loading, erro, recarregar } = useDadosPastor();
  const { lideres, membros } = dados;

  const [categoria, setCategoria] = useState(categoriaInicial);
  useEffect(() => { setCategoria(categoriaInicial); }, [categoriaInicial]);
  const [liderFiltro, setLiderFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [abertos, setAbertos] = useState<string[]>([]);

  const cat = CATEGORIAS_MEMBRO.find((c) => c.id === categoria) || CATEGORIAS_MEMBRO[0];
  const termo = busca.trim().toLowerCase();

  const lista = membros
    .filter(cat.filtro)
    .filter((m) => liderFiltro === "todos" || m.liderId === liderFiltro)
    .filter((m) => !termo || m.nome.toLowerCase().includes(termo) || (m.ga || "").toLowerCase().includes(termo) || nomeDoLider(lideres, m.liderId).toLowerCase().includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const alternar = (id: string) => setAbertos((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const detalhe = (rotulo: string, valor: React.ReactNode) => (
    <div>
      <span className="block text-[0.5rem] font-black text-gray-400 uppercase tracking-wide">{rotulo}</span>
      <span className="text-[0.6875rem] font-semibold text-slate-800 dark:text-zinc-200">{valor || "—"}</span>
    </div>
  );

  const cartao = (m: MembroP) => {
    const idade = idadeDe(m.aniversario);
    const aberto = abertos.includes(m.id);
    const ausente = m.status === "Ausente" || m.faltas >= 2;
    const transicao = m.origemTransicao || m.status === "Transição" || m.faixa === "J1";

    return (
      <div key={m.id} className={`${cardClasse} border-l-4 p-3.5 space-y-2.5 ${ausente ? "border-l-rose-300" : transicao ? "border-l-emerald-300" : m.status === "Esporádico" ? "border-l-amber-300" : "border-l-teal-300"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">{iniciais(m.nome)}</div>
            <div className="min-w-0 space-y-0.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.nome}</h4>
              <p className="text-[0.625rem] text-gray-500 dark:text-zinc-400 truncate">
                {nomeDoLider(lideres, m.liderId)}{m.ga && m.ga !== "GA Principal" ? ` · ${m.ga}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {m.contato1 && (
              <>
                <a href={`tel:${limpar(m.contato1)}`} className="p-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-lg" aria-label="Ligar">
                  <Phone className="w-3 h-3" />
                </a>
                <a href={wa(m.contato1)} target="_blank" rel="noreferrer" className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg" aria-label="WhatsApp">
                  <MessageCircle className="w-3 h-3" />
                </a>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Chip cor={m.status === "Ativo" ? "teal" : m.status === "Ausente" ? "rose" : m.status === "Esporádico" ? "amber" : "indigo"}>{m.status}</Chip>
          {m.faltas > 0 && <Chip cor="rose">{m.faltas} {m.faltas === 1 ? "falta" : "faltas"}</Chip>}
          {idade !== null && <Chip>{idade} anos</Chip>}
          {transicao && <Chip cor="emerald">Transição J1</Chip>}
          {m.treinando && <Chip cor="indigo">Treinando</Chip>}
          <Chip cor={m.batizado ? "teal" : "amber"}>{m.batizado ? "Batizado" : "Não batizado"}</Chip>
          <Chip cor={m.umComDeus ? "teal" : "amber"}>{m.umComDeus ? "Um com Deus" : "Sem Um com Deus"}</Chip>
        </div>

        <button onClick={() => alternar(m.id)} className="w-full flex items-center justify-between text-[0.625rem] font-extrabold uppercase text-teal-700 dark:text-teal-400 cursor-pointer">
          <span>{aberto ? "Ocultar informações" : "Ver informações"}</span>
          {aberto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {aberto && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800 animate-fadeIn">
            {detalhe("Faixa", m.faixa)}
            {detalhe("Admissão", formatarData(m.dataEntrada))}
            {detalhe("Aniversário", formatarData(m.aniversario))}
            {detalhe("Ministério", m.ministerio)}
            {detalhe("Culto", m.culto)}
            {detalhe("SENIB", m.senib)}
            {detalhe("Celular", m.contato1)}
            {detalhe("Alternativo", m.contato2)}
            {detalhe("Linguagem de amor", m.linguagemAmor)}
            {detalhe("Pais / responsáveis", m.contatoPais)}
            {(m.motivoAusencia || m.detalheAusencia) && (
              <div className="col-span-2">{detalhe("Situação de ausência", `${m.motivoAusencia}${m.detalheAusencia ? ` — ${m.detalheAusencia}` : ""}`)}</div>
            )}
            {m.observacoes && <div className="col-span-2">{detalhe("Acompanhamento pastoral", m.observacoes)}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
      <Cabecalho
        icone={<Users className="w-5 h-5 text-teal-700 dark:text-teal-400" />}
        titulo="Membros por Categoria"
        subtitulo="Verificação das informações de todos os líderes"
      />

      <EstadoCarga loading={loading} erro={erro} onRecarregar={recarregar} />

      {!loading && !erro && (
        <>
          {/* BUSCA E FILTROS (SELECTS) */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_15rem_15rem] gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-teal-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, G.A ou líder..." className={`${campoClasse} pl-9 rounded-2xl`} />
            </div>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Filtrar por categoria" className={`${campoClasse} rounded-2xl cursor-pointer`}>
              {CATEGORIAS_MEMBRO.map((c) => (
                <option key={c.id} value={c.id}>{c.label} ({membros.filter(c.filtro).length})</option>
              ))}
            </select>
            <select value={liderFiltro} onChange={(e) => setLiderFiltro(e.target.value)} aria-label="Filtrar por líder" className={`${campoClasse} rounded-2xl cursor-pointer`}>
              <option value="todos">Todos os líderes</option>
              {lideres.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </div>

                    <p className="text-[0.625rem] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest">{lista.length} {lista.length === 1 ? "membro encontrado" : "membros encontrados"}</p>

          {lista.length === 0 ? (
            <div className={`${cardClasse} py-10 text-center text-xs text-gray-400`}>Nenhum membro nesta categoria.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3 pb-6">{lista.map(cartao)}</div>
          )}
        </>
      )}
    </div>
  );
}
