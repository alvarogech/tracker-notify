-- Fase 2: redes, GRs e pessoas
-- Todas as tabelas são criadas antes das policies para evitar dependências circulares

-- ============================================================
-- networks
-- ============================================================
CREATE TABLE networks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- groups
-- ============================================================
CREATE TABLE groups (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id          uuid        NOT NULL REFERENCES networks(id),
  name                text        NOT NULL,
  leader_id           uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  day_of_week         smallint    CHECK (day_of_week BETWEEN 0 AND 6),
  meeting_time        time,
  scheduled_end_time  time,
  timezone            text        NOT NULL DEFAULT 'America/Sao_Paulo',
  location            text,
  active              boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN groups.day_of_week IS '0=domingo … 6=sábado';
COMMENT ON COLUMN groups.scheduled_end_time IS 'Base para lembrete WhatsApp';

CREATE TRIGGER groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- people
-- ============================================================
CREATE TABLE people (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text        NOT NULL,
  phone       text,
  email       text,
  birthdate   date,
  notes       text,
  archived_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN people.archived_at IS 'Soft delete — histórico preservado';

CREATE TRIGGER people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- group_relationships
-- ============================================================
CREATE TABLE group_relationships (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   uuid        NOT NULL REFERENCES people(id),
  group_id    uuid        NOT NULL REFERENCES groups(id),
  type        text        NOT NULL CHECK (type IN ('member', 'visitor')),
  status      text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  started_at  timestamptz NOT NULL DEFAULT now(),
  ended_at    timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN group_relationships.type IS 'member | visitor';

-- ============================================================
-- RLS — habilitar em todas as tabelas
-- ============================================================
ALTER TABLE networks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups             ENABLE ROW LEVEL SECURITY;
ALTER TABLE people             ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_relationships ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Policies: networks
-- ============================================================
CREATE POLICY "networks_authenticated_read"
  ON networks FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- Policies: groups
-- ============================================================
CREATE POLICY "groups_leader_read"
  ON groups FOR SELECT
  USING (leader_id = auth.uid());

CREATE POLICY "groups_coordinator_read"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('coordinator', 'admin')
    )
  );

CREATE POLICY "groups_admin_write"
  ON groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- Policies: people
-- (group_relationships já existe aqui)
-- ============================================================
CREATE POLICY "people_leader_read"
  ON people FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_relationships gr
      JOIN groups g ON g.id = gr.group_id
      WHERE gr.person_id = people.id
        AND g.leader_id = auth.uid()
    )
  );

CREATE POLICY "people_coordinator_read"
  ON people FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('coordinator', 'admin')
    )
  );

CREATE POLICY "people_leader_insert"
  ON people FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('leader', 'coordinator', 'admin')
    )
  );

CREATE POLICY "people_leader_update"
  ON people FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_relationships gr
      JOIN groups g ON g.id = gr.group_id
      WHERE gr.person_id = people.id
        AND g.leader_id = auth.uid()
    )
  );

-- ============================================================
-- Policies: group_relationships
-- ============================================================
CREATE POLICY "group_relationships_leader_read"
  ON group_relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_relationships.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "group_relationships_coordinator_read"
  ON group_relationships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('coordinator', 'admin')
    )
  );

CREATE POLICY "group_relationships_leader_write"
  ON group_relationships FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_relationships.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "group_relationships_leader_update"
  ON group_relationships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_relationships.group_id
        AND groups.leader_id = auth.uid()
    )
  );
