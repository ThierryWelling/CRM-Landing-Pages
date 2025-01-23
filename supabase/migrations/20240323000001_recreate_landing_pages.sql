-- Criar a tabela landing_pages
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visits INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  logo_url TEXT,
  background_url TEXT,
  form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_html TEXT,
  button_text TEXT DEFAULT 'Enviar',
  button_color TEXT DEFAULT '#3182ce',
  use_custom_html BOOLEAN DEFAULT false
);

-- Criar índice para busca em form_fields
CREATE INDEX IF NOT EXISTS landing_pages_form_fields_gin_idx ON landing_pages USING gin(form_fields);

-- Habilitar Row Level Security
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- Criar políticas de RLS
DROP POLICY IF EXISTS "Permitir visualização pública de landing pages publicadas" ON landing_pages;
CREATE POLICY "Permitir visualização pública de landing pages publicadas" ON landing_pages
  FOR SELECT USING (status = 'published' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir usuários autenticados criar landing pages" ON landing_pages;
CREATE POLICY "Permitir usuários autenticados criar landing pages" ON landing_pages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir usuários autenticados atualizar suas landing pages" ON landing_pages;
CREATE POLICY "Permitir usuários autenticados atualizar suas landing pages" ON landing_pages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir usuários autenticados deletar suas landing pages" ON landing_pages;
CREATE POLICY "Permitir usuários autenticados deletar suas landing pages" ON landing_pages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Criar bucket para armazenamento de imagens se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-pages', 'landing-pages', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes de storage
DROP POLICY IF EXISTS "Permitir upload de imagens por usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura pública de imagens" ON storage.objects;

-- Criar política para permitir upload de imagens
CREATE POLICY "Permitir upload de imagens por usuários autenticados"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'landing-pages' AND (storage.foldername(name))[1] = 'public');

-- Criar política para permitir leitura pública de imagens
CREATE POLICY "Permitir leitura pública de imagens"
ON storage.objects FOR SELECT
USING (bucket_id = 'landing-pages'); 