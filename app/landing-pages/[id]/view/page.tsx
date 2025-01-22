'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { usePathname } from 'next/navigation'

interface FormField {
  id: string
  type: string
  label: string
  placeholder: string
  required: boolean
  options?: string[]
}

interface LandingPage {
  id: string
  title: string
  description: string
  logo_url: string
  background_url: string
  form_fields: FormField[]
  custom_html: string
  button_text: string
  button_color: string
  use_custom_html: boolean
  status: 'draft' | 'published'
  user_id: string
  created_at: string
  updated_at: string
  visits?: number
  conversions?: number
  conversion_rate?: number
}

export default function LandingPageView({ params }: { params: Promise<{ id: string }> }) {
  const [page, setPage] = useState<LandingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const { id: pageId } = use(params)
  const pathname = usePathname()
  const isPublicView = pathname.startsWith('/landing-pages/')

  useEffect(() => {
    if (!pageId) return
    fetchLandingPage()
  }, [pageId])

  const fetchLandingPage = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', pageId)
        .single()

      if (error) throw error
      setPage(data)

      if (isPublicView && data.status === 'published') {
        try {
          const { error: updateError } = await supabase
            .from('landing_pages')
            .update({ visits: (data.visits || 0) + 1 })
            .eq('id', pageId)

          if (updateError) {
            console.error('Erro ao incrementar visitas:', updateError)
          }
        } catch (updateError) {
          console.error('Erro ao incrementar visitas:', updateError)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro ao carregar a página')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!page || page.status !== 'published' || !isPublicView) return

    try {
      const { error: submissionError } = await supabase.from('form_submissions').insert([{
        landing_page_id: page.id,
        form_data: formData,
        submitted_at: new Date().toISOString()
      }])

      if (submissionError) throw submissionError

      const newConversions = (page.conversions || 0) + 1
      const newConversionRate = ((newConversions / (page.visits || 1)) * 100).toFixed(2)

      const { error: updateError } = await supabase
        .from('landing_pages')
        .update({ 
          conversions: newConversions,
          conversion_rate: parseFloat(newConversionRate)
        })
        .eq('id', page.id)

      if (updateError) throw updateError

      toast.success('Formulário enviado com sucesso!')
      setFormData({})
      
      setPage({
        ...page,
        conversions: newConversions,
        conversion_rate: parseFloat(newConversionRate)
      })
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro ao enviar formulário')
    }
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Página não encontrada</h1>
          <p className="text-gray-600">A página que você está procurando não existe ou foi removida.</p>
        </div>
      </div>
    )
  }

  if (page.status !== 'published') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Página em Rascunho</h1>
          <p className="text-gray-600">Esta página ainda não foi publicada e não está disponível para visualização.</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-opacity-20"
      style={{ backgroundImage: page.background_url ? `url(${page.background_url})` : undefined }}
    >
      <div className="min-h-screen bg-white bg-opacity-90 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
            {page.logo_url && (
              <div className="w-full md:w-1/2">
                <Image
                  src={page.logo_url}
                  alt="Logo"
                  width={600}
                  height={600}
                  style={{ width: '100%', height: 'auto', maxWidth: '600px', maxHeight: '600px' }}
                  className="rounded-lg"
                  priority
                />
              </div>
            )}
            
            <div className="w-full md:w-1/2">
              <div className="bg-white rounded-lg shadow-xl p-8">
                <h1 className="text-3xl font-bold text-center mb-4">{page.title}</h1>
                <p className="text-gray-600 text-center mb-8">{page.description}</p>
                
                {page.use_custom_html ? (
                  <div dangerouslySetInnerHTML={{ __html: page.custom_html }} />
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {page.form_fields.map(field => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            placeholder={field.placeholder}
                            required={field.required}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            rows={4}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            required={field.required}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">Selecione uma opção</option>
                            {field.options?.map((option, index) => (
                              <option key={index} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            required={field.required}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="submit"
                      style={{ backgroundColor: page.button_color }}
                      className="w-full py-3 px-4 rounded-md text-white font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {page.button_text || 'Enviar'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 