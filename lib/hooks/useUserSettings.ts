import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'pt-BR' | 'en-US' | 'es'
  color_scheme: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  theme_id?: string
}

export interface UseUserSettingsReturn {
  settings: UserSettings | null
  loading: boolean
  error: Error | null
  createSettings: (settings: Partial<UserSettings>) => Promise<void>
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>
  deleteSettings: () => Promise<void>
  applyTheme: (settings: UserSettings) => void
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setSettings({
          theme: data.theme,
          language: data.language,
          color_scheme: data.color_scheme,
          theme_id: data.theme_id
        })
      } else {
        // Criar configurações padrão
        const defaultSettings: UserSettings = {
          theme: 'light',
          language: 'pt-BR',
          color_scheme: {
            primary: '#3B82F6',
            secondary: '#6B7280',
            background: '#F3F4F6',
            text: '#111827'
          }
        }

        const { error: insertError } = await supabase
          .from('user_settings')
          .insert([{
            user_id: user.id,
            ...defaultSettings
          }])

        if (insertError) throw insertError
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
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
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_settings')
        .update({
          theme: newSettings.theme,
          language: newSettings.language,
          color_scheme: newSettings.color_scheme,
          theme_id: newSettings.theme_id
        })
        .eq('user_id', user.id)

      if (error) throw error

      setSettings(currentSettings => 
        currentSettings ? { ...currentSettings, ...newSettings } : null
      )
      toast.success('Configurações atualizadas com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      toast.error('Erro ao atualizar configurações')
    }
  }

  const deleteSettings = async () => {
    try {
      if (!settings) throw new Error('Nenhuma configuração encontrada')

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
    applyTheme
  }
} 