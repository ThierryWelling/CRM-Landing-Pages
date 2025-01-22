import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lymqgttoigdawckuwstw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5bXFndHRvaWdkYXdja3V3c3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MDI1MzMsImV4cCI6MjA1Mjk3ODUzM30.OAvrMAbhamTB3zmU-5JIJwyQXheDUP89qN-a9WqH_10'

export const supabase = createClient(supabaseUrl, supabaseKey) 