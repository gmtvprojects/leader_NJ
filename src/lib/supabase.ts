import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl = 
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process?.env?.VITE_SUPABASE_URL) ||
  ''

const rawSupabaseKey = 
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process?.env?.VITE_SUPABASE_ANON_KEY) ||
  ''

// Check if a real, plausible Supabase URL was supplied (not placeholder)
const isPlausibleConfig = 
  Boolean(rawSupabaseUrl) && 
  !rawSupabaseUrl.includes('placeholder.supabase.co') &&
  rawSupabaseUrl.startsWith('https://') &&
  Boolean(rawSupabaseKey) &&
  !rawSupabaseKey.includes('placeholder')

// Initial default seed data for local storage
const INITIAL_MEMBROS = [
  {
    id: "mem-01",
    lider_id: "lider-local",
    nome: "Lucas Rocha",
    contato1: "(11) 98765-4321",
    contato2: "",
    aniversario: "2008-03-15",
    linguagem_amor: "Palavras de Afirmação",
    ministerio: "Louvor / Mídia",
    faixa: "J1",
    data_entrada: "2024-01-10",
    contato_pais: "Pr. Marcos (Pai) - (11) 98888-7777",
    notas: JSON.stringify({
      _meta: true,
      ga: "GA Ebenezer",
      origemTransicao: true,
      motivoAusencia: "",
      detalheAusencia: "",
      ultimoContato: "2025-02-20",
      responsavelContato: "Líder Gabriel",
      observacoes: "Subindo do Jovens 1 (17 anos) para o J2. Muito comunicativo, já começou a tocar violão no grupo."
    }),
    status: "Ativo",
    faltas: 0
  },
  {
    id: "mem-02",
    lider_id: "lider-local",
    nome: "Beatriz Albuquerque",
    contato1: "(11) 97654-3210",
    contato2: "",
    aniversario: "2008-08-22",
    linguagem_amor: "Tempo de Qualidade",
    ministerio: "Acolhimento",
    faixa: "J1",
    data_entrada: "2024-02-15",
    contato_pais: "Ana Lúcia (Mãe) - (11) 97777-6666",
    notas: JSON.stringify({
      _meta: true,
      ga: "Sem GA / A Definir",
      origemTransicao: true,
      motivoAusencia: "",
      detalheAusencia: "",
      ultimoContato: "2025-02-18",
      responsavelContato: "Líder Sarah",
      observacoes: "Completando 18 anos este ano. Precisa ser convidada para um GA permanente e integrada nas amizades do J2."
    }),
    status: "Transição",
    faltas: 1
  },
  {
    id: "mem-03",
    lider_id: "lider-local",
    nome: "Matheus Oliveira",
    contato1: "(11) 96543-2109",
    contato2: "",
    aniversario: "2006-05-10",
    linguagem_amor: "Atos de Serviço",
    ministerio: "Sonoplastia",
    faixa: "J2",
    data_entrada: "2023-03-01",
    contato_pais: "",
    notas: JSON.stringify({
      _meta: true,
      ga: "GA Ebenezer",
      origemTransicao: false,
      motivoAusencia: "Estudos / Faculdade / Provas",
      detalheAusencia: "Aulas da faculdade de Engenharia com aulas extras no sábado à noite e semana de provas bimestrais.",
      ultimoContato: "2025-02-14",
      responsavelContato: "Líder Gabriel",
      observacoes: "Manter contato semanal e mandar mensagem de incentivo nos dias de prova."
    }),
    status: "Ausente",
    faltas: 3
  },
  {
    id: "mem-04",
    lider_id: "lider-local",
    nome: "Davi Santos",
    contato1: "(11) 95432-1098",
    contato2: "",
    aniversario: "2007-01-20",
    linguagem_amor: "Presentes",
    ministerio: "Teatro",
    faixa: "J2",
    data_entrada: "2023-08-10",
    contato_pais: "Marlene (Mãe) - (11) 96666-5555",
    notas: JSON.stringify({
      _meta: true,
      ga: "GA Esperança",
      origemTransicao: true,
      motivoAusencia: "Desânimo / Esfriou na Fé",
      detalheAusencia: "Passou por um período de pressão escolar e esfriou na frequência aos cultos e GA.",
      ultimoContato: "2025-02-10",
      responsavelContato: "Líder Matheus",
      observacoes: "Necessita de visita pastoral e discipulado de perto. Combinado café com o líder."
    }),
    status: "Ausente",
    faltas: 4
  },
  {
    id: "mem-05",
    lider_id: "lider-local",
    nome: "Larissa Mendes",
    contato1: "(11) 94321-0987",
    contato2: "",
    aniversario: "2007-09-05",
    linguagem_amor: "Palavras de Afirmação",
    ministerio: "Dança / Coreografia",
    faixa: "J2",
    data_entrada: "2023-11-20",
    contato_pais: "",
    notas: JSON.stringify({
      _meta: true,
      ga: "GA Maranata",
      origemTransicao: true,
      motivoAusencia: "Trabalho / Horário",
      detalheAusencia: "Trabalhando em escala comercial 12x36 em shopping, reveza folgas aos fins de semana.",
      ultimoContato: "2025-02-16",
      responsavelContato: "Líder Sarah",
      observacoes: "Quando está de folga sempre participa. Manter no grupo do WhatsApp com resumos do GA."
    }),
    status: "Esporádico",
    faltas: 2
  },
  {
    id: "mem-06",
    lider_id: "lider-local",
    nome: "Gabriel Souza",
    contato1: "(11) 93210-9876",
    contato2: "",
    aniversario: "2007-04-12",
    linguagem_amor: "Toque Físico",
    ministerio: "Liderança de GA",
    faixa: "J2",
    data_entrada: "2022-09-15",
    contato_pais: "",
    notas: JSON.stringify({
      _meta: true,
      ga: "GA Ebenezer",
      origemTransicao: true,
      motivoAusencia: "",
      detalheAusencia: "",
      ultimoContato: "2025-02-21",
      responsavelContato: "Líder Gabriel",
      observacoes: "Fez a transição completa J1 -> J2 com sucesso, agora é treinando de líder de GA."
    }),
    status: "Ativo",
    faltas: 0
  },
  {
    id: "mem-07",
    lider_id: "lider-local",
    nome: "Mariana Costa",
    contato1: "(11) 92109-8765",
    contato2: "",
    aniversario: "2004-11-30",
    linguagem_amor: "Tempo de Qualidade",
    ministerio: "Intercessão / Oração",
    faixa: "J2",
    data_entrada: "2022-04-05",
    contato_pais: "",
    notas: JSON.stringify({
      _meta: true,
      ga: "GA Ebenezer",
      origemTransicao: false,
      motivoAusencia: "",
      detalheAusencia: "",
      ultimoContato: "2025-02-19",
      responsavelContato: "Líder Sarah",
      observacoes: "Ajuda a acolher as meninas que chegam do J1."
    }),
    status: "Ativo",
    faltas: 0
  },
  {
    id: "mem-08",
    lider_id: "lider-local",
    nome: "Felipe Andrade",
    contato1: "(11) 91098-7654",
    contato2: "",
    aniversario: "2003-07-18",
    linguagem_amor: "Atos de Serviço",
    ministerio: "Comunicação e Redes",
    faixa: "J2",
    data_entrada: "2021-08-20",
    contato_pais: "",
    notas: JSON.stringify({
      _meta: true,
      ga: "GA Maranata",
      origemTransicao: false,
      motivoAusencia: "",
      detalheAusencia: "",
      ultimoContato: "2025-02-17",
      responsavelContato: "Líder Gabriel",
      observacoes: "Presença constante nos encontros e cultos de jovens."
    }),
    status: "Ativo",
    faltas: 0
  }
];

const INITIAL_REUNIOES = [
  {
    id: "reu-01",
    lider_id: "lider-local",
    data: "2025-02-21",
    tema: "Transição e Propósito: Como Permanecer Firme no Início da Vida Adulta",
    lanche: "Pastéis assados e Suco Natural",
    oracoes: "Oração especial pelos jovens que acabaram de ingressar no Jovens 2 (Lucas e Beatriz), vestibulares e decisões de carreira."
  },
  {
    id: "reu-02",
    lider_id: "lider-local",
    data: "2025-02-14",
    tema: "Identidade em Cristo e a Pressão do Mundo Universitário / Trabalho",
    lanche: "Mini sanduíches naturais e refrigerante",
    oracoes: "Pelo Matheus na faculdade e pela Larissa no trabalho."
  },
  {
    id: "reu-03",
    lider_id: "lider-local",
    data: "2025-02-07",
    tema: "O Poder da Comunhão: Nenhum Jovem Fica Para Trás",
    lanche: "Bolo de cenoura com chocolate",
    oracoes: "Pelos amigos afastados e resgate do Davi Santos."
  }
];

const INITIAL_PRESENCAS = [
  { id: "pre-01", reuniao_id: "reu-01", membro_id: "mem-01" },
  { id: "pre-02", reuniao_id: "reu-01", membro_id: "mem-06" },
  { id: "pre-03", reuniao_id: "reu-01", membro_id: "mem-07" },
  { id: "pre-04", reuniao_id: "reu-01", membro_id: "mem-08" },
  { id: "pre-05", reuniao_id: "reu-02", membro_id: "mem-01" },
  { id: "pre-06", reuniao_id: "reu-02", membro_id: "mem-02" },
  { id: "pre-07", reuniao_id: "reu-02", membro_id: "mem-05" },
  { id: "pre-08", reuniao_id: "reu-02", membro_id: "mem-06" },
  { id: "pre-09", reuniao_id: "reu-02", membro_id: "mem-07" },
  { id: "pre-10", reuniao_id: "reu-03", membro_id: "mem-01" },
  { id: "pre-11", reuniao_id: "reu-03", membro_id: "mem-06" },
  { id: "pre-12", reuniao_id: "reu-03", membro_id: "mem-07" }
];

const INITIAL_PEDIDOS = [
  {
    id: "ped-01",
    lider_id: "lider-local",
    membro_id: "mem-01",
    nome_membro: "Lucas Rocha",
    motivo: "Oração pelo vestibular e fase de adaptação na transição para o J2",
    categoria: "Estudos / Transição",
    status: "Pendente",
    data: "2025-02-21"
  },
  {
    id: "ped-02",
    lider_id: "lider-local",
    membro_id: "mem-04",
    nome_membro: "Davi Santos",
    motivo: "Restauração da comunhão com Deus e ânimo para voltar ao GA",
    categoria: "Espiritual",
    status: "Pendente",
    data: "2025-02-14"
  },
  {
    id: "ped-03",
    lider_id: "lider-local",
    membro_id: "mem-05",
    nome_membro: "Larissa Mendes",
    motivo: "Ajuste na escala de trabalho no sábado para poder frequentar os cultos de jovens",
    categoria: "Trabalho",
    status: "Atendido",
    data: "2025-02-07"
  }
];

const INITIAL_TREINANDOS = [
  {
    id: "trein-01",
    lider_id: "lider-local",
    nome: "Gabriel Souza",
    data_inicio: "2024-11-01"
  },
  {
    id: "trein-02",
    lider_id: "lider-local",
    nome: "Lucas Rocha",
    data_inicio: "2025-01-15"
  }
];

const INITIAL_HISTORICO = [
  { id: "hist-01", lider_id: "lider-local", mes: "2024-10", total: 6 },
  { id: "hist-02", lider_id: "lider-local", mes: "2024-11", total: 7 },
  { id: "hist-03", lider_id: "lider-local", mes: "2024-12", total: 7 },
  { id: "hist-04", lider_id: "lider-local", mes: "2025-01", total: 8 },
  { id: "hist-05", lider_id: "lider-local", mes: "2025-02", total: 8 }
];

const INITIAL_PROFILES = [
  {
    id: "lider-local",
    nome_grupo: "GA Ebenezer - Jovens 2"
  }
];

// In-memory table backup for environments without window.localStorage (or fast startup)
const memoryStore: Record<string, any[]> = {
  membros: INITIAL_MEMBROS,
  reunioes: INITIAL_REUNIOES,
  reuniao_presencas: INITIAL_PRESENCAS,
  pedidos_oracao: INITIAL_PEDIDOS,
  treinandos: INITIAL_TREINANDOS,
  historico_tamanho: INITIAL_HISTORICO,
  profiles: INITIAL_PROFILES,
  eventos: [],
  evento_checklist: [],
  banco_temas: [],
  banco_recursos: []
};

// Helper to safely get table from localStorage or memoryStore
function getLocalTable(tableName: string): any[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(`ga_table_${tableName}`)
      if (raw) {
        return JSON.parse(raw)
      }
      const initial = memoryStore[tableName] || []
      localStorage.setItem(`ga_table_${tableName}`, JSON.stringify(initial))
      return initial
    } catch {
      // Ignore error, fallback to memory
    }
  }
  return memoryStore[tableName] || []
}

function setLocalTable(tableName: string, data: any[]) {
  memoryStore[tableName] = data
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(`ga_table_${tableName}`, JSON.stringify(data))
    } catch {}
  }
}

// Global flag tracking Supabase network status
let isSupabaseOnline: boolean = isPlausibleConfig

// Real Supabase Client Instance (with abortable/safe fetch)
let realClient: any = null
if (isPlausibleConfig) {
  try {
    realClient = createClient(rawSupabaseUrl, rawSupabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)
          try {
            const response = await fetch(input, {
              ...init,
              signal: init?.signal || controller.signal
            })
            clearTimeout(timeoutId)
            isSupabaseOnline = true
            return response
          } catch (fetchErr: any) {
            clearTimeout(timeoutId)
            isSupabaseOnline = false
            throw fetchErr
          }
        }
      }
    })
  } catch (e) {
    realClient = null
    isSupabaseOnline = false
  }
}

// Auth listeners for local fallback
type AuthChangeCallback = (event: string, session: any) => void
const authListeners = new Set<AuthChangeCallback>()

function notifyAuthChange(event: string, session: any) {
  authListeners.forEach(cb => {
    try {
      cb(event, session)
    } catch {}
  })
}

// Local mock user & session
function getLocalSession() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem('ga_pwa_session')
      if (raw) return JSON.parse(raw)
    } catch {}
  }
  return null
}

function setLocalSession(session: any) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      if (session) {
        localStorage.setItem('ga_pwa_session', JSON.stringify(session))
      } else {
        localStorage.removeItem('ga_pwa_session')
      }
    } catch {}
  }
}

// Chainable query builder for transparent local fallback and remote sync
class LocalQueryBuilder {
  private tableName: string
  private filters: { field: string; op: 'eq'; val: any }[] = []
  private orClause: string | null = null
  private orderConfig: { field: string; ascending: boolean } | null = null
  private limitCount: number | null = null
  private isSingle = false
  private isMaybeSingle = false
  private action: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private payload: any = null
  private selectCols: string = '*'
  private realBuilder: any = null

  constructor(tableName: string, realBuilder: any = null) {
    this.tableName = tableName
    this.realBuilder = realBuilder
  }

  select(cols: string = '*') {
    this.selectCols = cols
    if (this.realBuilder?.select) {
      try { this.realBuilder = this.realBuilder.select(cols) } catch {}
    }
    return this
  }

  eq(field: string, val: any) {
    this.filters.push({ field, op: 'eq', val })
    if (this.realBuilder?.eq) {
      try { this.realBuilder = this.realBuilder.eq(field, val) } catch {}
    }
    return this
  }

  or(cond: string) {
    this.orClause = cond
    if (this.realBuilder?.or) {
      try { this.realBuilder = this.realBuilder.or(cond) } catch {}
    }
    return this
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.orderConfig = { field, ascending: opts?.ascending !== false }
    if (this.realBuilder?.order) {
      try { this.realBuilder = this.realBuilder.order(field, opts) } catch {}
    }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    if (this.realBuilder?.limit) {
      try { this.realBuilder = this.realBuilder.limit(count) } catch {}
    }
    return this
  }

  single() {
    this.isSingle = true
    if (this.realBuilder?.single) {
      try { this.realBuilder = this.realBuilder.single() } catch {}
    }
    return this
  }

  maybeSingle() {
    this.isMaybeSingle = true
    if (this.realBuilder?.maybeSingle) {
      try { this.realBuilder = this.realBuilder.maybeSingle() } catch {}
    }
    return this
  }

  insert(data: any | any[]) {
    this.action = 'insert'
    this.payload = data
    if (this.realBuilder?.insert) {
      try { this.realBuilder = this.realBuilder.insert(data) } catch {}
    }
    return this
  }

  upsert(data: any | any[], opts?: any) {
    this.action = 'upsert'
    this.payload = data
    if (this.realBuilder?.upsert) {
      try { this.realBuilder = this.realBuilder.upsert(data, opts) } catch {}
    }
    return this
  }

  update(data: any) {
    this.action = 'update'
    this.payload = data
    if (this.realBuilder?.update) {
      try { this.realBuilder = this.realBuilder.update(data) } catch {}
    }
    return this
  }

  delete() {
    this.action = 'delete'
    if (this.realBuilder?.delete) {
      try { this.realBuilder = this.realBuilder.delete() } catch {}
    }
    return this
  }

  // Execute on local storage
  private executeLocal(): { data: any; error: any } {
    let rows = getLocalTable(this.tableName)

    if (this.action === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload]
      const inserted = items.map((item: any) => ({
        id: item.id || `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...item
      }))
      rows = [...rows, ...inserted]
      setLocalTable(this.tableName, rows)
      return { 
        data: this.isSingle ? inserted[0] : (Array.isArray(this.payload) ? inserted : inserted[0]), 
        error: null 
      }
    }

    if (this.action === 'upsert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload]
      for (const item of items) {
        const idx = rows.findIndex((r: any) => {
          if (item.id && r.id === item.id) return true
          if (this.tableName === 'historico_tamanho' && r.lider_id === item.lider_id && r.mes === item.mes) return true
          if (this.tableName === 'profiles' && r.id === item.id) return true
          return false
        })
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...item }
        } else {
          rows.push({
            id: item.id || `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            ...item
          })
        }
      }
      setLocalTable(this.tableName, rows)
      return { data: this.payload, error: null }
    }

    if (this.action === 'update') {
      let updatedRows: any[] = []
      rows = rows.map((r: any) => {
        const matches = this.filters.every(f => String(r[f.field]) === String(f.val))
        if (matches) {
          const updated = { ...r, ...this.payload }
          updatedRows.push(updated)
          return updated
        }
        return r
      })
      setLocalTable(this.tableName, rows)
      return { data: this.isSingle ? updatedRows[0] || null : updatedRows, error: null }
    }

    if (this.action === 'delete') {
      rows = rows.filter((r: any) => {
        const matches = this.filters.every(f => String(r[f.field]) === String(f.val))
        return !matches
      })
      setLocalTable(this.tableName, rows)
      return { data: null, error: null }
    }

    // Default: 'select'
    let result = [...rows]

    // Apply eq filters
    for (const f of this.filters) {
      result = result.filter(r => String(r[f.field]) === String(f.val))
    }

    // Apply or filters if present
    if (this.orClause) {
      result = rows.filter((r: any) => {
        return (
          this.filters.every(f => String(r[f.field]) === String(f.val)) ||
          r.lider_id === null ||
          r.lider_id === undefined
        )
      })
    }

    // Embed relations if requested
    if (this.tableName === 'reunioes' && this.selectCols.includes('reuniao_presencas')) {
      const allPresencas = getLocalTable('reuniao_presencas')
      result = result.map(r => ({
        ...r,
        reuniao_presencas: allPresencas
          .filter(p => p.reuniao_id === r.id)
          .map(p => ({ membro_id: p.membro_id }))
      }))
    }

    if (this.tableName === 'eventos' && this.selectCols.includes('evento_checklist')) {
      const allChecks = getLocalTable('evento_checklist')
      result = result.map(e => ({
        ...e,
        evento_checklist: allChecks.filter(c => c.evento_id === e.id)
      }))
    }

    // Order
    if (this.orderConfig) {
      const { field, ascending } = this.orderConfig
      result.sort((a, b) => {
        const valA = a[field] ?? ''
        const valB = b[field] ?? ''
        if (valA < valB) return ascending ? -1 : 1
        if (valA > valB) return ascending ? 1 : -1
        return 0
      })
    }

    // Limit
    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount)
    }

    if (this.isSingle) {
      if (result.length === 0) {
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' } }
      }
      return { data: result[0], error: null }
    }

    if (this.isMaybeSingle) {
      return { data: result[0] || null, error: null }
    }

    return { data: result, error: null }
  }

  // Make it awaitable / PromiseLike
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const promise = (async () => {
      // If remote Supabase is reachable and realBuilder exists, try remote execution first
      if (isSupabaseOnline && this.realBuilder && typeof this.realBuilder.then === 'function') {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Supabase timeout')), 2500)
          )
          const res = await Promise.race([this.realBuilder, timeoutPromise]) as any
          if (res && !res.error) {
            return res
          }
          if (res?.error && (res.error.message?.includes('fetch') || res.error.message?.includes('network'))) {
            isSupabaseOnline = false
            return this.executeLocal()
          }
          return res || this.executeLocal()
        } catch {
          isSupabaseOnline = false
          return this.executeLocal()
        }
      }
      return this.executeLocal()
    })()

    return promise.then(onfulfilled, onrejected)
  }
}

// The unified, resilient Supabase client wrapper
export const supabase = {
  auth: {
    async getSession() {
      const local = getLocalSession()

      if (isSupabaseOnline && realClient) {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session timeout')), 2000)
          )
          const { data, error } = await Promise.race([
            realClient.auth.getSession(),
            timeoutPromise
          ]) as any

          if (!error && data?.session) {
            setLocalSession(data.session)
            return { data: { session: data.session }, error: null }
          }
        } catch {
          isSupabaseOnline = false
        }
      }

      if (local) {
        return { data: { session: local }, error: null }
      }

      // Default authenticated leader session for local/offline PWA use
      const defaultLeaderSession = {
        access_token: 'local-pwa-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: 'lider-local',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'lider@igreja.com',
          user_metadata: {
            nome: 'Líder GA',
            igreja: 'Firme na Palavra e no Amor'
          }
        }
      }
      setLocalSession(defaultLeaderSession)
      return { data: { session: defaultLeaderSession }, error: null }
    },

    onAuthStateChange(callback: AuthChangeCallback) {
      authListeners.add(callback)

      let realSub: any = null
      if (isSupabaseOnline && realClient) {
        try {
          const { data } = realClient.auth.onAuthStateChange((event: string, session: any) => {
            if (session) setLocalSession(session)
            callback(event, session)
          })
          realSub = data?.subscription
        } catch {
          isSupabaseOnline = false
        }
      }

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback)
              if (realSub?.unsubscribe) {
                try { realSub.unsubscribe() } catch {}
              }
            }
          }
        }
      }
    },

    async signInWithPassword({ email, password }: { email: string; password?: string }) {
      if (isSupabaseOnline && realClient) {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SignIn timeout')), 2500)
          )
          const res = await Promise.race([
            realClient.auth.signInWithPassword({ email, password }),
            timeoutPromise
          ]) as any

          if (!res?.error && res?.data?.session) {
            setLocalSession(res.data.session)
            notifyAuthChange('SIGNED_IN', res.data.session)
            return res
          }
          if (res?.error && !res.error.message?.includes('fetch')) {
            return res
          }
        } catch {
          isSupabaseOnline = false
        }
      }

      // Fallback local leader login
      const user = {
        id: 'lider-local',
        email: email || 'lider@igreja.com',
        user_metadata: { nome: 'Líder GA' }
      }
      const session = {
        access_token: 'local-token-' + Date.now(),
        user
      }
      setLocalSession(session)
      notifyAuthChange('SIGNED_IN', session)
      return { data: { user, session }, error: null }
    },

    async signUp({ email, password }: { email: string; password?: string }) {
      if (isSupabaseOnline && realClient) {
        try {
          const res = await realClient.auth.signUp({ email, password })
          if (!res.error) return res
        } catch {
          isSupabaseOnline = false
        }
      }

      const user = {
        id: 'lider-local',
        email: email || 'lider@igreja.com',
        user_metadata: { nome: 'Líder GA' }
      }
      const session = {
        access_token: 'local-token-' + Date.now(),
        user
      }
      setLocalSession(session)
      notifyAuthChange('SIGNED_IN', session)
      return { data: { user, session }, error: null }
    },

    async signOut() {
      setLocalSession(null)
      if (isSupabaseOnline && realClient) {
        try {
          await realClient.auth.signOut()
        } catch {}
      }
      notifyAuthChange('SIGNED_OUT', null)
      return { error: null }
    }
  },

  from(tableName: string) {
    let realBuilder: any = null
    if (isSupabaseOnline && realClient) {
      try {
        realBuilder = realClient.from(tableName)
      } catch {
        isSupabaseOnline = false
      }
    }
    return new LocalQueryBuilder(tableName, realBuilder)
  },

  storage: {
    from(bucket: string) {
      if (isSupabaseOnline && realClient?.storage) {
        try {
          return realClient.storage.from(bucket)
        } catch {}
      }
      return {
        async upload(filePath: string, _file: any) {
          return { data: { path: filePath }, error: null }
        },
        async download(_filePath: string) {
          return { data: new Blob(), error: null }
        },
        async remove(filePaths: string[]) {
          return { data: filePaths, error: null }
        },
        async list(_path?: string) {
          return { data: [], error: null }
        },
        getPublicUrl(filePath: string) {
          return { data: { publicUrl: filePath } }
        }
      }
    }
  }
}
