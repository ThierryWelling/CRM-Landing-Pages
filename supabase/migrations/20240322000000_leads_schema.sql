-- Create leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
  form_fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de campos do formulário com seus tipos
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Dados do formulário preenchido
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted')),
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
CREATE INDEX leads_form_data_gin_idx ON leads USING gin(form_data); -- Índice para busca em JSONB
CREATE INDEX leads_form_fields_gin_idx ON leads USING gin(form_fields); -- Índice para busca nos campos do formulário

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

-- Criar função para validar os campos do formulário
CREATE OR REPLACE FUNCTION validate_form_fields()
RETURNS TRIGGER AS $$
DECLARE
  field JSONB;
  field_type TEXT;
  field_value TEXT;
  field_label TEXT;
BEGIN
  -- Validar se form_fields é um array
  IF NOT jsonb_typeof(NEW.form_fields) = 'array' THEN
    RAISE EXCEPTION 'form_fields deve ser um array';
  END IF;

  -- Validar se form_data é um objeto
  IF NOT jsonb_typeof(NEW.form_data) = 'object' THEN
    RAISE EXCEPTION 'form_data deve ser um objeto';
  END IF;

  -- Validar cada campo do formulário
  FOR field IN SELECT * FROM jsonb_array_elements(NEW.form_fields)
  LOOP
    field_type := field->>'type';
    field_label := field->>'label';
    field_value := NEW.form_data->>field_label;

    -- Validar campos obrigatórios
    IF (field->>'required')::boolean = true AND (field_value IS NULL OR field_value = '') THEN
      RAISE EXCEPTION 'O campo % é obrigatório', field_label;
    END IF;

    -- Validar tipos específicos
    CASE field_type
      WHEN 'email' THEN
        IF field_value IS NOT NULL AND field_value != '' AND field_value !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
          RAISE EXCEPTION 'O campo % deve ser um email válido', field_label;
        END IF;
      WHEN 'tel' THEN
        IF field_value IS NOT NULL AND field_value != '' AND length(regexp_replace(field_value, '\D', '', 'g')) < 10 THEN
          RAISE EXCEPTION 'O campo % deve ser um telefone válido com pelo menos 10 dígitos', field_label;
        END IF;
      WHEN 'number' THEN
        IF field_value IS NOT NULL AND field_value != '' AND field_value !~ '^\d+$' THEN
          RAISE EXCEPTION 'O campo % deve ser um número válido', field_label;
        END IF;
      WHEN 'select' THEN
        IF field_value IS NOT NULL AND field_value != '' AND NOT field_value = ANY(ARRAY(SELECT jsonb_array_elements_text(field->'options'))) THEN
          RAISE EXCEPTION 'O valor selecionado para o campo % não é válido', field_label;
        END IF;
    END CASE;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar os campos antes de inserir ou atualizar
CREATE TRIGGER validate_lead_fields
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE PROCEDURE validate_form_fields(); 