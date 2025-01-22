'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LandingPage } from '@/types/landingpage'
import Link from 'next/link'
import { Eye, FileText, TrendingUp, Users, ArrowUp, ArrowDown, Search, Bell } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']

type DailyStats = {
  date: string
  visits: number
  conversions: number
}

type PageStats = {
  title: string
  visits: number
}

export default function Dashboard() {
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [loading, setLoading] = useState(true)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [pageStats, setPageStats] = useState<PageStats[]>([])
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    try {
      // Buscar landing pages
      const { data: pages, error: pagesError } = await supabase
        .from('landing_pages')
        .select('*')
        .order('visits', { ascending: false })

      if (pagesError) throw pagesError
      setLandingPages(pages || [])

      // Calcular estatísticas diárias dos últimos 7 dias
      const days = 7
      const dailyStatsData: DailyStats[] = []
      
      for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), i)
        const startDate = startOfDay(date).toISOString()
        const endDate = endOfDay(date).toISOString()

        // Buscar leads do dia
        const { data: leads } = await supabase
          .from('leads')
          .select('created_at')
          .gte('created_at', startDate)
          .lte('created_at', endDate)

        // Buscar visitas do dia
        const { data: visits } = await supabase
          .from('landing_pages')
          .select('visits')
          .gte('updated_at', startDate)
          .lte('updated_at', endDate)

        dailyStatsData.unshift({
          date: format(date, 'dd/MM'),
          visits: visits?.reduce((sum, page) => sum + (page.visits || 0), 0) || 0,
          conversions: leads?.length || 0
        })
      }
      setDailyStats(dailyStatsData)

      // Preparar dados para o gráfico de pizza
      const pageStatsData = pages
        ?.slice(0, 5)
        .map(page => ({
          title: page.title,
          visits: page.visits || 0
        }))
        .sort((a, b) => b.visits - a.visits) || []

      setPageStats(pageStatsData)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      setLoading(false)
    }
  }

  const totalVisits = landingPages.reduce((sum, page) => sum + (page.visits || 0), 0)
  const totalPages = landingPages.length
  const totalLeads = landingPages.reduce((sum, page) => sum + (page.conversions || 0), 0)
  const conversionRate = totalVisits > 0 ? ((totalLeads / totalVisits) * 100).toFixed(2) : '0'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar..."
                className="pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                <span className="text-sm font-medium">US</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-green-500 flex items-center">
                <ArrowUp className="h-4 w-4 mr-1" />
                {((dailyStats[6]?.visits || 0) - (dailyStats[5]?.visits || 0)) > 0 ? '+' : ''}
                {((dailyStats[6]?.visits || 0) - (dailyStats[5]?.visits || 0))}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Visitas</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {totalVisits.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-green-500 flex items-center">
                <ArrowUp className="h-4 w-4 mr-1" />
                {landingPages.filter(p => p.status === 'published').length}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Landing Pages</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalPages}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-green-500 flex items-center">
                <ArrowUp className="h-4 w-4 mr-1" />
                {((dailyStats[6]?.conversions || 0) / (dailyStats[6]?.visits || 1) * 100).toFixed(1)}%
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxa de Conversão</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{conversionRate}%</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-medium text-green-500 flex items-center">
                <ArrowUp className="h-4 w-4 mr-1" />
                {((dailyStats[6]?.conversions || 0) - (dailyStats[5]?.conversions || 0)) > 0 ? '+' : ''}
                {((dailyStats[6]?.conversions || 0) - (dailyStats[5]?.conversions || 0))}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Leads Gerados</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {totalLeads.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Área - Visitas e Conversões */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visitas vs. Conversões</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Últimos 7 dias</p>
              </div>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
              >
                <option value="7d">7 dias</option>
                <option value="30d">30 dias</option>
                <option value="90d">90 dias</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFF',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visits"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#colorVisits)"
                    name="Visitas"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#colorConversions)"
                    name="Conversões"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Pizza - Distribuição de Tráfego */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição de Tráfego</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Por landing page</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pageStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="visits"
                    nameKey="title"
                  >
                    {pageStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tabela de Landing Pages */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Landing Pages mais visitadas</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ordenado por número de visitas</p>
              </div>
              <Link 
                href="/dashboard/landing-pages/new"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Nova Landing Page
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Título</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Visitas</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Conversões</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Taxa</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tendência</th>
                  </tr>
                </thead>
                <tbody>
                  {landingPages.map((page) => (
                    <tr 
                      key={page.id} 
                      className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <Link 
                          href={`/dashboard/landing-pages/${page.id}`}
                          className="text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary-400 font-medium"
                        >
                          {page.title}
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white">
                        {page.visits?.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-gray-900 dark:text-white">
                        {page.conversions?.toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300">
                          {((page.conversions || 0) / (page.visits || 1) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-green-500">
                          <ArrowUp className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {((page.conversions || 0) / (page.visits || 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 