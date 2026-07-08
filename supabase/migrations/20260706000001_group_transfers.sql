-- Fase 8: transferências de pessoas entre GRs e log de auditoria

-- ============================================================
-- group_transfers
-- ============================================================
CREATE TABLE group_transfers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id       uuid        NOT NULL REFERENCES people(id),
  from_group_id   uuid        NOT NULL REFERENCES groups(id),
  to_group_id     uuid        NOT NULL REFERENCES groups(id),
  transferred_by  uuid        NOT NULL REFERENCES profiles(id),
  reason          text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX group_transfers_person_id_idx ON group_transfers(person_id);

-- ============================================================
-- audit_logs
-- Tabela genérica de auditoria (5.5 e seção 7 — "logs de auditoria"
-- do administrador). Registros são imutáveis: sem updated_at, sem
-- policy de UPDATE/DELETE para nenhum papel.
-- ============================================================
CREATE TABLE audit_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid        REFERENCES profiles(id),
  action      text        NOT NULL,
  entity_type text        NOT NULL,
  entity_id   uuid,
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_entity_idx ON audit_logs(entity_type, entity_id);

-- ============================================================
-- RLS — coordenação e admin apenas; sem acesso de líder (5.5, seção 7)
-- ============================================================
ALTER TABLE group_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_transfers_coordinator_read"
  ON group_transfers FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "group_transfers_coordinator_write"
  ON group_transfers FOR ALL
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "audit_logs_coordinator_read"
  ON audit_logs FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "audit_logs_coordinator_write"
  ON audit_logs FOR ALL
  USING (public.current_user_role() IN ('coordinator', 'admin'));
