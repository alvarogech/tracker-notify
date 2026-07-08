-- Fase 6: discipulado — definição, substituição e histórico de discipuladores

-- ============================================================
-- discipleship_assignments
-- ============================================================
CREATE TABLE discipleship_assignments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id    uuid        NOT NULL REFERENCES people(id),
  discipler_id uuid        NOT NULL REFERENCES profiles(id),
  group_id     uuid        NOT NULL REFERENCES groups(id),
  started_at   timestamptz NOT NULL DEFAULT now(),
  ended_at     timestamptz,
  created_by   uuid        NOT NULL REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE discipleship_assignments IS 'Apenas quem disciplina quem e quando — nenhum conteúdo de conversas, confissões ou aconselhamento (5.3)';

-- No máximo um discipulador ativo por pessoa (5.3): substituição encerra o
-- vínculo anterior (ended_at) antes de abrir um novo, preservando histórico.
CREATE UNIQUE INDEX discipleship_one_active_per_person
  ON discipleship_assignments(person_id) WHERE ended_at IS NULL;

CREATE INDEX discipleship_assignments_person_id_idx ON discipleship_assignments(person_id);
CREATE INDEX discipleship_assignments_group_id_idx ON discipleship_assignments(group_id);

CREATE TRIGGER discipleship_assignments_updated_at
  BEFORE UPDATE ON discipleship_assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE discipleship_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discipleship_assignments_leader_read"
  ON discipleship_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = discipleship_assignments.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "discipleship_assignments_leader_insert"
  ON discipleship_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = discipleship_assignments.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "discipleship_assignments_leader_update"
  ON discipleship_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = discipleship_assignments.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "discipleship_assignments_coordinator_read"
  ON discipleship_assignments FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "discipleship_assignments_coordinator_write"
  ON discipleship_assignments FOR ALL
  USING (public.current_user_role() IN ('coordinator', 'admin'));
