// Cliente do backend próprio (Express + Postgres, pasta /server).
// Expõe um construtor de consultas encadeável (from/select/eq/insert...) sobre a rota /api/db,
// além de autenticação (/api/auth) e arquivos (/api/storage).

type ApiError = { message: string; code?: string }
type ApiResult<T = any> = { data: T | null; error: ApiError | null }
export type Papel = 'lider' | 'pastor'
type Session = { access_token: string; user: { id: string; email: string | null; codigo?: string | null; papel?: Papel } }
type AuthChangeCallback = (event: string, session: Session | null) => void

const SESSION_KEY = 'ga_pwa_session'
const ERRO_REDE: ApiError = { message: 'Failed to fetch: servidor inacessível.', code: 'REDE' }

const authListeners = new Set<AuthChangeCallback>()

function notifyAuthChange(event: string, session: Session | null) {
  authListeners.forEach(cb => {
    try {
      cb(event, session)
    } catch {}
  })
}

function getStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setStoredSession(session: Session | null) {
  try {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  } catch {}
}

function authHeaders(): Record<string, string> {
  const token = getStoredSession()?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Sessão expirada ou revogada: limpa o armazenamento e devolve o usuário ao login.
function handleUnauthorized() {
  if (getStoredSession()) {
    setStoredSession(null)
    notifyAuthChange('SIGNED_OUT', null)
  }
}

async function request<T = any>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  let response: Response
  try {
    response = await fetch(path, { ...init, headers: { ...authHeaders(), ...(init.headers || {}) } })
  } catch {
    return { data: null, error: ERRO_REDE }
  }

  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    handleUnauthorized()
  }

  try {
    const body = await response.json()
    if (!response.ok && !body?.error) {
      return { data: null, error: { message: `Erro ${response.status}` } }
    }
    return { data: body?.data ?? null, error: body?.error ?? null }
  } catch {
    return { data: null, error: { message: `Erro ${response.status}` } }
  }
}

function postJson<T = any>(path: string, body: unknown) {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

// Construtor de consultas encadeável; a requisição só é enviada no await.
class QueryBuilder implements PromiseLike<ApiResult> {
  private query: {
    table: string
    action: 'select' | 'insert' | 'update' | 'upsert' | 'delete'
    select: string
    filters: { field: string; val: any }[]
    order: { field: string; ascending: boolean } | null
    limit: number | null
    single: boolean
    maybeSingle: boolean
    payload: any
  }

  constructor(table: string) {
    this.query = {
      table,
      action: 'select',
      select: '*',
      filters: [],
      order: null,
      limit: null,
      single: false,
      maybeSingle: false,
      payload: null
    }
  }

  select(cols: string = '*') {
    this.query.select = cols
    return this
  }

  eq(field: string, val: any) {
    this.query.filters.push({ field, val })
    return this
  }

  // O servidor já devolve os registros do líder junto com os globais (lider_id nulo),
  // então a condição "or" não precisa ser enviada.
  or(_cond: string) {
    return this
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.query.order = { field, ascending: opts?.ascending !== false }
    return this
  }

  limit(count: number) {
    this.query.limit = count
    return this
  }

  single() {
    this.query.single = true
    return this
  }

  maybeSingle() {
    this.query.maybeSingle = true
    return this
  }

  insert(data: any | any[]) {
    this.query.action = 'insert'
    this.query.payload = data
    return this
  }

  upsert(data: any | any[], _opts?: any) {
    this.query.action = 'upsert'
    this.query.payload = data
    return this
  }

  update(data: any) {
    this.query.action = 'update'
    this.query.payload = data
    return this
  }

  delete() {
    this.query.action = 'delete'
    return this
  }

  then<TResult1 = ApiResult, TResult2 = never>(
    onfulfilled?: ((value: ApiResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return postJson('/api/db', this.query).then(onfulfilled, onrejected)
  }
}

async function autenticarCom(rota: 'login' | 'signup', identificador: { codigo?: string; email?: string }, password?: string) {
  const res = await postJson<{ user: Session['user']; session: Session }>(`/api/auth/${rota}`, { ...identificador, password })
  if (res.error || !res.data) {
    return { data: { user: null, session: null }, error: res.error || { message: 'Resposta inválida do servidor.' } }
  }
  setStoredSession(res.data.session)
  notifyAuthChange('SIGNED_IN', res.data.session)
  return { data: res.data, error: null }
}

function chamar<T = any>(path: string, method = 'GET', body?: unknown) {
  return request<T>(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined
  })
}

export const api = {
  // Manual de liderança (leitura para qualquer usuário autenticado)
  manual: {
    listar: () => chamar<any[]>('/api/manual')
  },

  // Rotas exclusivas do perfil Pastor
  pastor: {
    dados: () => chamar<any>('/api/pastor/dados'),
    cadastrarLider: (dados: { nome_lider: string; email?: string; senha: string; nome_grupo?: string; celular?: string }) =>
      chamar<any>('/api/pastor/lideres', 'POST', dados),
    excluirLider: (id: string) => chamar<any>(`/api/pastor/lideres/${id}`, 'DELETE'),
    decidirEvento: (id: string, decisao: 'aprovado' | 'reprovado' | 'pendente', obs?: string) =>
      chamar<any>(`/api/pastor/eventos/${id}/aprovacao`, 'POST', { decisao, obs }),
    salvarCapitulo: (capitulo: any, id?: string) =>
      id ? chamar<any>(`/api/pastor/manual/${id}`, 'PUT', capitulo) : chamar<any>('/api/pastor/manual', 'POST', capitulo),
    excluirCapitulo: (id: string) => chamar<any>(`/api/pastor/manual/${id}`, 'DELETE')
  },

  auth: {
    async getSession(): Promise<{ data: { session: Session | null }; error: ApiError | null }> {
      const local = getStoredSession()
      if (!local) return { data: { session: null }, error: null }

      const res = await request('/api/auth/session')
      if (res.error && res.error.code !== 'REDE') {
        setStoredSession(null)
        return { data: { session: null }, error: null }
      }
      // Atualiza o papel (líder/pastor) com o que o servidor informa, caso tenha mudado.
      const papelAtual = res.data?.user?.papel as Papel | undefined
      const codigoAtual = res.data?.user?.codigo as string | undefined
      if ((papelAtual && local.user.papel !== papelAtual) || (codigoAtual && local.user.codigo !== codigoAtual)) {
        local.user = { ...local.user, papel: papelAtual || local.user.papel, codigo: codigoAtual || local.user.codigo }
        setStoredSession(local)
      }
      // Sem rede, mantém a sessão salva: as telas mostram seus próprios erros de carregamento.
      return { data: { session: local }, error: null }
    },

    onAuthStateChange(callback: AuthChangeCallback) {
      authListeners.add(callback)
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback)
            }
          }
        }
      }
    },

    // Login pelo código de acesso de 6 números + senha
    signInWithPassword({ codigo, password }: { codigo: string; password?: string }) {
      return autenticarCom('login', { codigo }, password)
    },

    signUp({ email, password }: { email: string; password?: string }) {
      return autenticarCom('signup', { email }, password)
    },

    async signOut() {
      setStoredSession(null)
      notifyAuthChange('SIGNED_OUT', null)
      return { error: null }
    }
  },

  from(table: string) {
    return new QueryBuilder(table)
  },

  storage: {
    from(bucket: string) {
      const base = `/api/storage/${bucket}`
      return {
        async upload(filePath: string, file: Blob, _opts?: any) {
          const res = await request(`${base}/${encodeURIComponent(filePath)}`, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
            body: file
          })
          return { data: res.error ? null : { path: filePath }, error: res.error }
        },

        async download(filePath: string): Promise<{ data: Blob | null; error: ApiError | null }> {
          try {
            const response = await fetch(`${base}/${encodeURIComponent(filePath)}`, { headers: authHeaders() })
            if (response.status === 401) handleUnauthorized()
            if (!response.ok) {
              return { data: null, error: { message: response.status === 404 ? 'Arquivo não encontrado.' : `Erro ${response.status}` } }
            }
            return { data: await response.blob(), error: null }
          } catch {
            return { data: null, error: ERRO_REDE }
          }
        },

        async remove(filePaths: string[]) {
          return postJson(`${base}/remove`, { paths: filePaths })
        },

        async createSignedUrl(filePath: string, expiresIn: number) {
          return postJson<{ signedUrl: string }>(`${base}/sign`, { path: filePath, expiresIn })
        },

        // Não há arquivos públicos: todo acesso passa por URL assinada.
        getPublicUrl(_filePath: string) {
          return { data: { publicUrl: '' } }
        }
      }
    }
  }
}
