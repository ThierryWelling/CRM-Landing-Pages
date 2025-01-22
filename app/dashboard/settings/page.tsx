'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useUserSettings } from '@/lib/hooks/useUserSettings'
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  SwatchIcon,
  UserGroupIcon,
  PaintBrushIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

interface Theme {
  id: string
  name: string
  description: string
  color_scheme: {
    primary: string
    secondary: string
    background: string
    text: string
  }
  is_dark: boolean
}

interface UserProfile {
  id: string
  user_id: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

interface UserSettingsForm {
  theme: 'light' | 'dark' | 'system'
  language: 'pt-BR' | 'en-US' | 'es'
  colorScheme: {
    primary: string
    secondary: string
    background: string
    text: string
  }
}

const languages = [
  { value: 'pt-BR', label: 'Português (Brasil)', icon: '🇧🇷' },
  { value: 'en-US', label: 'English (US)', icon: '🇺🇸' },
  { value: 'es', label: 'Español', icon: '🇪🇸' }
]

const themes = [
  { value: 'light', label: 'Claro', icon: SunIcon },
  { value: 'dark', label: 'Escuro', icon: MoonIcon },
  { value: 'system', label: 'Sistema', icon: ComputerDesktopIcon }
]

export default function SettingsPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const { settings, updateSettings, loading: settingsLoading, applyTheme } = useUserSettings()
  const [predefinedThemes, setPredefinedThemes] = useState<Theme[]>([])
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)
  const [userSettings, setUserSettings] = useState<UserSettingsForm>({
    theme: 'system',
    language: 'pt-BR',
    colorScheme: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      background: '#F3F4F6',
      text: '#111827'
    }
  })

  useEffect(() => {
    fetchUsers()
    checkCurrentUser()
    fetchThemes()
  }, [])

  useEffect(() => {
    if (settings) {
      setUserSettings({
        theme: settings.theme,
        language: settings.language,
        colorScheme: settings.color_scheme
      })
      setSelectedThemeId(settings.theme_id || null)
    }
  }, [settings])

  const fetchThemes = async () => {
    try {
      const { data: themes, error } = await supabase
        .from('themes')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setPredefinedThemes(themes)
    } catch (error) {
      console.error('Erro ao buscar temas:', error)
      toast.error('Erro ao carregar temas')
    }
  }

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      setCurrentUser(data)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select(`
          *,
          auth_users:user_id (
            email
          )
        `)
        .order('created_at', { ascending: true })

      if (profiles) {
        setUsers(profiles.map(profile => ({
          ...profile,
          email: profile.auth_users?.email || ''
        })))
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (currentUser?.role !== 'admin') {
      toast.error('Apenas administradores podem remover usuários')
      return
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      toast.success('Usuário removido com sucesso')
      fetchUsers()
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
      toast.error('Erro ao remover usuário')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateSettings({
        theme: userSettings.theme,
        language: userSettings.language,
        color_scheme: userSettings.colorScheme
      })
      
      toast.success('Configurações atualizadas com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      toast.error('Erro ao atualizar configurações')
    }
  }

  const handleThemeSelect = (theme: Theme) => {
    setSelectedThemeId(theme.id)
    setUserSettings({
      ...userSettings,
      colorScheme: theme.color_scheme,
      theme: theme.is_dark ? 'dark' : 'light'
    })
  }

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gerencie suas preferências e personalize sua experiência
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card de Aparência */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <PaintBrushIcon className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">Aparência</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Temas Predefinidos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Temas Predefinidos
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {predefinedThemes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => handleThemeSelect(theme)}
                          className={`flex flex-col items-start p-4 rounded-lg border-2 transition-all
                            ${selectedThemeId === theme.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
                          style={{
                            background: theme.color_scheme.background,
                            color: theme.color_scheme.text
                          }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ background: theme.color_scheme.primary }}
                            />
                            <span className="font-medium">{theme.name}</span>
                          </div>
                          <p className="text-sm opacity-80">{theme.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seleção de Tema */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Modo
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {themes.map((theme) => {
                        const Icon = theme.icon
                        return (
                          <button
                            key={theme.value}
                            onClick={() => setUserSettings({...userSettings, theme: theme.value as any})}
                            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                              ${userSettings.theme === theme.value 
                                ? 'border-primary bg-primary/5 text-primary' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
                          >
                            <Icon className="h-6 w-6 mb-2" />
                            <span className="text-sm font-medium">{theme.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Cores Personalizadas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Cores Personalizadas
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm text-gray-500 dark:text-gray-400">Cor Primária</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={userSettings.colorScheme.primary}
                            onChange={(e) => setUserSettings({
                              ...userSettings,
                              colorScheme: {...userSettings.colorScheme, primary: e.target.value}
                            })}
                            className="h-10 w-full rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm text-gray-500 dark:text-gray-400">Cor Secundária</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={userSettings.colorScheme.secondary}
                            onChange={(e) => setUserSettings({
                              ...userSettings,
                              colorScheme: {...userSettings.colorScheme, secondary: e.target.value}
                            })}
                            className="h-10 w-full rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Idioma */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <GlobeAltIcon className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">Idioma e Região</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Selecione seu idioma
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {languages.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => setUserSettings({...userSettings, language: lang.value as any})}
                          className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
                            ${userSettings.language === lang.value 
                              ? 'border-primary bg-primary/5 text-primary' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
                        >
                          <span className="text-xl">{lang.icon}</span>
                          <span className="text-sm font-medium">{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Salvar */}
          <div className="flex justify-start">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors
                flex items-center justify-center gap-2 font-medium"
            >
              <SwatchIcon className="h-5 w-5" />
              Salvar Preferências
            </button>
          </div>

          {/* Lista de Usuários (apenas para admin) */}
          {currentUser?.role === 'admin' && (
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-6">
                <UserGroupIcon className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold">Gerenciar Usuários</h2>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Usuário
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Função
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Data de Cadastro
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300'}`}>
                              {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {currentUser?.role === 'admin' && user.role !== 'admin' && (
                              <button
                                onClick={() => handleRemoveUser(user.user_id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium"
                              >
                                Remover
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 