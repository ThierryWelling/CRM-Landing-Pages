import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface UserSettings {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'system'
  language: 'pt-BR' | 'en-US' | 'es'
  color_scheme: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  theme_id?: string
  notifications_enabled: boolean
  email_notifications: boolean
  created_at: string
  updated_at: string
}

export interface UseUserSettingsReturn {
  settings: UserSettings | null
  loading: boolean
  error: Error | null
  createSettings: (settings: Partial<UserSettings>) => Promise<void>
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>
  deleteSettings: () => Promise<void>
  applyTheme: (settings: UserSettings) => void
  refetch: () => Promise<void>
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Erro ao buscar usuário:', userError)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Configurações não encontradas, criar padrão
          const defaultSettings = {
            user_id: user.id,
            theme: 'system' as const,
            language: 'pt-BR' as const,
            color_scheme: {
              primary: '#3B82F6',
              secondary: '#6B7280',
              background: '#F3F4F6',
              text: '#111827'
            },
            notifications_enabled: true,
            email_notifications: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { data: newSettings, error: createError } = await supabase
            .from('user_settings')
            .insert([defaultSettings])
            .select()
            .single()

          if (createError) {
            console.error('Erro ao criar configurações:', createError)
          } else {
            setSettings(newSettings)
          }
        } else {
          console.error('Erro ao buscar configurações:', error)
        }
      } else {
        setSettings(data)
      }

      setLoading(false)
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      setLoading(false)
    }
  }

  const createSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('user_settings')
        .insert([
          {
            user_id: user.id,
            ...newSettings
          }
        ])
        .select()
        .single()

      if (error) throw error

      setSettings(data)
      applyTheme(data)
      toast.success('Configurações criadas com sucesso')
    } catch (err) {
      setError(err as Error)
      toast.error('Erro ao criar configurações')
    }
  }

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!settings?.user_id) return

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', settings.user_id)
        .select()
        .single()

      if (error) throw error

      setSettings(data)
      toast.success('Configurações atualizadas com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      toast.error('Erro ao atualizar configurações')
    }
  }

  const deleteSettings = async () => {
    if (!settings?.user_id) return

    try {
      const { error } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', settings.user_id)

      if (error) throw error

      setSettings(null)
      toast.success('Configurações removidas com sucesso')
    } catch (err) {
      setError(err as Error)
      toast.error('Erro ao remover configurações')
    }
  }

  const applyTheme = (settings: UserSettings) => {
    // Aplicar tema (dark/light)
    const theme = settings.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme

    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(theme)
    
    // Aplicar cores personalizadas
    const root = document.documentElement
    root.style.setProperty('--color-primary', settings.color_scheme.primary)
    root.style.setProperty('--color-secondary', settings.color_scheme.secondary)
    root.style.setProperty('--color-background', settings.color_scheme.background)
    root.style.setProperty('--color-text', settings.color_scheme.text)
  }

  return {
    settings,
    loading,
    error,
    createSettings,
    updateSettings,
    deleteSettings,
    applyTheme,
    refetch: fetchSettings
  }
} 