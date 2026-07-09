-- Papéis no GR (CLAUDE.md 5.8): Anfitrião e Cooperador — dado puramente
-- operacional/organizacional, sem relação com pastoreio, discipulado ou
-- formação (não é caso de pastoreio; sem julgamento de maturidade — seção 12)

-- ============================================================
-- group_hosts
-- Anfitrião: 1 ativo por GR por vez (5.8), mesmo padrão de substituição do
-- discipulador (5.3) — mas o índice único é por GR (group_id), não por
-- pessoa, já que aqui é o grupo que tem no máximo um anfitrião ativo.
-- ============================================================
CREATE TABLE group_hosts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id  uuid        NOT NULL REFERENCES people(id),
  group_id   uuid        NOT NULL REFERENCES groups(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at   timestamptz,
  created_by uuid        NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE group_hosts IS 'Anfitrião do GR — pessoa que recebe a reunião em casa (5.8). Apenas fato operacional.';

CREATE UNIQUE INDEX group_hosts_one_active_per_group
  ON group_hosts(group_id) WHERE ended_at IS NULL;

CREATE INDEX group_hosts_person_id_idx ON group_hosts(person_id);
CREATE INDEX group_hosts_group_id_idx ON group_hosts(group_id);

CREATE TRIGGER group_hosts_updated_at
  BEFORE UPDATE ON group_hosts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- group_cooperators
-- Cooperador: cargo fixo no GR, vários simultâneos permitidos (5.8) — sem
-- índice de "um ativo por vez". Guarda de integridade opcional (não exigida
-- pela 5.8, mas evita a mesma pessoa marcada duas vezes como cooperadora
-- ativa do mesmo GR): UNIQUE(group_id, person_id) WHERE ended_at IS NULL.
-- ============================================================
CREATE TABLE group_cooperators (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id  uuid        NOT NULL REFERENCES people(id),
  group_id   uuid        NOT NULL REFERENCES groups(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at   timestamptz,
  created_by uuid        NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE group_cooperators IS 'Cooperadores do GR — apoio ao líder na organização e apascentamento (5.8). Vários simultâneos por GR.';

CREATE UNIQUE INDEX group_cooperators_one_active_per_person
  ON group_cooperators(group_id, person_id) WHERE ended_at IS NULL;

CREATE INDEX group_cooperators_person_id_idx ON group_cooperators(person_id);
CREATE INDEX group_cooperators_group_id_idx ON group_cooperators(group_id);

-- ============================================================
-- RLS — group_hosts (mesmo padrão de discipleship_assignments: group_id
-- direto na tabela, líder escopado ao próprio GR, coordenação/admin livres)
-- ============================================================
ALTER TABLE group_hosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_hosts_leader_read"
  ON group_hosts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_hosts.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "group_hosts_leader_insert"
  ON group_hosts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_hosts.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "group_hosts_leader_update"
  ON group_hosts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_hosts.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "group_hosts_coordinator_read"
  ON group_hosts FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "group_hosts_coordinator_write"
  ON group_hosts FOR ALL
  USING (public.current_user_role() IN ('coordinator', 'admin'));

-- ============================================================
-- RLS — group_cooperators (mesmo padrão de service_assignments)
-- ============================================================
ALTER TABLE group_cooperators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_cooperators_leader_read"
  ON group_cooperators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_cooperators.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "group_cooperators_leader_insert"
  ON group_cooperators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_cooperators.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "group_cooperators_leader_update"
  ON group_cooperators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_cooperators.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "group_cooperators_coordinator_read"
  ON group_cooperators FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "group_cooperators_coordinator_write"
  ON group_cooperators FOR ALL
  USING (public.current_user_role() IN ('coordinator', 'admin'));
