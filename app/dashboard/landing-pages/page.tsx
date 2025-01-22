'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PlusIcon, ChartBarIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { LandingPage } from '@/types/landingpage'
import Link from 'next/link'
import { Plus, FileText, Settings, ExternalLink } from 'lucide-react'

export default function LandingPages() {
  const router = useRouter()
  const [pages, setPages] = useState<LandingPage[]>([])
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    fetchLandingPages()
  }, [])

  const fetchLandingPages = async () => {
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
        .order('created_at', { ascending: false })

      if (error) throw error

      setPages(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro ao carregar landing pages')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta landing page?')) return

    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Landing page excluída com sucesso')
      fetchLandingPages()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Erro ao excluir landing page')
    }
  }

  const handleCreateNew = () => {
    router.push('/dashboard/landing-pages/new')
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Landing Pages</h1>
          <Link
            href="/dashboard/landing-pages/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Plus className="h-5 w-5" />
            Nova Landing Page
          </Link>
        </div>

        {pages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center bg-white dark:bg-neutral-800 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-2 text-sm font-semibold">Nenhuma landing page criada</h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Comece criando uma nova landing page para seu negócio
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page) => (
              <div
                key={page.id}
                className="flex flex-col bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden"
              >
                <div className="p-4">
                  <h3 className="text-lg font-semibold line-clamp-1">{page.title}</h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                    {page.description}
                  </p>
                </div>
                <div className="mt-auto p-4 flex items-center justify-center gap-2 border-t border-neutral-200 dark:border-neutral-700">
                  <Link
                    href={`/dashboard/landing-pages/${page.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Settings className="h-4 w-4" />
                    Detalhes
                  </Link>
                  <Link
                    href={`/landing-pages/${page.id}/view`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-900 dark:text-white shadow-sm hover:bg-neutral-200 dark:hover:bg-neutral-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visitar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 