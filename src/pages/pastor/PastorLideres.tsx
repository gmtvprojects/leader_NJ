import React, { useState } from "react";
import { UserCog, ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Phone, MessageCircle, Check, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useDadosPastor, formatarData } from "./pastorUtils";
import { Cabecalho, EstadoCarga, BotaoFlutuante, campoClasse, cardClasse } from "./PastorUi";

const limparFone = (f: string) => f.replace(/\D/g, "");
const linkWhatsapp = (f: string) => {
  const n = limparFone(f);
  return n ? `https://wa.me/${n.length <= 11 ? "55" + n : n}` : "";
};

export default function PastorLideres() {
  const { dados, loading, erro, recarregar } = useDadosPastor();
  const { lideres, membros, reunioes } = dados;
  const [view, setView] = useState<"lista" | "novo">("lista");
  const [abertos, setAbertos] = useState<string[]>([]);
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

  const alternar = (id: string) => setAbertos((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

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
                const ms = membros.filter((m) => m.liderId === l.id);
                const rs = reunioes.filter((r) => r.liderId === l.id);
                const ultima = rs[0];
                const aberto = abertos.includes(l.id);
                const wa = linkWhatsapp(l.celular);

                return (
                  <div key={l.id} className={`${cardClasse} p-4 space-y-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{l.nome}</h3>
                        <p className="text-[0.6875rem] text-teal-700 dark:text-teal-400 font-bold truncate">{l.nomeGrupo || "GA sem nome"}</p>
                        <p className="text-[0.625rem] text-gray-400 truncate">{l.email}</p>
                      </div>
                      {l.celular && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a href={`tel:${limparFone(l.celular)}`} className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-lg" aria-label="Ligar">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          {wa && (
                            <a href={wa} target="_blank" rel="noreferrer" className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg" aria-label="WhatsApp">
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl py-2">
                        <span className="block text-lg font-bold text-slate-900 dark:text-white leading-none">{ms.length}</span>
                        <span className="text-[0.5rem] uppercase font-black text-gray-400">Membros</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl py-2">
                        <span className="block text-lg font-bold text-slate-900 dark:text-white leading-none">{rs.length}</span>
                        <span className="text-[0.5rem] uppercase font-black text-gray-400">Reuniões</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl py-2">
                        <span className="block text-[0.6875rem] font-bold text-slate-900 dark:text-white leading-none pt-1">{ultima ? formatarData(ultima.data) : "—"}</span>
                        <span className="text-[0.5rem] uppercase font-black text-gray-400">Última reunião</span>
                      </div>
                    </div>

                    <button
                      onClick={() => alternar(l.id)}
                      className="w-full flex items-center justify-between text-[0.625rem] font-extrabold uppercase text-teal-700 dark:text-teal-400 cursor-pointer"
                    >
                      <span>{aberto ? "Ocultar membros" : "Ver membros"}</span>
                      {aberto ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {aberto && (
                      <div className="flex flex-wrap gap-1 animate-fadeIn">
                        {ms.length === 0 ? (
                          <p className="text-[0.6875rem] text-gray-400 italic">Nenhum membro cadastrado.</p>
                        ) : (
                          ms.map((m) => (
                            <span key={m.id} className="bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-400 border border-teal-200/50 dark:border-teal-900/40 text-[0.625rem] font-bold px-2 py-0.5 rounded-lg">
                              {m.nome}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>
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
