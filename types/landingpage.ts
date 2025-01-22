export type FormField = {
  id: string
  type: string
  label: string
  placeholder: string
  required: boolean
  options?: string[]
}

export type LandingPage = {
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
  visits: number
  conversions: number
  conversion_rate: number
} 