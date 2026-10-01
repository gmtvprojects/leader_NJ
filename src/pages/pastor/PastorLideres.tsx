import React, { useState } from "react";
import { UserCog, ArrowLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useDadosPastor } from "./pastorUtils";
import PastorLiderDetalhe from "./PastorLiderDetalhe";
import { Cabecalho, EstadoCarga, BotaoFlutuante, campoClasse, cardClasse } from "./PastorUi";

export default function PastorLideres() {
  const { dados, loading, erro, recarregar } = useDadosPastor();
  const { lideres, membros } = dados;
  const [liderSelecionadoId, setLiderSelecionadoId] = useState<string | null>(null);
  const [view, setView] = useState<"lista" | "novo">("lista");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erroForm, setErroForm] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [grupo, setGrupo] = useState("");
  const [celular, setCelular] = useState("");

  const abrirNovo = () => {
    setNome(""); setEmail(""); setSenha(""); setGrupo(""); setCelular(""); setErroForm("");
    setView("novo");
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErroForm("");
    const { error } = await api.pastor.cadastrarLider({
      nome_lider: nome.trim(),
      email: email.trim(),
      senha,
      nome_grupo: grupo.trim(),
      celular: celular.trim()
    });
    setSalvando(false);
    if (error) {
      setErroForm(error.message);
      return;
    }
    setMensagem(`Líder cadastrado. Repasse a ${nome.trim()} o e-mail ${email.trim()} e a senha inicial definida.`);
    setView("lista");
    await recarregar();
  };

  const liderSelecionado = lideres.find((l) => l.id === liderSelecionadoId) || null;

  if (liderSelecionado) {
    return <PastorLiderDetalhe dados={dados} lider={liderSelecionado} onVoltar={() => setLiderSelecionadoId(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
      {view === "novo" ? (
        <>
          <nav aria-label="Navegação" className="flex items-center gap-1.5 text-[0.6875rem] font-bold">
            <button type="button" onClick={() => setView("lista")} className="flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:underline cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /> Líderes
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-slate-900 dark:text-white">Novo Líder</span>
          </nav>

          <form onSubmit={salvar} className={`${cardClasse} p-5 space-y-4 w-full max-w-2xl`}>
            <p className="text-[0.6875rem] text-gray-500 dark:text-zinc-400 leading-relaxed">
              Cadastro inicial: o líder entra com o e-mail e a senha inicial abaixo e depois completa o próprio perfil.
            </p>

            <div className="space-y-1">
              <label htmlFor="ld-nome" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">Nome do líder *</label>
              <input id="ld-nome" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex. Samuel Santos" className={campoClasse} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="ld-email" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">E-mail de acesso *</label>
                <input id="ld-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="lider@exemplo.com" className={campoClasse} />
              </div>
              <div className="space-y-1">
                <label htmlFor="ld-senha" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">Senha inicial *</label>
                <input id="ld-senha" type="text" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" className={campoClasse} />
              </div>
              <div className="space-y-1">
                <label htmlFor="ld-grupo" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">Nome do GA</label>
                <input id="ld-grupo" value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="Ex. GA Ebenezer" className={campoClasse} />
              </div>
              <div className="space-y-1">
                <label htmlFor="ld-celular" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">Celular</label>
                <input id="ld-celular" type="tel" value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="Ex. 11999998888" className={campoClasse} />
              </div>
            </div>

            {erroForm && <p className="text-xs font-semibold text-rose-600">{erroForm}</p>}

            <button
              type="submit"
              disabled={salvando}
              className="w-full h-11 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Cadastrar Líder
            </button>
          </form>
        </>
      ) : (
        <>
          <Cabecalho
            icone={<UserCog className="w-5 h-5 text-teal-700 dark:text-teal-400" />}
            titulo="Líderes"
            subtitulo={`${lideres.length} ${lideres.length === 1 ? "líder cadastrado" : "líderes cadastrados"}`}
          />

          {mensagem && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-3 rounded-2xl text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex justify-between gap-3">
              <span>{mensagem}</span>
              <button onClick={() => setMensagem("")} className="font-black cursor-pointer">×</button>
            </div>
          )}

          <EstadoCarga loading={loading} erro={erro} onRecarregar={recarregar} />

          {!loading && !erro && (
            <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3 pb-24">
              {lideres.length === 0 && (
                <div className={`lg:col-span-2 ${cardClasse} py-12 text-center text-xs text-gray-400`}>
                  Nenhum líder cadastrado. Use o botão + para cadastrar o primeiro.
                </div>
              )}

              {lideres.map((l) => {
                const total = membros.filter((m) => m.liderId === l.id).length;
                return (
                  <button
                    key={l.id}
                    onClick={() => setLiderSelecionadoId(l.id)}
                    className={`${cardClasse} border-l-4 border-l-teal-500 p-4 flex items-center justify-between gap-3 text-left hover:shadow-lg hover:scale-[1.01] transition cursor-pointer`}
                  >
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{l.nome}</h3>
                    <span className="shrink-0 flex items-center gap-1 text-[0.6875rem] font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-sm">
                      {total} {total === 1 ? "membro" : "membros"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <BotaoFlutuante onClick={abrirNovo} label="Cadastrar novo líder" />
        </>
      )}
    </div>
  );
}
