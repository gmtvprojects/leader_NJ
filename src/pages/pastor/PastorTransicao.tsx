import React, { useState } from "react";
import { Sparkles, Search, ArrowLeft, ChevronRight } from "lucide-react";
import { useDadosPastor, nomeDoLider, formatarData, idadeDe, iniciais, registroDoMembro, ehTransicao, MembroP } from "./pastorUtils";
import { Cabecalho, EstadoCarga, campoClasse, cardClasse } from "./PastorUi";
import { BarrasHorizontais, CardGrafico, Proporcao } from "./Graficos";
import FichaMembro from "./FichaMembro";

export default function PastorTransicao() {
  const estado = useDadosPastor();
  const { dados, loading, erro, recarregar } = estado;
  const { lideres } = dados;

  const [aba, setAba] = useState<"lista" | "relatorio">("lista");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [liderFiltro, setLiderFiltro] = useState("todos");

  const todos = dados.membros.filter(ehTransicao).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const selecionado = todos.find((m) => m.id === selecionadoId) || null;
  const termo = busca.trim().toLowerCase();
  const lista = todos
    .filter((m) => liderFiltro === "todos" || m.liderId === liderFiltro)
    .filter((m) => !termo || m.nome.toLowerCase().includes(termo) || nomeDoLider(lideres, m.liderId).toLowerCase().includes(termo));

  // Frequência do membro nas últimas 8 reuniões do líder
  const frequencia = (m: MembroP) => {
    const ultimas = registroDoMembro(dados, m).slice(0, 8);
    const presentes = ultimas.filter((r) => r.presente).length;
    return { presentes, total: ultimas.length, pct: ultimas.length ? Math.round((presentes / ultimas.length) * 100) : null };
  };

  if (selecionado) {
    return (
      <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
        <nav aria-label="Navegação" className="flex items-center gap-1.5 text-[0.6875rem] font-bold">
          <button type="button" onClick={() => setSelecionadoId(null)} className="flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:underline cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> Transição
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-slate-900 dark:text-white">{selecionado.nome}</span>
        </nav>
        <FichaMembro dados={dados} membro={selecionado} />
      </div>
    );
  }

  // ---- Dados do relatório
  const semGa = todos.filter((m) => !m.ga || m.ga === "Sem GA / A Definir" || m.ga === "Aguardando GA").length;
  const ausentes = todos.filter((m) => m.status === "Ausente" || m.faltas >= 2).length;
  const batizados = todos.filter((m) => m.batizado).length;
  const umComDeus = todos.filter((m) => m.umComDeus).length;
  const freqs = todos.map(frequencia);
  const comDados = freqs.filter((f) => f.pct !== null);
  const presencaMedia = comDados.length ? Math.round(comDados.reduce((a, f) => a + (f.pct as number), 0) / comDados.length) : null;

  const contarPor = (chave: (m: MembroP) => string) => {
    const mapa = new Map<string, number>();
    todos.forEach((m) => mapa.set(chave(m), (mapa.get(chave(m)) || 0) + 1));
    return Array.from(mapa.entries()).sort((x, y) => y[1] - x[1]).map(([rotulo, valor]) => ({ rotulo, valor }));
  };
  const porSituacao = contarPor((m) => m.status).map((i) => ({
    ...i,
    cor: i.rotulo === "Ativo" ? "bg-teal-600" : i.rotulo === "Ausente" ? "bg-rose-500" : i.rotulo === "Esporádico" ? "bg-amber-500" : "bg-indigo-500"
  }));
  const porGa = contarPor((m) => m.ga || "Sem G.A");
  const porLider = contarPor((m) => nomeDoLider(lideres, m.liderId));

  const resumo = (rotulo: string, valor: string | number, detalhe: string) => (
    <div className={`${cardClasse} p-3.5 space-y-1`}>
      <span className="text-[0.5625rem] font-black uppercase tracking-wider text-gray-400">{rotulo}</span>
      <span className="block text-2xl font-bold text-slate-950 dark:text-white leading-none">{valor}</span>
      <span className="block text-[0.5625rem] text-gray-500 dark:text-zinc-400">{detalhe}</span>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
      <Cabecalho
        icone={<Sparkles className="w-5 h-5 text-teal-700 dark:text-teal-400" />}
        titulo="Transição J1"
        subtitulo={`${todos.length} ${todos.length === 1 ? "membro marcado" : "membros marcados"} como jovem em transição`}
      />

      <div className="inline-flex self-start bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-xl p-1 gap-1">
        {([["lista", "Lista"], ["relatorio", "Relatório"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`px-4 py-1.5 rounded-lg text-[0.6563rem] font-extrabold uppercase tracking-wider transition cursor-pointer ${
              aba === id ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <EstadoCarga loading={loading} erro={erro} onRecarregar={recarregar} />

      {!loading && !erro && aba === "lista" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_16rem] gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou líder..." className={`${campoClasse} pl-9 rounded-2xl`} />
            </div>
            <select value={liderFiltro} onChange={(e) => setLiderFiltro(e.target.value)} aria-label="Filtrar por líder" className={`${campoClasse} rounded-2xl cursor-pointer`}>
              <option value="todos">Todos os líderes</option>
              {lideres.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </div>

          {lista.length === 0 ? (
            <div className={`${cardClasse} py-12 text-center text-xs text-gray-400`}>Nenhum membro em transição encontrado.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3 pb-6">
              {lista.map((m) => {
                const f = frequencia(m);
                const idade = idadeDe(m.aniversario);
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelecionadoId(m.id)}
                    className={`${cardClasse} p-3.5 text-left flex items-center gap-3 hover:border-teal-500 transition cursor-pointer`}
                  >
                    <div className="w-11 h-11 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">{iniciais(m.nome)}</div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.nome}</h4>
                      <p className="text-[0.625rem] text-gray-500 dark:text-zinc-400 truncate">
                        {nomeDoLider(lideres, m.liderId)}{idade !== null ? ` · ${idade} anos` : ""}{m.dataEntrada ? ` · admissão ${formatarData(m.dataEntrada)}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-xs font-black text-teal-700 dark:text-teal-400">{f.pct === null ? "—" : `${f.pct}%`}</span>
                      <span className="block text-[0.5rem] uppercase text-gray-400">presença</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {!loading && !erro && aba === "relatorio" && (
        <div className="space-y-5 pb-6">
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {resumo("Em transição", todos.length, "membros marcados")}
            {resumo("Presença média", presencaMedia === null ? "—" : `${presencaMedia}%`, "últimas 8 reuniões")}
            {resumo("Ausentes", ausentes, "com 2+ faltas")}
            {resumo("Sem G.A", semGa, "grupo não definido")}
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
            <CardGrafico titulo="Situação de presença">
              {todos.length === 0 ? <p className="text-xs text-gray-400 italic">Sem dados.</p> : <BarrasHorizontais itens={porSituacao} />}
            </CardGrafico>

            <CardGrafico titulo="Vida na igreja">
              <div className="space-y-4">
                <div>
                  <p className="text-[0.625rem] font-bold uppercase text-gray-400 mb-1.5">Batizados</p>
                  <Proporcao a={batizados} b={todos.length - batizados} rotuloA="Batizados" rotuloB="Não batizados" />
                </div>
                <div>
                  <p className="text-[0.625rem] font-bold uppercase text-gray-400 mb-1.5">Um com Deus</p>
                  <Proporcao a={umComDeus} b={todos.length - umComDeus} rotuloA="Com Um com Deus" rotuloB="Sem" />
                </div>
              </div>
            </CardGrafico>

            <CardGrafico titulo="Por G.A">
              {todos.length === 0 ? <p className="text-xs text-gray-400 italic">Sem dados.</p> : <BarrasHorizontais itens={porGa} />}
            </CardGrafico>

            <CardGrafico titulo="Por líder">
              {todos.length === 0 ? <p className="text-xs text-gray-400 italic">Sem dados.</p> : <BarrasHorizontais itens={porLider} />}
            </CardGrafico>
          </div>

          <section className={`${cardClasse} p-4 space-y-3`}>
            <h2 className="text-[0.6875rem] font-black uppercase tracking-widest text-gray-400">Situação de cada membro</h2>
            {todos.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-3">Nenhum membro em transição.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[40rem]">
                  <thead>
                    <tr className="text-left text-[0.5625rem] uppercase tracking-wider text-gray-400">
                      <th className="py-1.5 pr-3 font-black">Membro</th>
                      <th className="py-1.5 px-2 font-black">Líder / G.A</th>
                      <th className="py-1.5 px-2 font-black text-center">Situação</th>
                      <th className="py-1.5 px-2 font-black text-center">Presença</th>
                      <th className="py-1.5 px-2 font-black text-center">Faltas</th>
                      <th className="py-1.5 px-2 font-black text-center">Batizado</th>
                      <th className="py-1.5 pl-2 font-black text-center">Um com Deus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {todos.map((m) => {
                      const f = frequencia(m);
                      return (
                        <tr key={m.id} onClick={() => { setSelecionadoId(m.id); setAba("lista"); }} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                          <td className="py-2 pr-3 font-bold text-slate-900 dark:text-white">{m.nome}</td>
                          <td className="py-2 px-2 text-gray-500 dark:text-zinc-400">{nomeDoLider(lideres, m.liderId)}{m.ga ? ` · ${m.ga}` : ""}</td>
                          <td className="py-2 px-2 text-center">{m.status}</td>
                          <td className="py-2 px-2 text-center font-bold text-teal-700 dark:text-teal-400">{f.pct === null ? "—" : `${f.presentes}/${f.total} (${f.pct}%)`}</td>
                          <td className={`py-2 px-2 text-center font-bold ${m.faltas >= 2 ? "text-rose-600" : ""}`}>{m.faltas}</td>
                          <td className="py-2 px-2 text-center">{m.batizado ? "Sim" : "Não"}</td>
                          <td className="py-2 pl-2 text-center">{m.umComDeus ? "Sim" : "Não"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
