'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Download, Filter, Search, ArrowUpDown } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { toast } from 'react-hot-toast'

type Lead = {
  id: string
  landing_page_id: string
  form_fields: Array<{
    id: string
    type: string
    label: string
    placeholder: string
    required: boolean
  }>
  form_data: Record<string, any>
  status: string
  source: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  created_at: string
  landing_page: {
    title: string
  }
}

type GroupedFields = {
  text: string[]
  email: string[]
  tel: string[]
  number: string[]
  select: string[]
  textarea: string[]
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [landingPages, setLandingPages] = useState<{id: string, title: string}[]>([])
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    landingPageId: '',
    search: '',
    status: ''
  })
  const [groupedFields, setGroupedFields] = useState<GroupedFields>({
    text: [],
    email: [],
    tel: [],
    number: [],
    select: [],
    textarea: []
  })

  useEffect(() => {
    fetchData()
    fetchLandingPages()
  }, [])

  useEffect(() => {
    if (leads.length > 0) {
      // Agrupar campos por tipo
      const grouped: GroupedFields = {
        text: [],
        email: [],
        tel: [],
        number: [],
        select: [],
        textarea: []
      }

      leads.forEach(lead => {
        lead.form_fields.forEach(field => {
          if (!grouped[field.type as keyof GroupedFields].includes(field.label)) {
            grouped[field.type as keyof GroupedFields].push(field.label)
          }
        })
      })

      setGroupedFields(grouped)
    }
  }, [leads])

  const fetchData = async () => {
    let query = supabase
      .from('leads')
      .select(`
        *,
        landing_page:landing_pages (
          title
        )
      `)
      .order('created_at', { ascending: false })

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString())
    }
    if (filters.landingPageId) {
      query = query.eq('landing_page_id', filters.landingPageId)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.search) {
      query = query.or(`form_data->>'email.ilike.%${filters.search}%,form_data->>'name.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar leads:', error)
      return
    }

    setLeads(data || [])
    setLoading(false)
  }

  const fetchLandingPages = async () => {
    const { data } = await supabase
      .from('landing_pages')
      .select('id, title')
      .order('title')

    setLandingPages(data || [])
  }

  const exportToCSV = () => {
    if (leads.length === 0) {
      toast.error('Não há leads para exportar')
      return
    }

    // Criar cabeçalhos agrupados por tipo
    const headers = [
      'Data',
      'Landing Page',
      ...groupedFields.text.map(label => `${label} (Texto)`),
      ...groupedFields.email.map(label => `${label} (Email)`),
      ...groupedFields.tel.map(label => `${label} (Telefone)`),
      ...groupedFields.number.map(label => `${label} (Número)`),
      ...groupedFields.select.map(label => `${label} (Seleção)`),
      ...groupedFields.textarea.map(label => `${label} (Área de Texto)`),
      'Origem',
      'Campanha',
      'Status'
    ]

    // Criar linhas de dados
    const csvData = leads.map(lead => [
      format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm'),
      lead.landing_page?.title,
      ...groupedFields.text.map(label => lead.form_data[label] || ''),
      ...groupedFields.email.map(label => lead.form_data[label] || ''),
      ...groupedFields.tel.map(label => lead.form_data[label] || ''),
      ...groupedFields.number.map(label => lead.form_data[label] || ''),
      ...groupedFields.select.map(label => lead.form_data[label] || ''),
      ...groupedFields.textarea.map(label => lead.form_data[label] || ''),
      lead.source || '',
      lead.utm_campaign || '',
      lead.status
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `leads_${format(new Date(), 'dd-MM-yyyy')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie todos os leads capturados nas suas landing pages
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Período Inicial
            </label>
            <DatePicker
              selected={filters.startDate}
              onChange={date => setFilters(prev => ({ ...prev, startDate: date }))}
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              placeholderText="Selecione uma data"
              locale={ptBR}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Período Final
            </label>
            <DatePicker
              selected={filters.endDate}
              onChange={date => setFilters(prev => ({ ...prev, endDate: date }))}
              dateFormat="dd/MM/yyyy"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              placeholderText="Selecione uma data"
              locale={ptBR}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Landing Page
            </label>
            <select
              value={filters.landingPageId}
              onChange={e => setFilters(prev => ({ ...prev, landingPageId: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="">Todas</option>
              {landingPages.map(page => (
                <option key={page.id} value={page.id}>{page.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="">Todos</option>
              <option value="new">Novo</option>
              <option value="contacted">Contatado</option>
              <option value="qualified">Qualificado</option>
              <option value="converted">Convertido</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar
            </label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Buscar por nome ou email..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Leads */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <span>Data</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Landing Page</th>
                
                {/* Campos de texto */}
                {groupedFields.text.map(label => (
                  <th key={`text-${label}`} className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {label} (Texto)
                  </th>
                ))}

                {/* Campos de email */}
                {groupedFields.email.map(label => (
                  <th key={`email-${label}`} className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {label} (Email)
                  </th>
                ))}

                {/* Campos de telefone */}
                {groupedFields.tel.map(label => (
                  <th key={`tel-${label}`} className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {label} (Telefone)
                  </th>
                ))}

                {/* Campos numéricos */}
                {groupedFields.number.map(label => (
                  <th key={`number-${label}`} className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {label} (Número)
                  </th>
                ))}

                {/* Campos de seleção */}
                {groupedFields.select.map(label => (
                  <th key={`select-${label}`} className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {label} (Seleção)
                  </th>
                ))}

                {/* Campos de área de texto */}
                {groupedFields.textarea.map(label => (
                  <th key={`textarea-${label}`} className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {label} (Área de Texto)
                  </th>
                ))}

                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Origem</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr 
                  key={lead.id}
                  className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {lead.landing_page?.title}
                  </td>

                  {/* Campos de texto */}
                  {groupedFields.text.map(label => (
                    <td key={`text-${label}`} className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {lead.form_data[label]}
                    </td>
                  ))}

                  {/* Campos de email */}
                  {groupedFields.email.map(label => (
                    <td key={`email-${label}`} className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {lead.form_data[label]}
                    </td>
                  ))}

                  {/* Campos de telefone */}
                  {groupedFields.tel.map(label => (
                    <td key={`tel-${label}`} className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {lead.form_data[label]}
                    </td>
                  ))}

                  {/* Campos numéricos */}
                  {groupedFields.number.map(label => (
                    <td key={`number-${label}`} className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {lead.form_data[label]}
                    </td>
                  ))}

                  {/* Campos de seleção */}
                  {groupedFields.select.map(label => (
                    <td key={`select-${label}`} className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {lead.form_data[label]}
                    </td>
                  ))}

                  {/* Campos de área de texto */}
                  {groupedFields.textarea.map(label => (
                    <td key={`textarea-${label}`} className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {lead.form_data[label]}
                    </td>
                  ))}

                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {lead.source || '-'}
                    {lead.utm_campaign && ` / ${lead.utm_campaign}`}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={lead.status}
                      onChange={async (e) => {
                        const { error } = await supabase
                          .from('leads')
                          .update({ status: e.target.value })
                          .eq('id', lead.id)
                        
                        if (!error) {
                          fetchData()
                        }
                      }}
                      className="px-2 py-1 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 border-0"
                    >
                      <option value="new">Novo</option>
                      <option value="contacted">Contatado</option>
                      <option value="qualified">Qualificado</option>
                      <option value="converted">Convertido</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 