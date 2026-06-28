-- Fase 1: autenticação e perfis de acesso
-- Depende de: auth.users (Supabase Auth)

-- ============================================================
-- profiles: espelho de auth.users com papel e dados extras
-- ============================================================
CREATE TABLE profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text        NOT NULL,
  email       text        NOT NULL,
  role        text        NOT NULL CHECK (role IN ('leader', 'coordinator', 'admin')),
  active      boolean     NOT NULL DEFAULT true,

  -- WhatsApp (Fase A — integrado aqui para evitar ALTER posterior)
  whatsapp_phone                  text,
  whatsapp_notifications_enabled  boolean NOT NULL DEFAULT false,
  whatsapp_opt_in_at              timestamptz,
  whatsapp_opt_out_at             timestamptz,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN profiles.role IS 'leader | coordinator | admin';
COMMENT ON COLUMN profiles.active IS 'false = acesso desativado (login bloqueado)';
COMMENT ON COLUMN profiles.whatsapp_notifications_enabled IS 'Consentimento explícito — padrão false';

-- Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS: negar por padrão
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Cada usuário lê o próprio perfil
CREATE POLICY "profiles_self_read"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Cada usuário atualiza o próprio perfil (exceto role e active — via service_role)
CREATE POLICY "profiles_self_update"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND active = (SELECT active FROM profiles WHERE id = auth.uid())
  );

-- Coordenadores e admins leem todos os perfis
CREATE POLICY "profiles_coordinator_read"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('coordinator', 'admin')
    )
  );

-- Admins leem e escrevem tudo (complementa service_role)
CREATE POLICY "profiles_admin_write"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- Criação do perfil é feita via service_role (Server Action após signup)
-- Sem policy de INSERT para roles de usuário
