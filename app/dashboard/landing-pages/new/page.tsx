'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { FormField } from '@/types/landingpage'

export default function NewLandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [useCustomHtml, setUseCustomHtml] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    logo: null as File | null,
    logoPreview: '',
    backgroundImage: null as File | null,
    backgroundPreview: '',
    customHtml: '',
    formFields: [] as FormField[],
    buttonText: 'Enviar',
    buttonColor: '#3182ce',
  })

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'backgroundImage') => {
    const file = e.target.files?.[0]
    if (file) {
      const preview = URL.createObjectURL(file)
      setFormData(prev => ({
        ...prev,
        [type]: file,
        [`${type}Preview`]: preview
      }))
    }
  }

  const addFormField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: 'text',
      label: '',
      placeholder: '',
      required: false
    }
    setFormData(prev => ({
      ...prev,
      formFields: [...prev.formFields, newField]
    }))
  }

  const updateFormField = (id: string, field: Partial<FormField>) => {
    setFormData(prev => ({
      ...prev,
      formFields: prev.formFields.map(f => 
        f.id === id ? { ...f, ...field } : f
      )
    }))
  }

  const removeFormField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      formFields: prev.formFields.filter(f => f.id !== id)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      const { data, error } = await supabase.from('landing_pages').insert([
        {
          ...formData,
          status: 'draft',
          user_id: user.id,
        }
      ]).select().single()

      if (error) throw error

      toast.success('Landing page criada com sucesso!')
      router.push(`/dashboard/landing-pages/${data.id}/edit`)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro ao criar landing page')
    } finally {
      setLoading(false)
    }
  }

  if (previewMode) {
    return (
      <div className="min-h-screen">
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setPreviewMode(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar à edição
          </button>
        </div>
        <div 
          className="min-h-screen bg-cover bg-center"
          style={{ backgroundImage: formData.backgroundPreview ? `url(${formData.backgroundPreview})` : undefined }}
        >
          <div className="min-h-screen bg-black bg-opacity-50 flex flex-col items-center justify-center p-8">
            {formData.logoPreview && (
              <div className="mb-8">
                <Image
                  src={formData.logoPreview}
                  alt="Logo"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>
            )}
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
              <h1 className="text-3xl font-bold text-center mb-4">{formData.title}</h1>
              <p className="text-gray-600 text-center mb-8">{formData.description}</p>
              
              {useCustomHtml ? (
                <div dangerouslySetInnerHTML={{ __html: formData.customHtml }} />
              ) : (
                <form className="space-y-6">
                  {formData.formFields.map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required={field.required}
                        >
                          <option value="">Selecione...</option>
                          {field.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      )}
                    </div>
                  ))}
                  <button
                    type="submit"
                    style={{ backgroundColor: formData.buttonColor }}
                    className="w-full py-3 px-4 text-white rounded-md hover:opacity-90 transition-opacity"
                  >
                    {formData.buttonText}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Nova Landing Page</h1>
        <button
          type="button"
          onClick={() => setPreviewMode(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Visualizar
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, 'logo')}
                className="w-full"
              />
              {formData.logoPreview && (
                <div className="mt-2">
                  <Image
                    src={formData.logoPreview}
                    alt="Logo preview"
                    width={200}
                    height={200}
                    className="object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagem de Fundo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, 'backgroundImage')}
                className="w-full"
              />
              {formData.backgroundPreview && (
                <div className="mt-2">
                  <Image
                    src={formData.backgroundPreview}
                    alt="Background preview"
                    width={400}
                    height={200}
                    className="object-cover"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Formulário</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useCustomHtml"
                checked={useCustomHtml}
                onChange={(e) => setUseCustomHtml(e.target.checked)}
              />
              <label htmlFor="useCustomHtml" className="text-sm font-medium text-gray-700">
                Usar HTML personalizado
              </label>
            </div>

            {useCustomHtml ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HTML Personalizado
                </label>
                <textarea
                  value={formData.customHtml}
                  onChange={(e) => setFormData({ ...formData, customHtml: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono"
                  rows={10}
                  placeholder="<form>...</form>"
                />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {formData.formFields.map(field => (
                    <div key={field.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-medium">Campo do Formulário</h3>
                        <button
                          type="button"
                          onClick={() => removeFormField(field.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => updateFormField(field.id, { type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="text">Texto</option>
                            <option value="email">Email</option>
                            <option value="tel">Telefone</option>
                            <option value="number">Número</option>
                            <option value="select">Seleção</option>
                            <option value="textarea">Área de Texto</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Placeholder
                          </label>
                          <input
                            type="text"
                            value={field.placeholder}
                            onChange={(e) => updateFormField(field.id, { placeholder: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`required-${field.id}`}
                            checked={field.required}
                            onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                            className="mr-2"
                          />
                          <label htmlFor={`required-${field.id}`} className="text-sm font-medium text-gray-700">
                            Obrigatório
                          </label>
                        </div>
                      </div>
                      {field.type === 'select' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Opções (uma por linha)
                          </label>
                          <textarea
                            value={field.options?.join('\n')}
                            onChange={(e) => updateFormField(field.id, { 
                              options: e.target.value.split('\n').filter(Boolean)
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={4}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addFormField}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <PlusIcon className="w-5 h-5" />
                  Adicionar Campo
                </button>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Texto do Botão
                    </label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cor do Botão
                    </label>
                    <input
                      type="color"
                      value={formData.buttonColor}
                      onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Visualizar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Landing Page'}
          </button>
        </div>
      </form>
    </div>
  )
} 