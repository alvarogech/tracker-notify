-- Fase 11 (CLAUDE.md 5.8 / docs/DECISIONS.md DEC-047+): cooperador tem
-- acesso puramente operacional — Reuniões e Pessoas do próprio GR — sem
-- alcance sobre casos de pastoreio, discipulado, ou qualquer outro GR.
--
-- Dados fixos de referência (supabase/seed.sql):
--   Cooperador do GR Norte = 00000000-0000-0000-0000-000000000008 (cooperador.norte@huios.dev)
--   GR Norte                = 20000000-0000-0000-0000-000000000001
--   GR Sul                  = 20000000-0000-0000-0000-000000000002
--   Marcos Alves (pessoa do GR Norte)  = 30000000-0000-0000-0000-000000000001
--   Henrique Barros (pessoa do GR Sul) = 30000000-0000-0000-0000-000000000007
--   Caso de pastoreio do GR Norte (Fernanda) = 60000000-0000-0000-0000-000000000001
--
-- Sessão simulada como cooperador do GR Norte — ver comentário de técnica
-- de simulação em 01_profiles_recursion.test.sql.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(11);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000008', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000008', 'role', 'authenticated')::text,
  true
);

-- ============================================================
-- Escopo positivo: próprio GR (Norte)
-- ============================================================
SELECT is(
  (SELECT count(*)::int FROM people WHERE id = '30000000-0000-0000-0000-000000000001'),
  1,
  'cooperador do GR Norte enxerga pessoa do próprio GR'
);

SELECT is(
  (SELECT count(*)::int FROM groups WHERE id = '20000000-0000-0000-0000-000000000001'),
  1,
  'cooperador enxerga o próprio GR'
);

SELECT ok(
  (SELECT count(*)::int FROM group_relationships WHERE group_id = '20000000-0000-0000-0000-000000000001') > 0,
  'cooperador enxerga vínculos (group_relationships) do próprio GR'
);

-- ============================================================
-- Isolamento: GR Sul não é enxergado
-- ============================================================
SELECT is(
  (SELECT count(*)::int FROM people WHERE id = '30000000-0000-0000-0000-000000000007'),
  0,
  'cooperador do GR Norte não enxerga pessoa do GR Sul'
);

SELECT is(
  (SELECT count(*)::int FROM groups WHERE id = '20000000-0000-0000-0000-000000000002'),
  0,
  'cooperador não enxerga o GR Sul'
);

SELECT is(
  (SELECT count(*)::int FROM group_relationships WHERE group_id = '20000000-0000-0000-0000-000000000002'),
  0,
  'cooperador não enxerga vínculos do GR Sul'
);

-- ============================================================
-- Fora de escopo por definição (CLAUDE.md 5.8): pastoreio e discipulado,
-- mesmo do próprio GR
-- ============================================================
SELECT is(
  (SELECT count(*)::int FROM pastoral_cases WHERE id = '60000000-0000-0000-0000-000000000001'),
  0,
  'cooperador não enxerga casos de pastoreio, nem do próprio GR'
);

SELECT is(
  (SELECT count(*)::int FROM discipleship_assignments),
  0,
  'cooperador não enxerga nenhum registro de discipulado'
);

-- ============================================================
-- Escrita: pode alimentar Pessoas do próprio GR
-- ============================================================
SELECT lives_ok(
  $$ INSERT INTO people (full_name) VALUES ('Pessoa Teste Cooperador') $$,
  'cooperador consegue inserir em people'
);

-- líder do GR Sul só pode ser vinculado por quem tem escopo no GR Sul —
-- cooperador do GR Norte não pode criar vínculo em outro GR
SELECT throws_ok(
  $$ INSERT INTO group_relationships (person_id, group_id, type, status)
     VALUES ('30000000-0000-0000-0000-000000000001',
             '20000000-0000-0000-0000-000000000002',
             'member',
             'active') $$,
  '42501'
);

-- cooperador não pode alterar o próprio escopo (group_helpers é gerido só
-- por líder/coordenação/admin)
SELECT throws_ok(
  $$ UPDATE group_helpers SET group_id = '20000000-0000-0000-0000-000000000002'
     WHERE profile_id = '00000000-0000-0000-0000-000000000008' $$,
  '42501'
);

SELECT * FROM finish();

ROLLBACK;
