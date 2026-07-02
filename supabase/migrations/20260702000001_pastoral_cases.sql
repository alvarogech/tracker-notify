-- Fase 5: casos e ações de pastoreio

-- ============================================================
-- pastoral_cases
-- ============================================================
CREATE TABLE pastoral_cases (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id         uuid        NOT NULL REFERENCES people(id),
  group_id          uuid        NOT NULL REFERENCES groups(id),
  status            text        NOT NULL DEFAULT 'open'
                                 CHECK (status IN ('open', 'resolved')),
  trigger_streak    int,
  escalated_at      timestamptz,
  created_by        uuid        REFERENCES profiles(id),
  resolved_at       timestamptz,
  resolved_by       uuid        REFERENCES profiles(id),
  resolution_notes  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- No máximo um caso aberto por pessoa: a sequência de ausências de uma
-- pessoa corresponde a um único caso em andamento (5.7 — não duplicar
-- casos para a mesma sequência); escalonar atualiza o caso existente
-- em vez de abrir outro.
CREATE UNIQUE INDEX pastoral_cases_one_open_per_person
  ON pastoral_cases(person_id) WHERE status = 'open';

CREATE INDEX pastoral_cases_group_id_idx ON pastoral_cases(group_id);
CREATE INDEX pastoral_cases_status_idx ON pastoral_cases(status);

CREATE TRIGGER pastoral_cases_updated_at
  BEFORE UPDATE ON pastoral_cases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- pastoral_actions
-- ============================================================
CREATE TABLE pastoral_actions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     uuid        NOT NULL REFERENCES pastoral_cases(id) ON DELETE CASCADE,
  description text        NOT NULL,
  created_by  uuid        NOT NULL REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pastoral_actions_case_id_idx ON pastoral_actions(case_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE pastoral_cases   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastoral_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Policies: pastoral_cases
-- Escalonamento não remove o acesso do líder — apenas adiciona
-- visibilidade da coordenação (5.1: "escala... à coordenação").
-- ============================================================

CREATE POLICY "pastoral_cases_leader_read"
  ON pastoral_cases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = pastoral_cases.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "pastoral_cases_leader_insert"
  ON pastoral_cases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = pastoral_cases.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "pastoral_cases_leader_update"
  ON pastoral_cases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = pastoral_cases.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "pastoral_cases_coordinator_read"
  ON pastoral_cases FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "pastoral_cases_coordinator_write"
  ON pastoral_cases FOR ALL
  USING (public.current_user_role() IN ('coordinator', 'admin'));

-- ============================================================
-- Policies: pastoral_actions
-- ============================================================

CREATE POLICY "pastoral_actions_leader_read"
  ON pastoral_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pastoral_cases pc
      JOIN groups g ON g.id = pc.group_id
      WHERE pc.id = pastoral_actions.case_id
        AND g.leader_id = auth.uid()
    )
  );

CREATE POLICY "pastoral_actions_leader_insert"
  ON pastoral_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pastoral_cases pc
      JOIN groups g ON g.id = pc.group_id
      WHERE pc.id = pastoral_actions.case_id
        AND g.leader_id = auth.uid()
    )
  );

CREATE POLICY "pastoral_actions_coordinator_read"
  ON pastoral_actions FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "pastoral_actions_coordinator_write"
  ON pastoral_actions FOR ALL
  USING (public.current_user_role() IN ('coordinator', 'admin'));
