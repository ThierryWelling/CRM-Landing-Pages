'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { User } from '@supabase/supabase-js'

export default function NewLandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        if (!session) {
          router.push('/')
          toast.error('Você precisa estar logado para criar uma landing page')
          return
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) throw userError
        
        if (!user) {
          router.push('/')
          toast.error('Usuário não encontrado')
          return
        }

        setUser(user)
      } catch (error: any) {
        console.error('Erro ao verificar autenticação:', error)
        toast.error('Erro ao verificar autenticação')
        router.push('/')
      }
    }

    checkAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Validar dados do formulário
      if (!formData.title.trim()) {
        throw new Error('O título é obrigatório')
      }

      if (!formData.url.trim()) {
        throw new Error('A URL é obrigatória')
      }

      // Tentar criar a landing page
      const { error: insertError } = await supabase
        .from('landing_pages')
        .insert([
          {
            ...formData,
            status: 'draft',
            user_id: user.id,
          },
        ])
        .select()

      if (insertError) {
        console.error('Erro Supabase:', insertError)
        throw new Error(insertError.message)
      }

      toast.success('Landing page criada com sucesso!')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar landing page')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="container mx-auto px-4 py-8">Carregando...</div>
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Nova Landing Page</h1>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Título
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            type="url"
            id="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Criar Landing Page'}
        </button>
      </form>
    </main>
  )
} 