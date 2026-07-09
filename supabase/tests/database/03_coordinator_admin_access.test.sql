-- Cenários 5-6 (docs/ROADMAP.md Fase 10 / CLAUDE.md seção 7): a coordenação
-- enxerga toda a rede HUIOS (não fica restrita a um único GR, ao contrário
-- do líder) e o administrador tem leitura e escrita completas mesmo fora do
-- service_role (a policy profiles_admin_write/groups_admin_write etc. são
-- FOR ALL, cobrindo INSERT/UPDATE/DELETE além de SELECT).
--
-- Dados fixos de referência (supabase/seed.sql):
--   Coordenação = 00000000-0000-0000-0000-000000000002 (coord@huios.dev)
--   Admin       = 00000000-0000-0000-0000-000000000001 (admin@huios.dev)
--   5 GRs semeados (Norte/Sul/Leste/Oeste/Centro)
--   Henrique Barros (pessoa do GR Sul) = 30000000-0000-0000-0000-000000000007
--   Reunião do GR Norte                = 40000000-0000-0000-0000-000000000001
--   Caso de pastoreio do GR Norte       = 60000000-0000-0000-0000-000000000001
--
-- O teste de escrita do admin usa um GR novo, criado e removido dentro da
-- própria transação de teste (nunca toca nos GRs semeados usados por outros
-- arquivos de teste), evitando qualquer violação de FK por dependentes.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(8);

SET LOCAL ROLE authenticated;

-- ============================================================
-- Cenário 5: coordenação enxerga toda a rede, não apenas um GR
-- ============================================================
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text,
  true
);

SELECT is(
  (SELECT count(*)::int FROM groups),
  5,
  'coordenação enxerga os 5 GRs semeados, não apenas o de um único líder'
);

SELECT is(
  (SELECT count(*)::int FROM people WHERE id = '30000000-0000-0000-0000-000000000007'),
  1,
  'coordenação enxerga pessoa do GR Sul (Henrique Barros)'
);

SELECT is(
  (SELECT count(*)::int FROM meetings WHERE id = '40000000-0000-0000-0000-000000000001'),
  1,
  'coordenação enxerga reunião do GR Norte'
);

SELECT is(
  (SELECT count(*)::int FROM pastoral_cases WHERE id = '60000000-0000-0000-0000-000000000001'),
  1,
  'coordenação enxerga caso de pastoreio do GR Norte'
);

-- ============================================================
-- Cenário 6: admin tem leitura e escrita completas em tabela exclusiva de
-- administração (groups) — INSERT, UPDATE e DELETE de um GR de teste
-- ============================================================
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true
);

SELECT lives_ok(
  $$ INSERT INTO groups (id, network_id, name, active)
     VALUES ('20000000-0000-0000-0000-000000000099',
             '10000000-0000-0000-0000-000000000001',
             'GR Teste RLS',
             true) $$,
  'admin: pode inserir um novo GR (groups_admin_write cobre INSERT)'
);

SELECT lives_ok(
  $$ UPDATE groups SET name = 'GR Teste RLS (renomeado)'
     WHERE id = '20000000-0000-0000-0000-000000000099' $$,
  'admin: pode atualizar o GR de teste (groups_admin_write cobre UPDATE)'
);

SELECT is(
  (SELECT name FROM groups WHERE id = '20000000-0000-0000-0000-000000000099'),
  'GR Teste RLS (renomeado)',
  'a atualização do admin foi de fato persistida'
);

SELECT lives_ok(
  $$ DELETE FROM groups WHERE id = '20000000-0000-0000-0000-000000000099' $$,
  'admin: pode excluir o GR de teste (groups_admin_write cobre DELETE)'
);

SELECT * FROM finish();

ROLLBACK;
