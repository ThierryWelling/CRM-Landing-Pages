'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session) {
          // Verificar/criar perfil do usuário
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()

          if (!profile && !profileError) {
            // Criar perfil se não existir
            await supabase
              .from('user_profiles')
              .insert([{
                user_id: session.user.id,
                email: session.user.email,
                created_at: new Date().toISOString()
              }])
          }

          // Ativar login automático
          localStorage.setItem('autoLogin', 'true')
          
          // Redirecionar para o dashboard
          router.replace('/dashboard')
        } else {
          router.replace('/login')
        }
      } catch (error) {
        console.error('Erro no callback:', error)
        router.replace('/login')
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