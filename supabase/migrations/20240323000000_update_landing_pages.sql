-- Adicionar novos campos na tabela landing_pages
ALTER TABLE landing_pages
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS background_url TEXT,
  ADD COLUMN IF NOT EXISTS form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_html TEXT,
  ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT 'Enviar',
  ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#3182ce',
  ADD COLUMN IF NOT EXISTS use_custom_html BOOLEAN DEFAULT false;

-- Criar índice para busca em form_fields
CREATE INDEX IF NOT EXISTS landing_pages_form_fields_gin_idx ON landing_pages USING gin(form_fields);

-- Remover campo url que não é mais necessário
ALTER TABLE landing_pages DROP COLUMN IF EXISTS url;

-- Atualizar as políticas de RLS para permitir acesso público às landing pages publicadas
DROP POLICY IF EXISTS "Permitir visualização pública de landing pages publicadas" ON landing_pages;
CREATE POLICY "Permitir visualização pública de landing pages publicadas" ON landing_pages
  FOR SELECT USING (status = 'published' OR auth.uid() = user_id);

-- Criar bucket para armazenamento de imagens se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-pages', 'landing-pages', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes
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