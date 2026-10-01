import React, { useCallback, useEffect, useState } from "react";
import { ScrollText, ArrowLeft, ChevronRight, Pencil, Trash2, Check, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { Cabecalho, EstadoCarga, BotaoFlutuante, campoClasse, cardClasse } from "./PastorUi";

interface Capitulo {
  id: string;
  ordem: number;
  titulo: string;
  texto: string;
  pontos: string[];
  ref: string;
  alerta: string;
}

const mapear = (c: any): Capitulo => ({
  id: c.id,
  ordem: c.ordem || 0,
  titulo: c.titulo || "",
  texto: c.texto || "",
  pontos: Array.isArray(c.pontos) ? c.pontos : [],
  ref: c.ref || "",
  alerta: c.alerta || ""
});

export default function PastorManual() {
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState<Capitulo | "novo" | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState("");

  const [ordem, setOrdem] = useState("");
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [pontos, setPontos] = useState("");
  const [ref, setRef] = useState("");
  const [alerta, setAlerta] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.manual.listar();
    if (error || !data) {
      setErro(error?.message || "Não foi possível carregar o manual.");
    } else {
      setErro("");
      setCapitulos(data.map(mapear));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrir = (c: Capitulo | "novo") => {
    setEditando(c);
    setErroForm("");
    if (c === "novo") {
      setOrdem(String((capitulos[capitulos.length - 1]?.ordem || 0) + 1));
      setTitulo(""); setTexto(""); setPontos(""); setRef(""); setAlerta("");
    } else {
      setOrdem(String(c.ordem));
      setTitulo(c.titulo); setTexto(c.texto); setPontos(c.pontos.join("\n")); setRef(c.ref); setAlerta(c.alerta);
    }
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setSalvando(true);
    setErroForm("");
    const { error } = await api.pastor.salvarCapitulo(
      { ordem: parseInt(ordem, 10) || 0, titulo, texto, pontos: pontos.split("\n"), ref, alerta },
      editando === "novo" ? undefined : editando.id
    );
    setSalvando(false);
    if (error) {
      setErroForm(error.message);
      return;
    }
    setEditando(null);
    await carregar();
  };

  const excluir = async (c: Capitulo) => {
    if (!confirm(`Excluir o capítulo "${c.titulo}" do manual?`)) return;
    const { error } = await api.pastor.excluirCapitulo(c.id);
    if (error) {
      alert(error.message);
      return;
    }
    if (editando && editando !== "novo" && editando.id === c.id) setEditando(null);
    await carregar();
  };

  if (editando) {
    return (
      <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
        <nav aria-label="Navegação" className="flex items-center gap-1.5 text-[0.6875rem] font-bold">
          <button type="button" onClick={() => setEditando(null)} className="flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:underline cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> Manual
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-slate-900 dark:text-white">{editando === "novo" ? "Novo Capítulo" : "Editar Capítulo"}</span>
        </nav>

        <form onSubmit={salvar} className={`${cardClasse} p-5 space-y-4 w-full max-w-3xl`}>
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <div className="space-y-1">
              <label htmlFor="cap-ordem" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">Nº</label>
              <input id="cap-ordem" type="number" min={1} value={ordem} onChange={(e) => setOrdem(e.target.value)} className={campoClasse} />
            </div>
            <div className="space-y-1">
              <label htmlFor="cap-titulo" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">Título *</label>
              <input id="cap-titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex. Propósitos dos Grupos de Amigos" className={campoClasse} />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="cap-texto" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">Texto</label>
            <textarea id="cap-texto" rows={5} value={texto} onChange={(e) => setTexto(e.target.value)} className={`${campoClasse} resize-y leading-relaxed`} />
          </div>

          <div className="space-y-1">
            <label htmlFor="cap-pontos" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">Pontos (um por linha)</label>
            <textarea id="cap-pontos" rows={7} value={pontos} onChange={(e) => setPontos(e.target.value)} className={`${campoClasse} resize-y leading-relaxed`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="cap-ref" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">Referência bíblica</label>
              <input id="cap-ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Ex. 1 João 3:16 • Atos 2:42" className={campoClasse} />
            </div>
            <div className="space-y-1">
              <label htmlFor="cap-alerta" className="block text-[0.625rem] font-black text-gray-400 uppercase tracking-widest">Alerta / destaque</label>
              <input id="cap-alerta" value={alerta} onChange={(e) => setAlerta(e.target.value)} className={campoClasse} />
            </div>
          </div>

          {erroForm && <p className="text-xs font-semibold text-rose-600">{erroForm}</p>}

          <div className="flex gap-2">
            {editando !== "novo" && (
              <button type="button" onClick={() => excluir(editando)} className="h-11 px-4 bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            )}
            <button type="submit" disabled={salvando} className="flex-1 h-11 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60">
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar Capítulo
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-4 px-4 py-4 animate-fadeIn text-left font-sans">
      <Cabecalho
        icone={<ScrollText className="w-5 h-5 text-teal-700 dark:text-teal-400" />}
        titulo="Manual de Liderança"
        subtitulo={`${capitulos.length} capítulos · edite, adicione ou exclua`}
      />

      <EstadoCarga loading={loading} erro={erro} onRecarregar={carregar} />

      {!loading && !erro && (
        <div className="space-y-2.5 pb-24">
          {capitulos.length === 0 && <div className={`${cardClasse} py-12 text-center text-xs text-gray-400`}>Nenhum capítulo. Use o botão + para criar o primeiro.</div>}

          {capitulos.map((c) => (
            <div key={c.id} className={`${cardClasse} border-l-4 border-l-indigo-500 p-4 flex items-start gap-3`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md shadow-indigo-600/30">{c.ordem}</div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">{c.titulo}</h3>
                {c.texto && <p className="text-[0.6875rem] text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{c.texto}</p>}
                <p className="text-[0.5625rem] font-bold uppercase text-gray-400">
                  {c.pontos.length} {c.pontos.length === 1 ? "ponto" : "pontos"}{c.ref ? ` · ${c.ref}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => abrir(c)} className="p-2 text-gray-400 hover:text-teal-600 cursor-pointer" aria-label="Editar capítulo">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => excluir(c)} className="p-2 text-gray-400 hover:text-rose-500 cursor-pointer" aria-label="Excluir capítulo">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BotaoFlutuante onClick={() => abrir("novo")} label="Novo capítulo" />
    </div>
  );
}
