'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PlusIcon, TrashIcon, EyeIcon, PhotoIcon, ClipboardDocumentListIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { FormField } from '@/types/landingpage'
import { Switch } from '@/components/ui/switch'

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
    useCustomHtml: false
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

      // Validar campos obrigatórios
      if (!formData.title.trim()) {
        throw new Error('O título é obrigatório')
      }

      // Preparar dados para inserção
      const landingPageData = {
        title: formData.title,
        description: formData.description,
        logo_url: formData.logoPreview || null,
        background_url: formData.backgroundPreview || null,
        form_fields: formData.formFields,
        custom_html: formData.customHtml,
        button_text: formData.buttonText || 'Enviar',
        button_color: formData.buttonColor || '#3182ce',
        use_custom_html: formData.useCustomHtml,
        status: 'draft',
        user_id: user.id,
      }

      // Upload logo if exists
      if (formData.logo) {
        const logoPath = `public/${user.id}/${Date.now()}_${formData.logo.name}`
        const { error: logoError } = await supabase.storage
          .from('landing-pages')
          .upload(logoPath, formData.logo)
        if (logoError) throw logoError
        landingPageData.logo_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/landing-pages/${logoPath}`
      }

      // Upload background if exists
      if (formData.backgroundImage) {
        const bgPath = `public/${user.id}/${Date.now()}_${formData.backgroundImage.name}`
        const { error: bgError } = await supabase.storage
          .from('landing-pages')
          .upload(bgPath, formData.backgroundImage)
        if (bgError) throw bgError
        landingPageData.background_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/landing-pages/${bgPath}`
      }

      const { data, error } = await supabase
        .from('landing_pages')
        .insert([landingPageData])
        .select()
        .single()

      if (error) throw error

      toast.success('Landing page criada com sucesso!')
      router.push('/dashboard/landing-pages')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Erro ao criar landing page')
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nova Landing Page</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Crie uma landing page profissional para capturar leads
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewMode(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
          >
            <EyeIcon className="h-5 w-5 mr-2" />
            Visualizar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seção de Informações Básicas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-primary mr-2" />
                Informações Básicas
              </h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors duration-200"
                    placeholder="Ex: Ebook Gratuito: Guia Completo de Marketing Digital"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors duration-200"
                    rows={4}
                    placeholder="Descreva o que você está oferecendo..."
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Mídia */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <PhotoIcon className="h-6 w-6 text-primary mr-2" />
                Mídia
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Logo
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary transition-colors duration-200">
                    <div className="space-y-1 text-center">
                      {formData.logoPreview ? (
                        <div className="relative group">
                          <Image
                            src={formData.logoPreview}
                            alt="Logo preview"
                            width={200}
                            height={200}
                            className="mx-auto h-32 w-auto object-contain rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, logo: null, logoPreview: '' })}
                              className="text-white hover:text-red-500 transition-colors duration-200"
                            >
                              <TrashIcon className="h-6 w-6" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600 dark:text-gray-400">
                            <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                              <span>Upload da logo</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 'logo')}
                                className="sr-only"
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF até 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Imagem de Fundo
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary transition-colors duration-200">
                    <div className="space-y-1 text-center">
                      {formData.backgroundPreview ? (
                        <div className="relative group">
                          <Image
                            src={formData.backgroundPreview}
                            alt="Background preview"
                            width={400}
                            height={200}
                            className="mx-auto h-32 w-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, backgroundImage: null, backgroundPreview: '' })}
                              className="text-white hover:text-red-500 transition-colors duration-200"
                            >
                              <TrashIcon className="h-6 w-6" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600 dark:text-gray-400">
                            <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                              <span>Upload do background</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageChange(e, 'backgroundImage')}
                                className="sr-only"
                              />
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF até 10MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção do Formulário */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <ClipboardDocumentListIcon className="h-6 w-6 text-primary mr-2" />
                Formulário
              </h2>

              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={useCustomHtml}
                    onChange={setUseCustomHtml}
                    className={`${
                      useCustomHtml ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200`}
                  >
                    <span className="sr-only">Usar HTML personalizado</span>
                    <span
                      className={`${
                        useCustomHtml ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
                    />
                  </Switch>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usar HTML personalizado
                  </span>
                </div>

                {useCustomHtml ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      HTML Personalizado
                    </label>
                    <textarea
                      value={formData.customHtml}
                      onChange={(e) => setFormData({ ...formData, customHtml: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm transition-colors duration-200"
                      rows={8}
                      placeholder="<form>...</form>"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {formData.formFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Campo {index + 1}
                            </h3>
                            <button
                              type="button"
                              onClick={() => removeFormField(field.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tipo
                              </label>
                              <select
                                value={field.type}
                                onChange={(e) => updateFormField(field.id, { type: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors duration-200"
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
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Label
                              </label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) => updateFormField(field.id, { label: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors duration-200"
                                placeholder="Ex: Nome completo"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Placeholder
                              </label>
                              <input
                                type="text"
                                value={field.placeholder}
                                onChange={(e) => updateFormField(field.id, { placeholder: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors duration-200"
                                placeholder="Ex: Digite seu nome completo"
                              />
                            </div>

                            <div className="flex items-center space-x-3">
                              <Switch
                                checked={field.required}
                                onChange={(checked: boolean) => updateFormField(field.id, { required: checked })}
                                className={`${
                                  field.required ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200`}
                              >
                                <span className="sr-only">Campo obrigatório</span>
                                <span
                                  className={`${
                                    field.required ? 'translate-x-6' : 'translate-x-1'
                                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
                                />
                              </Switch>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Campo obrigatório
                              </span>
                            </div>
                          </div>

                          {field.type === 'select' && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Opções (uma por linha)
                              </label>
                              <textarea
                                value={field.options?.join('\n')}
                                onChange={(e) => updateFormField(field.id, { 
                                  options: e.target.value.split('\n').filter(Boolean)
                                })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors duration-200"
                                rows={4}
                                placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addFormField}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
                    >
                      <PlusIcon className="h-5 w-5 mr-2 text-gray-400" />
                      Adicionar Campo
                    </button>

                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Texto do Botão
                        </label>
                        <input
                          type="text"
                          value={formData.buttonText}
                          onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors duration-200"
                          placeholder="Ex: Enviar"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cor do Botão
                        </label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="color"
                            value={formData.buttonColor}
                            onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                            className="h-10 w-20 rounded cursor-pointer"
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formData.buttonColor.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Criando...
                </div>
              ) : (
                'Criar Landing Page'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 