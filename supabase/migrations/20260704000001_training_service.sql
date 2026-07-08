-- Fase 7: formação e serviço — catálogo de programas formativos, registro
-- declarativo de conclusão, catálogo de áreas de serviço e vínculos de serviço

-- ============================================================
-- training_programs (catálogo fixo, gerenciado pela administração)
-- ============================================================
CREATE TABLE training_programs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text        NOT NULL UNIQUE,
  name          text        NOT NULL,
  display_order int         NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE training_programs IS 'Catálogo fixo dos 4 programas formativos (5.4) — Cultura Emaús + Makarios 1/2/3';

INSERT INTO training_programs (code, name, display_order) VALUES
  ('cultura_emaus', 'Cultura Emaús', 1),
  ('makarios_1',    'Makarios 1',    2),
  ('makarios_2',    'Makarios 2',    3),
  ('makarios_3',    'Makarios 3',    4);

-- ============================================================
-- training_records
-- Registro declarativo: presença de uma linha = programa concluído para a
-- pessoa. Sem certificado, sem upload — apenas o que o líder registra (5.4, 11).
-- ============================================================
CREATE TABLE training_records (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id    uuid        NOT NULL REFERENCES people(id),
  program_id   uuid        NOT NULL REFERENCES training_programs(id),
  completed_at timestamptz NOT NULL DEFAULT now(),
  recorded_by  uuid        NOT NULL REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (person_id, program_id)
);

CREATE INDEX training_records_person_id_idx ON training_records(person_id);

-- ============================================================
-- ministry_areas (catálogo fixo, gerenciado pela administração)
-- ============================================================
CREATE TABLE ministry_areas (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO ministry_areas (name) VALUES
  ('Acolhimento'),
  ('Louvor'),
  ('Mídia e Som'),
  ('Infantil'),
  ('Intercessão'),
  ('Comunicação'),
  ('Limpeza e Organização'),
  ('Recepção');

-- ============================================================
-- service_assignments
-- Uma pessoa pode servir em mais de uma área simultaneamente — sem índice
-- de "um ativo por vez" (diferente de discipleship_assignments).
-- ============================================================
CREATE TABLE service_assignments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id        uuid        NOT NULL REFERENCES people(id),
  ministry_area_id uuid        NOT NULL REFERENCES ministry_areas(id),
  group_id         uuid        NOT NULL REFERENCES groups(id),
  started_at       timestamptz NOT NULL DEFAULT now(),
  ended_at         timestamptz,
  created_by       uuid        NOT NULL REFERENCES profiles(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX service_assignments_person_id_idx ON service_assignments(person_id);
CREATE INDEX service_assignments_group_id_idx ON service_assignments(group_id);

CREATE TRIGGER service_assignments_updated_at
  BEFORE UPDATE ON service_assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS — training_programs (catálogo: leitura para todo usuário autenticado
-- com perfil, escrita restrita ao admin — 5.4/7 "catálogos" são geridos
-- centralmente, não por GR)
-- ============================================================
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_programs_read"
  ON training_programs FOR SELECT
  USING (public.current_user_role() IN ('leader', 'coordinator', 'admin'));

CREATE POLICY "training_programs_admin_write"
  ON training_programs FOR ALL
  USING (public.current_user_role() = 'admin');

-- ============================================================
-- RLS — ministry_areas (mesmo padrão de catálogo)
-- ============================================================
ALTER TABLE ministry_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ministry_areas_read"
  ON ministry_areas FOR SELECT
  USING (public.current_user_role() IN ('leader', 'coordinator', 'admin'));

CREATE POLICY "ministry_areas_admin_write"
  ON ministry_areas FOR ALL
  USING (public.current_user_role() = 'admin');

-- ============================================================
-- RLS — training_records
-- Sem group_id direto: escopo do líder via people → group_relationships →
-- groups, no mesmo estilo de visitor_visits (20260701000001_visitors.sql).
-- Sem policy de UPDATE/DELETE para líder — registro declarativo é apenas
-- de inserção; correção de um lançamento indevido é tarefa da coordenação.
-- ============================================================
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_records_leader_read"
  ON training_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_relationships gr
      JOIN groups g ON g.id = gr.group_id
      WHERE gr.person_id = training_records.person_id
        AND gr.status = 'active'
        AND g.leader_id = auth.uid()
    )
  );

CREATE POLICY "training_records_leader_insert"
  ON training_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_relationships gr
      JOIN groups g ON g.id = gr.group_id
      WHERE gr.person_id = training_records.person_id
        AND gr.status = 'active'
        AND g.leader_id = auth.uid()
    )
  );

CREATE POLICY "training_records_coordinator_read"
  ON training_records FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "training_records_coordinator_write"
  ON training_records FOR ALL
  USING (public.current_user_role() IN ('coordinator', 'admin'));

-- ============================================================
-- RLS — service_assignments (tem group_id direto: mesmo padrão de
-- discipleship_assignments)
-- ============================================================
ALTER TABLE service_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_assignments_leader_read"
  ON service_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = service_assignments.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "service_assignments_leader_insert"
  ON service_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = service_assignments.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "service_assignments_leader_update"
  ON service_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = service_assignments.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "service_assignments_coordinator_read"
  ON service_assignments FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "service_assignments_coordinator_write"
  ON service_assignments FOR ALL
  USING (public.current_user_role() IN ('coordinator', 'admin'));
