'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Primeiro tenta pegar o código da URL
        const hashParams = new URLSearchParams(window.location.search)
        const code = hashParams.get('code')

        if (code) {
          // Se tiver código, troca por uma sessão
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) throw error
          
          if (data.session) {
            // Verificar/criar perfil do usuário
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', data.session.user.id)
              .single()

            if (!profile && !profileError) {
              // Criar perfil se não existir
              await supabase
                .from('user_profiles')
                .insert([{
                  user_id: data.session.user.id,
                  email: data.session.user.email,
                  created_at: new Date().toISOString()
                }])
            }

            // Ativar login automático
            localStorage.setItem('autoLogin', 'true')
            
            // Redirecionar para o dashboard usando replace
            router.replace('/dashboard')
            return
          }
        }

        // Se não tiver código ou falhar, tenta pegar a sessão atual
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session) {
          // Usar replace para evitar histórico de navegação
          router.replace('/dashboard')
        } else {
          // Se não houver sessão, redirecionar para a página inicial
          router.replace('/')
        }
      } catch (error) {
        console.error('Erro no callback:', error)
        router.replace('/')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  )
} 