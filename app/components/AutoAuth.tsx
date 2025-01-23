'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AutoAuth() {
  const router = useRouter()

  useEffect(() => {
    const checkAndSignIn = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          // Se não houver sessão, tenta fazer login com Google
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`
            }
          })

          if (error) throw error
        }
      } catch (error) {
        console.error('Erro na autenticação:', error)
      }
    }

    checkAndSignIn()
  }, [])

  return null
} 