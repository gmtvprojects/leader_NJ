import React, { useState } from 'react'
import { api } from '../lib/api'
import { Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setErrorMsg('Por favor, preencha todos os campos.')
      return
    }
    setLoading(true)
    setErrorMsg('')

    try {
      if (isLogin) {
        const { error } = await api.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await api.auth.signUp({ email, password })
        if (error) throw error
      }
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

        {/* Auth Mode Toggle */}
        <div className="flex bg-neutral-100 dark:bg-zinc-950 p-1 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs font-semibold select-none">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true)
              setErrorMsg('')
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              isLogin 
                ? 'bg-[#0f766e] text-white shadow-sm' 
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false)
              setErrorMsg('')
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              !isLogin 
                ? 'bg-[#0f766e] text-white shadow-sm' 
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
            }`}
          >
            Criar conta
          </button>
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
            {/* Email field */}
            <div className="space-y-1">
              <label className="block text-[0.5rem] font-black uppercase text-zinc-400 dark:text-zinc-450 tracking-wider">
                Endereço de E-mail
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pr-1.5 border-r border-neutral-105 dark:border-zinc-800">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full text-xs pl-11 pr-3 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[#0f766e] text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <label className="block text-[0.5rem] font-black uppercase text-zinc-400 dark:text-zinc-450 tracking-wider">
                Senha de Acesso
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pr-1.5 border-r border-neutral-105 dark:border-zinc-800">
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
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
              <span>{isLogin ? 'Fazer Login' : 'Cadastrar e Entrar'}</span>
            )}
          </button>

        </form>
      </div>
    </div>
  )
}
