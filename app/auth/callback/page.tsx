'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        console.error('Erro na autenticação:', error)
        toast.error('Erro na autenticação')
        router.push('/')
        return
      }

      if (user) {
        // Salvar informações da conta no localStorage
        const savedAccounts = JSON.parse(localStorage.getItem('availableAccounts') || '[]')
        const accountExists = savedAccounts.some((acc: any) => acc.email === user.email)

        if (!accountExists) {
          savedAccounts.push({
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url,
            name: user.user_metadata?.full_name || user.email
          })
          localStorage.setItem('availableAccounts', JSON.stringify(savedAccounts))
        }

        // Salvar email para auto login
        localStorage.setItem('lastUsedEmail', user.email || '')
        localStorage.setItem('autoLoginEnabled', 'true')

        // Verificar se o usuário já tem um perfil
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
            router.push('/')
            return
          }

          // Criar perfil do usuário
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([{ user_id: user.id }])

          if (profileError) {
            console.error('Erro ao criar perfil:', profileError)
            toast.error('Erro ao criar perfil de usuário')
            router.push('/')
            return
          }
        }

        toast.success('Login realizado com sucesso!')
        router.push('/dashboard/landing-pages')
      } else {
        router.push('/')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Autenticando...</p>
      </div>
    </div>
  )
} 