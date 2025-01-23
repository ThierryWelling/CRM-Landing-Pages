-- Create landing_pages table
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  user_id UUID REFERENCES auth.users(id),
  visits INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create RLS policies
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários vejam suas próprias landing pages
CREATE POLICY "Usuários podem ver suas próprias landing pages" ON landing_pages
  FOR SELECT USING (auth.uid() = user_id);

-- Permitir que usuários criem landing pages associadas a eles
CREATE POLICY "Usuários podem criar suas próprias landing pages" ON landing_pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários atualizem suas próprias landing pages
CREATE POLICY "Usuários podem atualizar suas próprias landing pages" ON landing_pages
  FOR UPDATE USING (auth.uid() = user_id);

-- Permitir que usuários deletem suas próprias landing pages
CREATE POLICY "Usuários podem deletar suas próprias landing pages" ON landing_pages
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column(); 