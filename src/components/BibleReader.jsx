import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Copy,
  Check,
  Search,
  Type,
  Maximize2,
  Minimize2,
  X,
  AlertCircle
} from "lucide-react";
import { CODIGO_VERSO_CHAVE, VERSICULOS_POPULARES } from "../data/bibliaData";

// CONFIGURAÇÃO DE BÍBLIAS SÓ EM PORTUGUÊS (TRADUÇÕES OFICIAIS E REAIS)
export const BIBLES_CONFIG = {
  "pt_almeida": { 
    id: "almeida", 
    name: "Almeida Revista e Corrigida", 
    abbrev: "Almeida", 
    lang: "por", 
    isExternal: true, 
    info: "Versão clássica de João Ferreira de Almeida (Completa: VT e NT)" 
  },
  "pt_blt": { 
    id: "pt-BR-blt", 
    name: "Bíblia Livre para Todos", 
    abbrev: "BLT", 
    lang: "por", 
    isExternal: false, 
    info: "Versão moderna livre de direitos autorais (apenas NT)" 
  }
};

// MAPEAMENTO COMPACTO E COMPLETO DOS 66 LIVROS DA BÍBLIA
export const ALL_BOOKS = [
  // Antigo Testamento (VT)
  { pt: "Gênesis", enSlug: "genesis", ptSlug: "gênesis", esSlug: "génesis", chapters: 50, testamento: "VT" },
  { pt: "Êxodo", enSlug: "exodus", ptSlug: "êxodo", esSlug: "éxodo", chapters: 40, testamento: "VT" },
  { pt: "Levítico", enSlug: "leviticus", ptSlug: "levítico", esSlug: "levítico", chapters: 27, testamento: "VT" },
  { pt: "Números", enSlug: "numbers", ptSlug: "números", esSlug: "números", chapters: 36, testamento: "VT" },
  { pt: "Deuteronômio", enSlug: "deuteronomy", ptSlug: "deuteronômio", esSlug: "deuteronomio", chapters: 34, testamento: "VT" },
  { pt: "Josué", enSlug: "joshua", ptSlug: "josué", esSlug: "josué", chapters: 24, testamento: "VT" },
  { pt: "Juízes", enSlug: "judges", ptSlug: "juízes", esSlug: "jueces", chapters: 21, testamento: "VT" },
  { pt: "Rute", enSlug: "ruth", ptSlug: "rute", esSlug: "rut", chapters: 4, testamento: "VT" },
  { pt: "1 Samuel", enSlug: "1samuel", ptSlug: "1samuel", esSlug: "1samuel", chapters: 31, testamento: "VT" },
  { pt: "2 Samuel", enSlug: "2samuel", ptSlug: "2samuel", esSlug: "2samuel", chapters: 24, testamento: "VT" },
  { pt: "1 Reis", enSlug: "1kings", ptSlug: "1reis", esSlug: "1reyes", chapters: 22, testamento: "VT" },
  { pt: "2 Reis", enSlug: "2kings", ptSlug: "2reis", esSlug: "2reyes", chapters: 25, testamento: "VT" },
  { pt: "1 Crônicas", enSlug: "1chronicles", ptSlug: "1crônicas", esSlug: "1crónicas", chapters: 29, testamento: "VT" },
  { pt: "2 Crônicas", enSlug: "2chronicles", ptSlug: "2crônicas", esSlug: "2crónicas", chapters: 36, testamento: "VT" },
  { pt: "Esdras", enSlug: "ezra", ptSlug: "esdras", esSlug: "esdras", chapters: 10, testamento: "VT" },
  { pt: "Neemias", enSlug: "nehemiah", ptSlug: "neemias", esSlug: "nehemías", chapters: 13, testamento: "VT" },
  { pt: "Ester", enSlug: "esther", ptSlug: "ester", esSlug: "ester", chapters: 10, testamento: "VT" },
  { pt: "Jó", enSlug: "job", ptSlug: "jó", esSlug: "job", chapters: 42, testamento: "VT" },
  { pt: "Salmos", enSlug: "psalms", ptSlug: "salmos", esSlug: "salmos", chapters: 150, testamento: "VT" },
  { pt: "Provérbios", enSlug: "proverbs", ptSlug: "provérbios", esSlug: "proverbios", chapters: 31, testamento: "VT" },
  { pt: "Eclesiastes", enSlug: "ecclesiastes", ptSlug: "eclesiastes", esSlug: "eclesiastes", chapters: 12, testamento: "VT" },
  { pt: "Cânticos", enSlug: "songofsolomon", ptSlug: "cânticos", esSlug: "cantares", chapters: 8, testamento: "VT" },
  { pt: "Isaías", enSlug: "isaiah", ptSlug: "isaías", esSlug: "isaías", chapters: 66, testamento: "VT" },
  { pt: "Jeremias", enSlug: "jeremiah", ptSlug: "jeremias", esSlug: "jeremías", chapters: 52, testamento: "VT" },
  { pt: "Lamentações", enSlug: "lamentations", ptSlug: "lamentações", esSlug: "lamentaciones", chapters: 5, testamento: "VT" },
  { pt: "Ezequiel", enSlug: "ezekiel", ptSlug: "ezequiel", esSlug: "ezequiel", chapters: 48, testamento: "VT" },
  { pt: "Daniel", enSlug: "daniel", ptSlug: "daniel", esSlug: "daniel", chapters: 12, testamento: "VT" },
  { pt: "Oseias", enSlug: "hosea", ptSlug: "oseias", esSlug: "oseas", chapters: 14, testamento: "VT" },
  { pt: "Joel", enSlug: "joel", ptSlug: "joel", esSlug: "joel", chapters: 3, testamento: "VT" },
  { pt: "Amós", enSlug: "amos", ptSlug: "amós", esSlug: "amós", chapters: 9, testamento: "VT" },
  { pt: "Obadias", enSlug: "obadiah", ptSlug: "obadias", esSlug: "abdías", chapters: 1, testamento: "VT" },
  { pt: "Jonas", enSlug: "jonah", ptSlug: "jonas", esSlug: "jonás", chapters: 4, testamento: "VT" },
  { pt: "Miqueias", enSlug: "micah", ptSlug: "miqueias", esSlug: "miqueas", chapters: 7, testamento: "VT" },
  { pt: "Naum", enSlug: "nahum", ptSlug: "naum", esSlug: "nahúm", chapters: 3, testamento: "VT" },
  { pt: "Habacuque", enSlug: "habakkuk", ptSlug: "habacuque", esSlug: "habacuc", chapters: 3, testamento: "VT" },
  { pt: "Sofonias", enSlug: "zephaniah", ptSlug: "sofonias", esSlug: "sofonías", chapters: 3, testamento: "VT" },
  { pt: "Ageu", enSlug: "haggai", ptSlug: "ageu", esSlug: "hageo", chapters: 2, testamento: "VT" },
  { pt: "Zacarias", enSlug: "zechariah", ptSlug: "zacarias", esSlug: "zacarías", chapters: 14, testamento: "VT" },
  { pt: "Malaquias", enSlug: "malachi", ptSlug: "malaquias", esSlug: "malaquías", chapters: 4, testamento: "VT" },

  // Novo Testamento (NT)
  { pt: "Mateus", enSlug: "matthew", ptSlug: "mateus", esSlug: "sanmateo", chapters: 28, testamento: "NT" },
  { pt: "Marcos", enSlug: "mark", ptSlug: "marcos", esSlug: "sanmarcos", chapters: 16, testamento: "NT" },
  { pt: "Lucas", enSlug: "luke", ptSlug: "lucas", esSlug: "sanlucas", chapters: 24, testamento: "NT" },
  { pt: "João", enSlug: "john", ptSlug: "joão", esSlug: "sanjuan", chapters: 21, testamento: "NT" },
  { pt: "Atos", enSlug: "acts", ptSlug: "atos", esSlug: "hechos", chapters: 28, testamento: "NT" },
  { pt: "Romanos", enSlug: "romans", ptSlug: "romanos", esSlug: "romanos", chapters: 16, testamento: "NT" },
  { pt: "1 Coríntios", enSlug: "1corinthians", ptSlug: "1coríntios", esSlug: "1corintios", chapters: 16, testamento: "NT" },
  { pt: "2 Coríntios", enSlug: "2corinthians", ptSlug: "2coríntios", esSlug: "2corintios", chapters: 13, testamento: "NT" },
  { pt: "Gálatas", enSlug: "galatians", ptSlug: "gálatas", esSlug: "gálatas", chapters: 6, testamento: "NT" },
  { pt: "Efésios", enSlug: "ephesians", ptSlug: "efésios", esSlug: "efesios", chapters: 6, testamento: "NT" },
  { pt: "Filipenses", enSlug: "philippians", ptSlug: "filipenses", esSlug: "filipenses", chapters: 4, testamento: "NT" },
  { pt: "Colossenses", enSlug: "colossians", ptSlug: "colossenses", esSlug: "colosenses", chapters: 4, testamento: "NT" },
  { pt: "1 Tessalonicenses", enSlug: "1thessalonians", ptSlug: "1tessalonicenses", esSlug: "1tesalonicenses", chapters: 5, testamento: "NT" },
  { pt: "2 Tessalonicenses", enSlug: "2thessalonians", ptSlug: "2tessalonicenses", esSlug: "2tesalonicenses", chapters: 3, testamento: "NT" },
  { pt: "1 Timóteo", enSlug: "1timothy", ptSlug: "1timóteo", esSlug: "1timoteo", chapters: 6, testamento: "NT" },
  { pt: "2 Timóteo", enSlug: "2timothy", ptSlug: "2timóteo", esSlug: "2timoteo", chapters: 4, testamento: "NT" },
  { pt: "Tito", enSlug: "titus", ptSlug: "tito", esSlug: "tito", chapters: 3, testamento: "NT" },
  { pt: "Filemom", enSlug: "philemon", ptSlug: "filemom", esSlug: "filemón", chapters: 1, testamento: "NT" },
  { pt: "Hebreus", enSlug: "hebrews", ptSlug: "hebreus", esSlug: "hebreos", chapters: 13, testamento: "NT" },
  { pt: "Tiago", enSlug: "james", ptSlug: "tiago", esSlug: "santiago", chapters: 5, testamento: "NT" },
  { pt: "1 Pedro", enSlug: "1peter", ptSlug: "1pedro", esSlug: "1pedro", chapters: 5, testamento: "NT" },
  { pt: "2 Pedro", enSlug: "2peter", ptSlug: "2pedro", esSlug: "2pedro", chapters: 3, testamento: "NT" },
  { pt: "1 João", enSlug: "1john", ptSlug: "1joão", esSlug: "1juan", chapters: 5, testamento: "NT" },
  { pt: "2 João", enSlug: "2john", ptSlug: "2joão", esSlug: "2juan", chapters: 1, testamento: "NT" },
  { pt: "3 João", enSlug: "3john", ptSlug: "3joão", esSlug: "3juan", chapters: 1, testamento: "NT" },
  { pt: "Judas", enSlug: "jude", ptSlug: "judas", esSlug: "judas", chapters: 1, testamento: "NT" },
  { pt: "Apocalipse", enSlug: "revelation", ptSlug: "apocalipse", esSlug: "apocalipsis", chapters: 22, testamento: "NT" }
];

// ABREVIAÇÕES DE LIVROS DA BÍBLIA PARA PARSER AUTOMÁTICO DE LINKS
const APELIDOS_LIVROS = {
  "1joao": "1 João",
  "1joão": "1 João",
  "1 joao": "1 João",
  "1 joão": "1 João",
  "atos": "Atos",
  "hebreus": "Hebreus",
  "heb": "Hebreus",
  "1timoteo": "1 Timóteo",
  "1timóteo": "1 Timóteo",
  "1 timoteo": "1 Timóteo",
  "1 timóteo": "1 Timóteo",
  "1corintios": "1 Coríntios",
  "1coríntios": "1 Coríntios",
  "1 corintios": "1 Coríntios",
  "1 coríntios": "1 Coríntios",
  "1co": "1 Coríntios",
  "1 co": "1 Coríntios",
  "efesios": "Efésios",
  "efésios": "Efésios",
  "ef": "Efésios",
  "ef.": "Efésios",
  "filipenses": "Filipenses",
  "fl": "Filipenses",
  "fp": "Filipenses",
  "fp.": "Filipenses",
  "genesis": "Gênesis",
  "gênesis": "Gênesis",
  "exodo": "Êxodo",
  "êxodo": "Êxodo",
  "salmos": "Salmos",
  "sl": "Salmos",
  "provérbios": "Provérbios",
  "proverbios": "Provérbios",
  "pv": "Provérbios",
  "mateus": "Mateus",
  "mt": "Mateus",
  "lucas": "Lucas",
  "lc": "Lucas",
  "marcos": "Marcos",
  "mc": "Marcos",
  "joao": "João",
  "joão": "João",
  "romanos": "Romanos",
  "rm": "Romanos",
  "apocalipse": "Apocalipse",
  "ap": "Apocalipse"
};

// Função para obter outras traduções do manual para visualização comparativa automática
const getOtherVersionsStatus = (bookPt, ch, verseNum) => {
  if (!bookPt) return null;
  const bookClean = bookPt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
  
  const keyDirect = `${bookClean}-${ch}-${verseNum}`;
  
  if (CODIGO_VERSO_CHAVE && CODIGO_VERSO_CHAVE[keyDirect]) {
    return CODIGO_VERSO_CHAVE[keyDirect];
  }
  if (VERSICULOS_POPULARES && VERSICULOS_POPULARES[keyDirect]) {
    return VERSICULOS_POPULARES[keyDirect];
  }

  // Caso especial: 1 Timóteo 3:1-3
  if (bookClean === "1timoteo" && ch === 3 && (verseNum === 1 || verseNum === 2 || verseNum === 3)) {
    return CODIGO_VERSO_CHAVE["1timoteo-3-1-3"];
  }

  return null;
};

export default function BibleReader({ onClose, initialReference = null }) {
  // CONFIGURAÇÃO DE TRADUÇÃO ATIVA (SALVA NO LOCALSTORAGE LOCAL-FIRST)
  const [translationKey, setTranslationKey] = useState(() => {
    return localStorage.getItem("ga_bible_versao") || "pt_almeida";
  });

  // IDENTIFICAR SE O LIVRO INICIAL FOI SELECIONADO
  const getInitialBookAndChapter = () => {
    if (initialReference) {
      // Simplificado: Ex: "1 João 3:16" ou "Atos 2:42" ou "1 Co. 6:18"
      const cleaned = initialReference.toLowerCase().trim();
      
      // Encontrar se começa ou contêm algum apelido
      let matchedBookName = "1 João"; // Padrão
      let matchedChapter = 1;
      let matchedVerse = null;

      // Expressão regular para achar Livro de forma genérica
      // Ex: "1 joao 3:16" -> livro="1 joao", capitulo="3", versiculo="16"
      const matchRegex = /^([1-3]\s*[a-zA-Z\u00C0-\u017F\s\.]+?|[a-zA-Z\u00C0-\u017F\s\.]+?)\s+([0-9]+)(?:\s*:\s*([0-9]+))?$/;
      const parsed = cleaned.match(matchRegex);

      if (parsed) {
        const bookPart = parsed[1].trim();
        matchedChapter = Number(parsed[2]);
        if (parsed[3]) {
          matchedVerse = Number(parsed[3]);
        }

        // Buscar nas chaves de apelidos
        const resolvedName = APELIDOS_LIVROS[bookPart] || APELIDOS_LIVROS[bookPart.replace(/\./g, "")];
        if (resolvedName) {
          matchedBookName = resolvedName;
        } else {
          // Busca próxima
          const found = ALL_BOOKS.find(b => b.pt.toLowerCase().includes(bookPart) || b.enSlug.toLowerCase().includes(bookPart));
          if (found) matchedBookName = found.pt;
        }
      }

      const bookObj = ALL_BOOKS.find(b => b.pt === matchedBookName) || ALL_BOOKS[0];
      return {
        book: bookObj,
        chapter: Math.min(matchedChapter, bookObj.chapters),
        verse: matchedVerse
      };
    }

    // Caso contrário, carregar do localStorage ou padrão
    const savedBookPtName = localStorage.getItem("ga_bible_livro") || "1 João";
    const savedChapter = Number(localStorage.getItem("ga_bible_capitulo") || "1");
    const foundBook = ALL_BOOKS.find(b => b.pt === savedBookPtName) || ALL_BOOKS.find(b => b.pt === "1 João") || ALL_BOOKS[0];

    return {
      book: foundBook,
      chapter: savedChapter,
      verse: null
    };
  };

  const initialSetup = getInitialBookAndChapter();

  const [selectedBook, setSelectedBook] = useState(initialSetup.book);
  const [chapter, setChapter] = useState(initialSetup.chapter);
  const [highlightedVerse, setHighlightedVerse] = useState(initialSetup.verse);

  // Estados dinâmicos
  const [verses, setVerses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [fontSize, setFontSize] = useState(() => {
    return Number(localStorage.getItem("ga_bible_font_size") || "14");
  });
  const [selectedVerses, setSelectedVerses] = useState([]);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const containerRef = useRef(null);
  const topRef = useRef(null);

  // Persistir alterações da Bíblia
  useEffect(() => {
    localStorage.setItem("ga_bible_versao", translationKey);
    localStorage.setItem("ga_bible_livro", selectedBook.pt);
    localStorage.setItem("ga_bible_capitulo", chapter.toString());
  }, [translationKey, selectedBook, chapter]);

  useEffect(() => {
    localStorage.setItem("ga_bible_font_size", fontSize.toString());
  }, [fontSize]);

  // Se initialReference mudar, force o reposicionamento
  useEffect(() => {
    if (initialReference) {
      const setup = getInitialBookAndChapter();
      setSelectedBook(setup.book);
      setChapter(setup.chapter);
      setHighlightedVerse(setup.verse);
      if (setup.verse) {
        setSelectedVerses([setup.verse]);
      }
    }
  }, [initialReference]);

  // CARREGAR VERSÍCULOS DINAMICAMENTE EM PORTUGUÊS COMPATÍVEL
  useEffect(() => {
    let active = true;

    const fetchVerses = async () => {
      setIsLoading(true);
      setErrorMsg("");
      setVerses([]);

      const activeConfig = BIBLES_CONFIG[translationKey] || BIBLES_CONFIG["pt_almeida"];
      
      try {
        if (activeConfig.isExternal) {
          // Busca da API bible-api.com para Versão Almeida (Completa: Velho e Novo Testamento)
          const url = `https://bible-api.com/${encodeURIComponent(selectedBook.pt)}+${chapter}?translation=almeida`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Status ${response.status}`);
          }
          const parsedData = await response.json();
          
          if (active) {
            if (parsedData && Array.isArray(parsedData.verses)) {
              const formatted = parsedData.verses.map(v => ({
                book: v.book_name,
                chapter: v.chapter.toString(),
                verse: v.verse.toString(),
                text: v.text.trim()
              }));
              setVerses(formatted);
            } else {
              throw new Error("Formato inválido retornado pela API");
            }
          }
        } else {
          // Busca de wldeh CDN / jsDelivr para Versão BLT (Novo Testamento apenas)
          const bookSlug = selectedBook.ptSlug;
          const url = `https://cdn.jsdelivr.net/gh/wldeh/bible-api@main/bibles/${activeConfig.id}/books/${encodeURIComponent(bookSlug)}/chapters/${chapter}.json`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Status ${response.status}`);
          }
          const parsedData = await response.json();
          
          if (active) {
            if (parsedData && Array.isArray(parsedData.data)) {
              const formatted = parsedData.data.map(v => ({
                book: v.book,
                chapter: v.chapter,
                verse: v.verse,
                text: v.text.trim()
              }));
              setVerses(formatted);
            } else {
              throw new Error("Formato inválido retornado pelo CDN");
            }
          }
        }
      } catch (err) {
        if (active) {
          console.error("Falha ao carregar Bíblia:", err);
          
          if (!activeConfig.isExternal && selectedBook.testamento === "VT") {
            setErrorMsg("not_in_blt");
          } else {
            setErrorMsg(`Erro ao acessar o servidor da Bíblia (${err.message}). Por favor, verifique sua conexão com a de internet.`);
          }
        }
      } finally {
        if (active) {
          setIsLoading(false);
          if (containerRef.current) {
            containerRef.current.scrollTop = 0;
          }
        }
      }
    };

    fetchVerses();

    return () => {
      active = false;
    };
  }, [translationKey, selectedBook, chapter]);

  // Rolagem para o versículo grifado/inicial se houver
  useEffect(() => {
    if (!isLoading && verses.length > 0 && highlightedVerse) {
      setTimeout(() => {
        const targetEl = document.getElementById(`verse-${highlightedVerse}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          // piscar visualmente
          targetEl.classList.add("bg-teal-100/50", "dark:bg-teal-900/30");
          setTimeout(() => {
            targetEl.classList.remove("bg-teal-100/50", "dark:bg-teal-900/30");
          }, 3000);
        }
      }, 500);
    }
  }, [isLoading, verses, highlightedVerse]);

  // Tratamento de passar capítulos
  const changeChapterIdx = (offset) => {
    const currentBookIdx = ALL_BOOKS.findIndex(b => b.pt === selectedBook.pt);
    let newChapter = chapter + offset;

    if (newChapter <= 0) {
      // Ir para o livro anterior, último capítulo
      const prevBookIdx = currentBookIdx - 1;
      if (prevBookIdx >= 0) {
        const prevBook = ALL_BOOKS[prevBookIdx];
        setSelectedBook(prevBook);
        setChapter(prevBook.chapters);
        setHighlightedVerse(null);
        setSelectedVerses([]);
      }
    } else if (newChapter > selectedBook.chapters) {
      // Ir para o próximo livro, primeiro capítulo
      const nextBookIdx = currentBookIdx + 1;
      if (nextBookIdx < ALL_BOOKS.length) {
        setSelectedBook(ALL_BOOKS[nextBookIdx]);
        setChapter(1);
        setHighlightedVerse(null);
        setSelectedVerses([]);
      }
    } else {
      setChapter(newChapter);
      setHighlightedVerse(null);
      setSelectedVerses([]);
    }
  };

  // Alternar seleção do versículo individual (para múltiplos grifos e cópia)
  const toggleVerseSelection = (verseNum) => {
    setSelectedVerses(prev => {
      if (prev.includes(verseNum)) {
        return prev.filter(v => v !== verseNum);
      } else {
        return [...prev, verseNum].sort((a,b) => a - b);
      }
    });
  };

  // Copiar versículos selecionados para o Clipboard
  const copySelectedVerses = () => {
    if (selectedVerses.length === 0) return;

    const activeConfig = BIBLES_CONFIG[translationKey] || BIBLES_CONFIG["pt_almeida"];
    const matchedVerses = verses.filter(v => selectedVerses.includes(Number(v.verse)));
    
    // Formatar texto bonitinho
    const content = matchedVerses.map(v => `[${v.verse}] ${v.text}`).join("\n");
    const citation = `\n— ${selectedBook.pt} ${chapter}:${selectedVerses.join(",")} (${activeConfig.name})`;
    const fullText = content + citation;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => {
        setCopiedSuccess(false);
        setSelectedVerses([]); // Desmarcar
      }, 2000);
    });
  };

  // Alternador rápido para Almeida em caso de erro 404 de livro do VT em português
  const handleFallbackToAlmeida = () => {
    setTranslationKey("pt_almeida");
    setErrorMsg("");
  };

  // Filtro de Versículos do capítulo atual
  const filteredVerses = verses.filter(v => {
    if (!searchFilter.trim()) return true;
    return v.text.toLowerCase().includes(searchFilter.toLowerCase());
  });

  return (
    <div className="absolute inset-0 bg-white dark:bg-[#121212] flex flex-col z-40 transition-colors duration-200 text-slate-800 dark:text-slate-100">
      {/* HEADER DA BÍBLIA */}
      <header ref={topRef} className="px-4 py-3 bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-150/60 dark:bg-zinc-800/80 hover:bg-neutral-200 dark:hover:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
          aria-label="Voltar para a trilha"
        >
          <ChevronLeft className="w-4 h-4 shrink-0 text-slate-500" />
          <span>Voltar à Trilha</span>
        </button>

        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Bíblia Sagrada</span>
        </div>
      </header>

      {/* BARRA DE SELETOR - LINHA DUPLA INTELIGENTE */}
      <div className="px-3.5 py-2.5 bg-neutral-50 dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-zinc-800 shrink-0 space-y-2">
        {/* Linha 1: Seletores de Tradução e de Livro */}
        <div className="grid grid-cols-12 gap-2">
          {/* Seletor de Tradução */}
          <div className="col-span-6 relative">
            <select
              value={translationKey}
              onChange={(e) => {
                setTranslationKey(e.target.value);
                setSelectedVerses([]);
              }}
              className="w-full text-[0.6875rem] font-semibold px-2 py-1.5 bg-white dark:bg-[#252525] border border-gray-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <optgroup label="Português">
                <option value="pt_almeida">Almeida Revista e Corrigida</option>
                <option value="pt_blt">Bíblia Livre para Todos (NT)</option>
              </optgroup>
            </select>
          </div>

          {/* Seletor do Livro */}
          <div className="col-span-4 relative">
            <select
              value={selectedBook.pt}
              onChange={(e) => {
                const book = ALL_BOOKS.find(b => b.pt === e.target.value);
                setSelectedBook(book);
                setChapter(1);
                setHighlightedVerse(null);
                setSelectedVerses([]);
              }}
              className="w-full text-[0.6875rem] font-semibold px-2 py-1.5 bg-white dark:bg-[#252525] border border-gray-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-500 truncate"
            >
              <optgroup label="Novo Testamento">
                {ALL_BOOKS.filter(b => b.testamento === "NT").map(b => (
                  <option key={b.pt} value={b.pt}>{b.pt}</option>
                ))}
              </optgroup>
              <optgroup label="Antigo Testamento">
                {ALL_BOOKS.filter(b => b.testamento === "VT").map(b => (
                  <option key={b.pt} value={b.pt}>{b.pt}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Seletor do Capítulo */}
          <div className="col-span-2 relative">
            <select
              value={chapter}
              onChange={(e) => {
                setChapter(Number(e.target.value));
                setHighlightedVerse(null);
                setSelectedVerses([]);
              }}
              className="w-full text-[0.6875rem] font-bold text-center px-1 py-1.5 bg-white dark:bg-[#252525] border border-gray-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha 2: Busca rápida, zoom da fonte e info de tradução */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Caixa de Pesquisa dentro do livro */}
          <div className="flex-1 relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar no capítulo..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full text-[0.625rem] pl-7 pr-7 py-1.5 bg-white dark:bg-[#252525] border border-gray-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-teal-500 font-medium"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter("")}
                className="absolute right-2 p-0.5 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Ajuste de Tamanho da Fonte */}
          <div className="flex items-center gap-1 bg-white dark:bg-[#252525] border border-gray-200 dark:border-zinc-800 rounded-lg px-1 py-0.5 select-none text-slate-500 dark:text-zinc-400 shrink-0">
            <button
              onClick={() => setFontSize(prev => Math.max(11, prev - 1))}
              className="px-1.5 py-0.5 text-[0.625rem] font-bold hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded transition"
              title="Diminuir tamanho do texto"
              aria-label="Diminuir texto"
            >
              A-
            </button>
            <span className="text-[0.5625rem] font-mono font-bold text-slate-400 dark:text-zinc-500 opacity-80 min-w-[20px] text-center">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(prev => Math.min(22, prev + 1))}
              className="px-1.5 py-0.5 text-[0.625rem] font-bold hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded transition"
              title="Aumentar tamanho do texto"
              aria-label="Aumentar texto"
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DE LEITURA PRINCIPAL */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white dark:bg-[#121212] select-text scroll-smooth"
      >
        {/* SINALIZADOS DE ESTADOS */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3.5 select-none">
            <div className="w-7 h-7 border-2 border-teal-500/20 border-t-teal-600 dark:border-t-teal-400 rounded-full animate-spin"></div>
            <p className="text-[0.6875rem] font-semibold text-slate-400 dark:text-zinc-500">Buscando versículos sagrados...</p>
          </div>
        )}

        {/* TRATAMENTO ESPECIAL ERRO: VELHO TESTAMENTO NA BÍBLIA LIVRE */}
        {!isLoading && errorMsg === "not_in_blt" && (
          <div className="my-6 p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-left space-y-4 select-none animate-slideUp">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">VT não disponível nesta tradução</h3>
                <p className="text-[0.6875rem] text-amber-800 dark:text-amber-400 mt-1.5 leading-relaxed">
                  A tradução <strong>Bíblia Livre para Todos (BLT)</strong> atualmente tem apenas recursos para os livros do Novo Testamento no servidor.
                </p>
                <p className="text-[0.6875rem] text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                  Deseja ler o livro de <strong>{selectedBook.pt}</strong> na versão clássica e completa de <strong>Almeida Revista e Corrigida</strong>?
                </p>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={handleFallbackToAlmeida}
                className="w-full h-9 bg-teal-700 hover:bg-teal-600 text-white text-[0.6875rem] font-bold rounded-xl shadow transition"
              >
                Alternar para Versão Almeida (Completa em Português)
              </button>
            </div>
          </div>
        )}

        {/* OUTROS ERROS GERAIS */}
        {!isLoading && errorMsg && errorMsg !== "not_in_blt" && (
          <div className="my-6 p-4 bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-950 rounded-2xl flex items-start gap-3 select-none text-left">
            <AlertCircle className="w-5 h-5 text-red-650 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-red-800 dark:text-red-350">Erro de Servidor</h3>
              <p className="text-[0.6875rem] text-red-700 dark:text-red-450 mt-1 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* VISUALIZAÇÃO DE TEXTO DO CAPÍTULO */}
        {!isLoading && !errorMsg && verses.length > 0 && (
          <div className="space-y-3 pb-8">
            {/* Título do Livro no Topo da Leitura */}
            <div className="text-center py-4 select-none mb-3 border-b border-gray-100 dark:border-zinc-800/40">
              <span className="text-[0.625rem] font-extrabold uppercase tracking-widest text-[#0F6E56] dark:text-teal-400 block font-sans">
                {selectedBook.testamento === "VT" ? "Antigo Testamento" : "Novo Testamento"}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                {selectedBook.pt} {chapter}
              </h2>
              {searchFilter && (
                <span className="inline-block px-2.5 py-0.5 text-[0.5625rem] font-bold bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-400 rounded-full mt-2 border border-teal-100/30">
                  Refinados {filteredVerses.length} de {verses.length} versículos
                </span>
              )}
            </div>

            {/* Lista de Versículos */}
            <div className="space-y-4">
              {filteredVerses.map((v) => {
                const verseNum = Number(v.verse);
                const isSelected = selectedVerses.includes(verseNum);
                const isHighlighted = highlightedVerse === verseNum;
                const otherVersions = getOtherVersionsStatus(selectedBook.pt, chapter, verseNum);

                return (
                  <div
                    key={v.verse}
                    id={`verse-${verseNum}`}
                    onClick={() => toggleVerseSelection(verseNum)}
                    className={`p-2 rounded-xl transition duration-200 border border-transparent origin-left relative flex flex-col cursor-pointer select-text group ${
                      isSelected
                        ? "bg-teal-50/60 dark:bg-teal-950/20 border-teal-200/50 dark:border-teal-900/40 scale-[1.01]"
                        : isHighlighted
                        ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/40"
                        : "hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="flex items-start w-full">
                      {/* Número do Versículo */}
                      <span className="text-[0.625rem] font-mono font-black text-slate-400 dark:text-zinc-500 w-5 text-right shrink-0 pr-1.5 mt-1 select-none font-sans">
                        {v.verse}
                      </span>

                      {/* Texto do Versículo */}
                      <p
                        style={{ fontSize: `${fontSize}px` }}
                        className={`flex-1 leading-relaxed text-slate-700 dark:text-zinc-100 transition-all font-sans ${
                          isSelected ? "font-medium text-slate-900 dark:text-white" : ""
                        }`}
                      >
                        {v.text}
                      </p>
                    </div>

                    {/* Exibir traduções alternativas reais do Manual GA se disponíveis */}
                    {otherVersions && (
                      <div className="mt-2.5 ml-5 pl-3 py-2 border-l-2 border-teal-600/70 dark:border-teal-400/80 bg-teal-500/5 dark:bg-teal-400/5 rounded-r-xl space-y-1.5 text-left text-[0.6875rem] leading-relaxed">
                        <div className="font-extrabold text-[0.5625rem] uppercase tracking-wider text-[#0e6851] dark:text-teal-400 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-[#0e6851] dark:text-teal-400" />
                          Compare Versões Oficiais GA:
                        </div>
                        {otherVersions.NVI && (
                          <div className="text-slate-650 dark:text-zinc-300">
                            <span className="font-semibold text-[0.5rem] tracking-wide text-teal-800 dark:text-teal-300 bg-teal-50/65 dark:bg-teal-950/40 border border-teal-200/35 px-1 py-0.5 rounded shadow-sm mr-1.5 font-sans">NVI</span>
                            <span>{otherVersions.NVI}</span>
                          </div>
                        )}
                        {otherVersions.ARA && (
                          <div className="text-slate-650 dark:text-zinc-300">
                            <span className="font-semibold text-[0.5rem] tracking-wide text-teal-800 dark:text-teal-300 bg-teal-50/65 dark:bg-teal-950/40 border border-teal-200/35 px-1 py-0.5 rounded shadow-sm mr-1.5 font-sans">ARA</span>
                            <span>{otherVersions.ARA}</span>
                          </div>
                        )}
                        {otherVersions.NTLH && (
                          <div className="text-slate-650 dark:text-zinc-300">
                            <span className="font-semibold text-[0.5rem] tracking-wide text-teal-800 dark:text-teal-300 bg-teal-50/65 dark:bg-teal-950/40 border border-teal-200/35 px-1 py-0.5 rounded shadow-sm mr-1.5 font-sans">NTLH</span>
                            <span>{otherVersions.NTLH}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredVerses.length === 0 && searchFilter && (
                <div className="text-center py-10 select-none text-slate-400">
                  <p className="text-xs font-semibold">Nenhum resultado para "{searchFilter}" neste capítulo.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONTROLES DO MENU FLUTUANTE DE VERSÍCULOS SELECIONADOS */}
      {selectedVerses.length > 0 && (
        <div className="px-5 py-3.5 bg-neutral-900 text-white border-t border-zinc-800 flex items-center justify-between shrink-0 select-none shadow-2xl animate-slideUp">
          <div className="text-left">
            <div className="text-[0.5625rem] font-bold text-gray-400 uppercase tracking-widest font-sans">
              Selecionados
            </div>
            <div className="text-xs font-black text-teal-400 tracking-tight">
              {selectedBook.pt} {chapter}:{selectedVerses.join(",")}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botão de Copiar */}
            <button
              onClick={copySelectedVerses}
              className="px-3.5 h-8.5 bg-[#0F6E56] hover:bg-[#1D9E75] rounded-xl flex items-center justify-center gap-1.5 text-[0.6875rem] font-extrabold uppercase tracking-wide text-white transition-all shadow-md cursor-pointer"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            {/* Limpar Seleção */}
            <button
              onClick={() => setSelectedVerses([])}
              className="p-2 hover:bg-zinc-800 rounded-xl text-gray-400 hover:text-white transition cursor-pointer"
              title="Desmarcar tudo"
              aria-label="Desmarcar versículos"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* RODAPÉ: BOTÕES ANTERIOR E PRÓXIMO CAPÍTULO */}
      <footer className="px-5 py-3.5 bg-white dark:bg-[#1e1e1e] border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0 select-none">
        <button
          onClick={() => changeChapterIdx(-1)}
          className="px-3.5 h-10 border border-gray-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-[0.6875rem] font-bold rounded-xl text-slate-700 dark:text-zinc-300 flex items-center gap-1 outline-none transition cursor-pointer"
          aria-label="Ir para o capítulo anterior"
        >
          <ChevronLeft className="w-4 h-4 shrink-0 text-slate-400" />
          Anterior
        </button>

        <div className="text-[0.6875rem] font-extrabold font-mono text-slate-400 dark:text-zinc-500 bg-neutral-50 dark:bg-zinc-800/40 px-3.5 py-1.5 rounded-full border border-gray-100 dark:border-zinc-800">
          Ref. {selectedBook.abbrev || selectedBook.pt} {chapter}
        </div>

        <button
          onClick={() => changeChapterIdx(1)}
          className="px-3.5 h-10 border border-gray-200 dark:border-zinc-800 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-[0.6875rem] font-bold rounded-xl text-slate-700 dark:text-zinc-300 flex items-center gap-1 outline-none transition cursor-pointer"
          aria-label="Ir para o próximo capítulo"
        >
          Próximo
          <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />
        </button>
      </footer>
    </div>
  );
}
