-- Fase 10 (Segurança e Piloto) — índices de performance.
--
-- Postgres não indexa automaticamente colunas de chave estrangeira (apenas
-- o lado referenciado/PK é indexado). Esta migration cobre colunas FK
-- filtradas com frequência que ainda não tinham índice explícito em nenhuma
-- migration anterior — auditoria completa de `REFERENCES` vs. `CREATE INDEX`
-- em todas as migrations existentes, ver docs/DECISIONS.md DEC-036.
--
-- Colunas de auditoria/atribuição ("quem fez isso": created_by, resolved_by,
-- recorded_by, transferred_by, report_reopened_by, audit_logs.actor_id)
-- foram deliberadamente deixadas de fora — são consultadas raramente
-- (telas de auditoria pontuais) e o volume de dados do piloto não justifica
-- o custo de escrita adicional; ver DEC-036 para a decisão registrada.

-- group_relationships: base de praticamente toda consulta escopada a um GR
-- (pessoas do GR, RLS de líder) ou a uma pessoa (histórico de vínculos).
CREATE INDEX IF NOT EXISTS group_relationships_group_id_idx ON group_relationships(group_id);
CREATE INDEX IF NOT EXISTS group_relationships_person_id_idx ON group_relationships(person_id);

-- groups.leader_id é avaliado por praticamente toda política de RLS do
-- líder (meetings, pastoral_cases, discipleship_assignments,
-- service_assignments, group_hosts, group_cooperators) — coluna mais
-- "quente" do esquema sem índice até aqui.
CREATE INDEX IF NOT EXISTS groups_leader_id_idx ON groups(leader_id);
CREATE INDEX IF NOT EXISTS groups_network_id_idx ON groups(network_id);

-- meetings.group_id: listagem de reuniões por GR e base do RLS de
-- attendance_records (join meetings -> group_id).
CREATE INDEX IF NOT EXISTS meetings_group_id_idx ON meetings(group_id);

-- attendance_records.person_id: motor de sequência de ausências (regra 5.1)
-- consulta o histórico de presença por pessoa; meeting_id já é coberto pela
-- constraint UNIQUE(meeting_id, person_id) como coluna líder, person_id não.
CREATE INDEX IF NOT EXISTS attendance_records_person_id_idx ON attendance_records(person_id);

-- pastoral_cases já tem group_id_idx e um índice único parcial em person_id
-- (WHERE status = 'open'); um índice completo em person_id cobre também
-- consultas de histórico (casos resolvidos) fora desse predicado.
CREATE INDEX IF NOT EXISTS pastoral_cases_person_id_idx ON pastoral_cases(person_id);

-- Colunas FK restantes com filtro plausível por área/programa/GR de
-- origem-destino, ainda sem cobertura de índice.
CREATE INDEX IF NOT EXISTS service_assignments_ministry_area_id_idx ON service_assignments(ministry_area_id);
CREATE INDEX IF NOT EXISTS training_records_program_id_idx ON training_records(program_id);
CREATE INDEX IF NOT EXISTS group_transfers_from_group_id_idx ON group_transfers(from_group_id);
CREATE INDEX IF NOT EXISTS group_transfers_to_group_id_idx ON group_transfers(to_group_id);
CREATE INDEX IF NOT EXISTS discipleship_assignments_discipler_id_idx ON discipleship_assignments(discipler_id);
