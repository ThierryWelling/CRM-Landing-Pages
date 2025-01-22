-- Criar tabela de temas predefinidos
CREATE TABLE themes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color_scheme JSONB NOT NULL DEFAULT '{"primary":"#3B82F6","secondary":"#6B7280","background":"#F3F4F6","text":"#111827"}'::jsonb,
    is_dark BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Adicionar alguns temas padrão
INSERT INTO themes (name, description, color_scheme, is_dark) VALUES
('Azul Clássico', 'Tema claro com tons de azul', 
 '{"primary":"#3B82F6","secondary":"#6B7280","background":"#F3F4F6","text":"#111827"}'::jsonb, 
 false),
('Noturno', 'Tema escuro elegante', 
 '{"primary":"#60A5FA","secondary":"#9CA3AF","background":"#1F2937","text":"#F9FAFB"}'::jsonb, 
 true),
('Verde Natureza', 'Tema claro com tons de verde', 
 '{"primary":"#10B981","secondary":"#6B7280","background":"#ECFDF5","text":"#064E3B"}'::jsonb, 
 false),
('Roxo Real', 'Tema escuro com tons de roxo', 
 '{"primary":"#8B5CF6","secondary":"#A78BFA","background":"#2E1065","text":"#F5F3FF"}'::jsonb, 
 true),
('Laranja Solar', 'Tema claro com tons de laranja', 
 '{"primary":"#F97316","secondary":"#FB923C","background":"#FFF7ED","text":"#7C2D12"}'::jsonb, 
 false);

-- Adicionar políticas RLS
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver os temas"
    ON themes FOR SELECT
    USING (true);

-- Apenas admins podem modificar temas
CREATE POLICY "Apenas admins podem inserir temas"
    ON themes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Apenas admins podem atualizar temas"
    ON themes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Apenas admins podem deletar temas"
    ON themes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Adicionar coluna theme_id na tabela user_settings
ALTER TABLE user_settings 
ADD COLUMN theme_id UUID REFERENCES themes(id);

-- Criar índice para melhorar performance
CREATE INDEX idx_themes_is_dark ON themes(is_dark); 