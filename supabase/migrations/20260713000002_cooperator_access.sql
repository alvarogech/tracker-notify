-- Fase 11: acesso ao sistema para cooperadores de GR — escopo puramente
-- operacional (Reuniões e Pessoas), sem alcance sobre casos de pastoreio,
-- discipulado ou transferências (CLAUDE.md 5.8: cooperador "não é caso de
-- pastoreio, discipulado ou formação — é dado puramente operacional").
--
-- Todas as policies novas são ADITIVAS — nenhuma policy existente de líder é
-- alterada, só ampliamos a lista de roles aceita em people_leader_insert
-- (que já não tinha escopo de GR para nenhuma role).

-- ============================================================
-- profiles.role passa a aceitar 'cooperator'
-- ============================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('leader', 'coordinator', 'admin', 'cooperator'));

-- ============================================================
-- group_helpers — vincula uma conta de login (profiles, role=cooperator)
-- ao GR em que ajuda. Separado de group_cooperators (fato operacional
-- "esta pessoa é cooperadora", sem login): nem toda cooperadora ganha
-- acesso ao sistema.
-- ============================================================
CREATE TABLE group_helpers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  group_id    uuid        NOT NULL REFERENCES groups(id),
  person_id   uuid        REFERENCES people(id),
  created_by  uuid        NOT NULL REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE group_helpers IS 'Vincula uma conta de login (profiles, role=cooperator) ao GR em que ajuda a alimentar o sistema.';

CREATE INDEX group_helpers_group_id_idx ON group_helpers(group_id);
CREATE INDEX group_helpers_person_id_idx ON group_helpers(person_id);

ALTER TABLE group_helpers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_helpers_self_read"
  ON group_helpers FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "group_helpers_leader_manage"
  ON group_helpers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM groups WHERE groups.id = group_helpers.group_id AND groups.leader_id = auth.uid())
    OR public.current_user_role() IN ('coordinator', 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM groups WHERE groups.id = group_helpers.group_id AND groups.leader_id = auth.uid())
    OR public.current_user_role() IN ('coordinator', 'admin')
  );

-- ============================================================
-- current_helper_group_id() — GR do cooperador logado, sem recursão
-- (mesmo padrão de current_user_role(), DEC/migration 20260630000001).
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_helper_group_id()
RETURNS uuid
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT group_id FROM public.group_helpers WHERE profile_id = auth.uid()
$$;

-- ============================================================
-- groups — cooperador lê o próprio GR (nome, dia, horário, local)
-- ============================================================
CREATE POLICY "groups_cooperator_read"
  ON groups FOR SELECT
  USING (id = public.current_helper_group_id());

-- ============================================================
-- people — insert já não tinha escopo de GR para nenhuma role; só amplia a
-- lista de roles aceita. Read/update ganham policy aditiva escopada ao GR
-- do cooperador.
-- ============================================================
DROP POLICY IF EXISTS "people_leader_insert" ON people;
CREATE POLICY "people_leader_insert"
  ON people FOR INSERT
  WITH CHECK (public.current_user_role() IN ('leader', 'coordinator', 'admin', 'cooperator'));

CREATE POLICY "people_cooperator_read"
  ON people FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_relationships gr
      WHERE gr.person_id = people.id
        AND gr.group_id = public.current_helper_group_id()
    )
  );

CREATE POLICY "people_cooperator_update"
  ON people FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_relationships gr
      WHERE gr.person_id = people.id
        AND gr.group_id = public.current_helper_group_id()
    )
  );

-- ============================================================
-- group_relationships — leitura e inserção escopadas ao GR do cooperador
-- (mesmo formato de group_relationships_leader_write, mas via
-- current_helper_group_id() em vez de groups.leader_id).
-- ============================================================
CREATE POLICY "group_relationships_cooperator_read"
  ON group_relationships FOR SELECT
  USING (group_id = public.current_helper_group_id());

CREATE POLICY "group_relationships_cooperator_insert"
  ON group_relationships FOR INSERT
  WITH CHECK (group_id = public.current_helper_group_id());

-- ============================================================
-- visitor_visits — leitura e inserção escopadas ao GR do cooperador
-- ============================================================
CREATE POLICY "visitor_visits_cooperator_read"
  ON visitor_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_relationships gr
      WHERE gr.id = visitor_visits.group_relationship_id
        AND gr.group_id = public.current_helper_group_id()
    )
  );

CREATE POLICY "visitor_visits_cooperator_insert"
  ON visitor_visits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_relationships gr
      WHERE gr.id = visitor_visits.group_relationship_id
        AND gr.group_id = public.current_helper_group_id()
        AND gr.type = 'visitor'
        AND gr.status = 'active'
    )
  );

-- ============================================================
-- GRANT — mesma razão da DEC-039: authenticated precisa do GRANT de tabela
-- em group_helpers além da RLS. ALTER DEFAULT PRIVILEGES (20260709000001)
-- já deve cobrir tabelas novas criadas pela mesma role de migração, mas o
-- GRANT explícito abaixo é redundância barata contra qualquer ambiente
-- onde isso não se aplique.
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON group_helpers TO authenticated;
