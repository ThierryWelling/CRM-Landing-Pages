-- Remover tabela existente se houver
DROP TABLE IF EXISTS user_settings;
DROP TYPE IF EXISTS theme_type;
DROP TYPE IF EXISTS language_type;

-- Criar enum para temas
CREATE TYPE theme_type AS ENUM ('light', 'dark', 'system');

-- Criar enum para idiomas
CREATE TYPE language_type AS ENUM ('pt-BR', 'en-US', 'es');

-- Criar tabela user_settings
CREATE TABLE user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme theme_type DEFAULT 'light',
    language language_type DEFAULT 'pt-BR',
    color_scheme JSONB DEFAULT '{"primary":"#3B82F6","secondary":"#6B7280","background":"#F3F4F6","text":"#111827"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar o updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adicionar políticas RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Criar índice para melhorar performance
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Garantir que user_profiles tenha as permissões corretas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Atualizar políticas do user_profiles se necessário
DROP POLICY IF EXISTS "Users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can view profiles"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id); 