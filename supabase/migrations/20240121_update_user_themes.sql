-- Remover tabelas existentes se houver
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS themes CASCADE;
DROP TYPE IF EXISTS theme_type CASCADE;
DROP TYPE IF EXISTS language_type CASCADE;

-- Criar enum para temas
CREATE TYPE theme_type AS ENUM ('light', 'dark', 'system');

-- Criar enum para idiomas
CREATE TYPE language_type AS ENUM ('pt-BR', 'en-US', 'es');

-- Criar tabela de temas predefinidos
CREATE TABLE themes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color_scheme JSONB NOT NULL DEFAULT '{"primary":"#3B82F6","secondary":"#6B7280","background":"#F3F4F6","text":"#111827"}'::jsonb,
    is_dark BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Criar tabela de configurações do usuário
CREATE TABLE user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme theme_type DEFAULT 'system',
    language language_type DEFAULT 'pt-BR',
    theme_id UUID REFERENCES themes(id),
    color_scheme JSONB DEFAULT '{"primary":"#3B82F6","secondary":"#6B7280","background":"#F3F4F6","text":"#111827"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Adicionar temas padrão
INSERT INTO themes (name, description, color_scheme, is_dark, is_default) VALUES
('Azul Clássico', 'Tema claro com tons de azul', 
 '{"primary":"#3B82F6","secondary":"#6B7280","background":"#F3F4F6","text":"#111827"}'::jsonb, 
 false, true),
('Noturno', 'Tema escuro elegante', 
 '{"primary":"#60A5FA","secondary":"#9CA3AF","background":"#1F2937","text":"#F9FAFB"}'::jsonb, 
 true, false),
('Verde Natureza', 'Tema claro com tons de verde', 
 '{"primary":"#10B981","secondary":"#6B7280","background":"#ECFDF5","text":"#064E3B"}'::jsonb, 
 false, false),
('Roxo Real', 'Tema escuro com tons de roxo', 
 '{"primary":"#8B5CF6","secondary":"#A78BFA","background":"#2E1065","text":"#F5F3FF"}'::jsonb, 
 true, false),
('Laranja Solar', 'Tema claro com tons de laranja', 
 '{"primary":"#F97316","secondary":"#FB923C","background":"#FFF7ED","text":"#7C2D12"}'::jsonb, 
 false, false);

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar o updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_themes_updated_at
    BEFORE UPDATE ON themes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adicionar políticas RLS para themes
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos podem ver os temas"
    ON themes FOR SELECT
    USING (true);

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

-- Adicionar políticas RLS para user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias configurações"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias configurações"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias configurações"
    ON user_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Criar função para definir configurações padrão ao criar um novo usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_theme_id UUID;
BEGIN
    -- Obter o ID do tema padrão
    SELECT id INTO default_theme_id
    FROM themes
    WHERE is_default = true
    LIMIT 1;

    -- Inserir configurações padrão para o novo usuário
    INSERT INTO user_settings (user_id, theme_id, theme)
    VALUES (NEW.id, default_theme_id, CASE 
        WHEN EXISTS (SELECT 1 FROM themes WHERE id = default_theme_id AND is_dark = true)
        THEN 'dark'::theme_type
        ELSE 'light'::theme_type
    END);

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para configurar novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Criar índices para melhorar performance
CREATE INDEX idx_themes_is_dark ON themes(is_dark);
CREATE INDEX idx_themes_is_default ON themes(is_default);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_theme_id ON user_settings(theme_id); 