'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([])
  const [showAccountsDropdown, setShowAccountsDropdown] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAutoLogin()
    loadAvailableAccounts()
  }, [])

  const loadAvailableAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: sessions } = await supabase.auth.getSession()
      
      // Carregar contas do localStorage
      const savedAccounts = JSON.parse(localStorage.getItem('availableAccounts') || '[]')
      
      // Adicionar conta atual se existir
      if (user && !savedAccounts.find((acc: any) => acc.email === user.email)) {
        savedAccounts.push({
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url,
          name: user.user_metadata?.full_name || user.email
        })
        localStorage.setItem('availableAccounts', JSON.stringify(savedAccounts))
      }

      setAvailableAccounts(savedAccounts)
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
    }
  }

  const checkAutoLogin = async () => {
    const autoLoginEnabled = localStorage.getItem('autoLoginEnabled') === 'true'
    const lastUsedEmail = localStorage.getItem('lastUsedEmail')

    if (autoLoginEnabled && lastUsedEmail) {
      const savedAccounts = JSON.parse(localStorage.getItem('availableAccounts') || '[]')
      const account = savedAccounts.find((acc: any) => acc.email === lastUsedEmail)
      
      if (account) {
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              queryParams: {
                login_hint: account.email
              }
            }
          })

          if (error) throw error
        } catch (error) {
          console.error('Erro no login automático:', error)
        }
      }
    }
  }

  const handleAccountSelect = async (account: any) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            login_hint: account.email
          }
        }
      })

      if (error) throw error

      // Salvar email para auto login
      localStorage.setItem('lastUsedEmail', account.email)
      localStorage.setItem('autoLoginEnabled', 'true')

      setShowAccountsDropdown(false)
    } catch (error) {
      console.error('Erro ao selecionar conta:', error)
      toast.error('Erro ao fazer login com a conta selecionada')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor, confirme seu email antes de fazer login')
        } else {
          toast.error('Erro ao fazer login. Tente novamente.')
        }
        return
      }

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (!profile) {
          // Verificar limite de usuários
          const { count } = await supabase
            .from('user_profiles')
            .select('*', { count: 'exact' })

          if (count && count >= 5) {
            await supabase.auth.signOut()
            toast.error('Limite de usuários atingido. Entre em contato com o administrador.')
            return
          }

          // Criar perfil do usuário
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{ user_id: user.id }])

          if (profileError) {
            console.error('Erro ao criar perfil:', profileError)
            toast.error('Erro ao criar perfil de usuário')
            return
          }
        }

        // Salvar email para auto login
        localStorage.setItem('lastUsedEmail', user.email || '')
        localStorage.setItem('autoLoginEnabled', 'true')

        toast.success('Login realizado com sucesso!')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Erro detalhado:', error)
        if (error.message.includes('not enabled')) {
          toast.error('Login com Google não está habilitado. Verifique as configurações.')
        } else {
          toast.error(`Erro ao fazer login com Google: ${error.message}`)
        }
        return
      }

      if (data) {
        toast.success('Redirecionando para autenticação do Google...')
      }
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error)
      toast.error('Erro ao conectar com Google. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8 select-text">
      {/* Dropdown de contas disponíveis */}
      <div className="fixed top-4 right-4">
        {availableAccounts.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAccountsDropdown(!showAccountsDropdown)}
              className="flex items-center space-x-2 bg-white rounded-lg shadow-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>Trocar conta</span>
            </button>

            {showAccountsDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-1 z-50">
                {availableAccounts.map((account, index) => (
                  <button
                    key={index}
                    onClick={() => handleAccountSelect(account)}
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                  >
                    {account.avatar_url ? (
                      <Image
                        src={account.avatar_url}
                        alt="Avatar"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{account.name}</span>
                      <span className="text-xs text-gray-500">{account.email}</span>
                    </div>
                  </button>
                ))}
                
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center space-x-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Adicionar outra conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Faça login na sua conta
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou continue com</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/register"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 