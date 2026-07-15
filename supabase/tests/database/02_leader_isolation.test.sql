-- Cenários 1-4 (docs/ROADMAP.md Fase 10 / CLAUDE.md seção 9 e seção 7 —
-- "Não pode visualizar pessoas de outros GRs, mesmo por manipulação de URL
-- ou API direta"): isolamento de um líder de GR em relação a outro GR,
-- tanto para leitura (SELECT direto por id, não apenas ausência em listas)
-- quanto para escrita (INSERT/UPDATE) e para tabelas exclusivas de
-- coordenação/admin.
--
-- Dados fixos de referência (supabase/seed.sql):
--   Líder do GR Norte = 00000000-0000-0000-0000-000000000003 (lider.norte@huios.dev)
--   Líder do GR Sul    = 00000000-0000-0000-0000-000000000004 (lider.sul@huios.dev)
--   GR Norte           = 20000000-0000-0000-0000-000000000001
--   GR Sul             = 20000000-0000-0000-0000-000000000002
--   Marcos Alves (pessoa do GR Norte)  = 30000000-0000-0000-0000-000000000001
--   Reunião do GR Norte                = 40000000-0000-0000-0000-000000000001
--   Caso de pastoreio do GR Norte (Fernanda) = 60000000-0000-0000-0000-000000000001
--
-- Sessão simulada como líder do GR Sul tentando alcançar dados do GR Norte —
-- ver comentário de técnica de simulação em 01_profiles_recursion.test.sql.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(10);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000004', 'role', 'authenticated')::text,
  true
);

-- ============================================================
-- Cenário 1: pessoa e vínculo de outro GR não aparecem nem por id direto
-- ============================================================
SELECT is(
  (SELECT count(*)::int FROM people WHERE id = '30000000-0000-0000-0000-000000000001'),
  0,
  'líder do GR Sul não enxerga pessoa (Marcos Alves) do GR Norte, mesmo pelo id exato'
);

SELECT is(
  (SELECT count(*)::int FROM group_relationships WHERE group_id = '20000000-0000-0000-0000-000000000001'),
  0,
  'líder do GR Sul não enxerga nenhum vínculo (group_relationships) do GR Norte'
);

-- ============================================================
-- Cenário 2: reunião e frequência de outro GR não aparecem por id direto
-- ============================================================
SELECT is(
  (SELECT count(*)::int FROM meetings WHERE id = '40000000-0000-0000-0000-000000000001'),
  0,
  'líder do GR Sul não enxerga a reunião do GR Norte, mesmo pelo id exato (não apenas "some da lista")'
);

SELECT is(
  (SELECT count(*)::int FROM attendance_records WHERE meeting_id = '40000000-0000-0000-0000-000000000001'),
  0,
  'líder do GR Sul não enxerga a chamada (attendance_records) da reunião do GR Norte'
);

SELECT is(
  (SELECT count(*)::int FROM pastoral_cases WHERE id = '60000000-0000-0000-0000-000000000001'),
  0,
  'líder do GR Sul não enxerga o caso de pastoreio do GR Norte, mesmo pelo id exato'
);

-- ============================================================
-- Cenário 3: líder não pode criar/atualizar registro de pessoa de outro GR
-- (isolamento vale também para INSERT/UPDATE, não só para SELECT)
-- ============================================================
-- líder do GR Sul não pode abrir caso de pastoreio para pessoa do GR Norte
SELECT throws_ok(
  $$ INSERT INTO pastoral_cases (person_id, group_id, status, created_by)
     VALUES ('30000000-0000-0000-0000-000000000001',
             '20000000-0000-0000-0000-000000000001',
             'open',
             '00000000-0000-0000-0000-000000000004') $$,
  '42501'
);

-- líder do GR Sul não pode atribuir discipulador a pessoa do GR Norte
SELECT throws_ok(
  $$ INSERT INTO discipleship_assignments (person_id, discipler_id, group_id, created_by)
     VALUES ('30000000-0000-0000-0000-000000000001',
             '30000000-0000-0000-0000-000000000002',
             '20000000-0000-0000-0000-000000000001',
             '00000000-0000-0000-0000-000000000004') $$,
  '42501'
);

SELECT is(
  (SELECT count(*)::int FROM pastoral_cases
    WHERE group_id = '20000000-0000-0000-0000-000000000001'
      AND created_by = '00000000-0000-0000-0000-000000000004'),
  0,
  'a tentativa de INSERT acima foi de fato bloqueada, não silenciosamente ignorada'
);

-- ============================================================
-- Cenário 4: tabelas exclusivas de coordenação/admin negam escrita de líder
-- mesmo via role authenticated direta (defesa em profundidade: a aplicação
-- só grava nessas tabelas via service_role nos Server Actions, mas a
-- camada de RLS precisa negar por si só caso alguém contorne a aplicação)
-- ============================================================
-- líder não pode inserir em group_transfers diretamente via RLS
SELECT throws_ok(
  $$ INSERT INTO group_transfers (person_id, from_group_id, to_group_id, transferred_by)
     VALUES ('30000000-0000-0000-0000-000000000001',
             '20000000-0000-0000-0000-000000000001',
             '20000000-0000-0000-0000-000000000002',
             '00000000-0000-0000-0000-000000000004') $$,
  '42501'
);

-- líder não pode inserir em audit_logs diretamente via RLS
SELECT throws_ok(
  $$ INSERT INTO audit_logs (actor_id, action, entity_type, entity_id)
     VALUES ('00000000-0000-0000-0000-000000000004', 'test', 'people',
             '30000000-0000-0000-0000-000000000001') $$,
  '42501'
);

SELECT * FROM finish();

ROLLBACK;
