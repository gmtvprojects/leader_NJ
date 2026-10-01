import React, { useState } from 'react'
import { api } from '../lib/api'
import { Lock, KeyRound, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (codigo.length !== 6) {
      setErrorMsg('Informe o código de acesso de 6 números.')
      return
    }
    if (!password) {
      setErrorMsg('Informe a senha.')
      return
    }
    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await api.auth.signInWithPassword({ codigo, password })
      if (error) throw error
    } catch (err: any) {
      console.error(err)
      const msg = err?.message || ''
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        setErrorMsg('Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.')
      } else {
        setErrorMsg(err.message || 'Ocorreu um erro ao processar sua solicitação.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 shadow-lg space-y-6">

        {/* Logo & Headline */}
        <div className="text-center space-y-1.5 select-none">
          <div className="text-[#0f766e] dark:text-teal-400 font-bold text-lg flex items-center justify-center gap-1.5">
            <span className="text-xl">✝</span>
            <span>Firme na Palavra e no Amor</span>
          </div>
          <p className="text-[0.6875rem] text-zinc-500 dark:text-zinc-450 uppercase tracking-widest font-bold">
            App do Líder de GA
          </p>
        </div>

        {/* Error Messaging */}
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 text-[0.6875rem] p-3 rounded-xl font-medium">
            <p className="leading-normal">{errorMsg}</p>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3.5">
            {/* Código de acesso */}
            <div className="space-y-1">
              <label htmlFor="login-codigo" className="block text-[0.5rem] font-black uppercase text-zinc-400 dark:text-zinc-450 tracking-wider">
                Código de Acesso
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pr-1.5 border-r border-neutral-105 dark:border-zinc-800">
                  <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                </span>
                <input
                  id="login-codigo"
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-sm tracking-[0.4em] font-bold pl-11 pr-3 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#0f766e] text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <label htmlFor="login-senha" className="block text-[0.5rem] font-black uppercase text-zinc-400 dark:text-zinc-450 tracking-wider">
                Senha de Acesso
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pr-1.5 border-r border-neutral-105 dark:border-zinc-800">
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                </span>
                <input
                  id="login-senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="• • • • • •"
                  className="w-full text-xs pl-11 pr-10 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#0f766e] text-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-650"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full h-11 bg-[#0f766e] hover:bg-[#0d635c] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
              loading ? 'opacity-80 cursor-wait' : ''
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processando...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </button>

          <p className="text-center text-[0.625rem] text-zinc-400 leading-relaxed">
            Não tem o código? Peça ao seu Pastor.
          </p>
        </form>
      </div>
    </div>
  )
}
