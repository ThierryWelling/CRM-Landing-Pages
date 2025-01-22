'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { ChartBarIcon, GlobeAltIcon, UserIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function LandingPageDetails({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const pageId = params.id

  useEffect(() => {
    fetchLandingPage()
    fetchSubmissions()
  }, [pageId])

  const fetchLandingPage = async () => {
    try {
      const { data: userDataResponse } = await supabase.auth.getUser()
      setUserData(userDataResponse)
      
      if (!userDataResponse?.user) {
        router.push('/')
        return
      }

      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', pageId)
        .single()

      if (error) throw error
      setPage(data)

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
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro ao carregar landing page')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async () => {
    try {
      const { data: userDataResponse } = await supabase.auth.getUser()
      if (!userDataResponse?.user) return

      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('landing_page_id', pageId)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro ao carregar submissões')
    }
  }

  const handleDelete = async () => {
    if (!page || page.user_id !== userData?.user?.id) return

    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', page.id)

      if (error) throw error

      toast.success('Landing page excluída com sucesso')
      router.push('/dashboard/landing-pages')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro ao excluir landing page')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Landing page não encontrada</h1>
          <p className="text-gray-600 mb-4">A página que você está procurando não existe ou foi removida.</p>
          <Link
            href="/dashboard/landing-pages"
            className="text-blue-600 hover:text-blue-800"
          >
            Voltar para landing pages
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = page.user_id === userData?.user?.id

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{page.title}</h1>
              <p className="text-gray-600">{page.description}</p>
            </div>
            {isOwner && (
              <div className="flex items-center gap-4">
                <Link
                  href={`/dashboard/landing-pages/${page.id}/edit`}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <PencilIcon className="w-5 h-5" />
                  Editar
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="w-5 h-5" />
                  Excluir
                </button>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <GlobeAltIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">URL Pública</p>
                  <Link
                    href={`/landing-pages/${page.id}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Visualizar página
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Visitas</p>
                  <p className="font-semibold">{page.visits || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Taxa de Conversão</p>
                  <p className="font-semibold">{page.conversion_rate || 0}%</p>
                </div>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="mt-8 pt-6 border-t">
              <h2 className="text-xl font-semibold mb-4">Submissões do Formulário</h2>
              {submissions.length === 0 ? (
                <p className="text-gray-600">Nenhuma submissão ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        {Object.keys(submissions[0].form_data).map(key => (
                          <th
                            key={key}
                            className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {submissions.map((submission, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(submission.submitted_at).toLocaleString()}
                          </td>
                          {Object.values(submission.form_data).map((value: any, i) => (
                            <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmar exclusão
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir esta landing page? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 