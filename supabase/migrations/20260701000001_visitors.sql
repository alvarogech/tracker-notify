-- Fase 4: visitantes — histórico de visitas e sugestão de vinculação

-- ============================================================
-- visitor_visits
-- ============================================================
CREATE TABLE visitor_visits (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_relationship_id uuid        NOT NULL REFERENCES group_relationships(id) ON DELETE CASCADE,
  visited_at            timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE visitor_visits IS 'Uma linha por visita registrada para uma relação de visitante ativa';

CREATE INDEX visitor_visits_group_relationship_id_idx ON visitor_visits(group_relationship_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE visitor_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visitor_visits_leader_read"
  ON visitor_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_relationships gr
      JOIN groups g ON g.id = gr.group_id
      WHERE gr.id = visitor_visits.group_relationship_id
        AND g.leader_id = auth.uid()
    )
  );

CREATE POLICY "visitor_visits_leader_insert"
  ON visitor_visits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_relationships gr
      JOIN groups g ON g.id = gr.group_id
      WHERE gr.id = visitor_visits.group_relationship_id
        AND g.leader_id = auth.uid()
        AND gr.type = 'visitor'
        AND gr.status = 'active'
    )
  );

CREATE POLICY "visitor_visits_coordinator_read"
  ON visitor_visits FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "visitor_visits_coordinator_write"
  ON visitor_visits FOR ALL
  USING (public.current_user_role() IN ('coordinator', 'admin'));
