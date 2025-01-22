-- Create leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
  form_data JSONB NOT NULL, -- Armazena os campos personalizados do formulário
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT, -- Origem do lead (ex: facebook, google, direto)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index for better performance on queries
CREATE INDEX leads_landing_page_id_idx ON leads(landing_page_id);
CREATE INDEX leads_created_at_idx ON leads(created_at);
CREATE INDEX leads_status_idx ON leads(status);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies for leads table
-- Permitir que usuários autenticados possam ver leads das suas landing pages
CREATE POLICY "Usuários podem ver leads das suas landing pages" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM landing_pages lp 
      WHERE lp.id = leads.landing_page_id 
      AND lp.user_id = auth.uid()
    )
  );

-- Permitir inserção de leads por qualquer pessoa (formulário público)
CREATE POLICY "Permitir inserção de leads" ON leads
  FOR INSERT WITH CHECK (true);

-- Permitir que usuários autenticados possam atualizar leads das suas landing pages
CREATE POLICY "Usuários podem atualizar leads das suas landing pages" ON leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM landing_pages lp 
      WHERE lp.id = leads.landing_page_id 
      AND lp.user_id = auth.uid()
    )
  );

-- Permitir que usuários autenticados possam deletar leads das suas landing pages
CREATE POLICY "Usuários podem deletar leads das suas landing pages" ON leads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM landing_pages lp 
      WHERE lp.id = leads.landing_page_id 
      AND lp.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column(); 