-- Autocadastro de líder: cadastro público de líder + GR, pendente de aprovação

ALTER TABLE profiles
  ADD COLUMN signup_source    text    NOT NULL DEFAULT 'admin' CHECK (signup_source IN ('admin', 'self')),
  ADD COLUMN pending_approval boolean NOT NULL DEFAULT false;

ALTER TABLE groups
  ADD COLUMN signup_source    text    NOT NULL DEFAULT 'admin' CHECK (signup_source IN ('admin', 'self')),
  ADD COLUMN pending_approval boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.signup_source IS 'self = autocadastro público pelo próprio líder, pendente de aprovação administrativa';
COMMENT ON COLUMN groups.signup_source IS 'self = GR criado via autocadastro público, pendente de aprovação administrativa';
