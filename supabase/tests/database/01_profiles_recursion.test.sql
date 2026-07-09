-- Cenário 8 (docs/ROADMAP.md Fase 10 / CLAUDE.md seção 9): regressão da
-- recursão infinita (SQLSTATE 42P17) em profiles_coordinator_read e
-- profiles_admin_write, corrigida em
-- supabase/migrations/20260630000001_fix_profiles_rls_recursion.sql.
--
-- As policies antigas faziam `EXISTS (SELECT 1 FROM profiles ...)` dentro de
-- uma policy da própria tabela profiles, o que reaciona a mesma policy
-- indefinidamente. A correção usa public.current_user_role(), uma função
-- SECURITY DEFINER que lê profiles.role sem acionar RLS novamente. Este
-- teste garante que um SELECT simples em profiles nunca volte a lançar
-- 42P17 para nenhum papel, e que cada papel enxergue o conjunto de linhas
-- esperado.
--
-- Simulação de sessão: como não há Docker/Postgres local disponível para
-- rodar `supabase test db` neste ambiente, esta simulação de auth.uid() não
-- pôde ser executada de fato — ver docs/DECISIONS.md. A técnica usada
-- (SET LOCAL ROLE + set_config('request.jwt.claims', ...)) reproduz o que o
-- PostgREST faz a cada requisição autenticada: define tanto a forma "dotted"
-- (request.jwt.claim.sub) quanto o JSON completo (request.jwt.claims), pois
-- auth.uid()/auth.role() aceitam qualquer uma das duas conforme a versão do
-- projeto Supabase.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(6);

-- ============================================================
-- Sessão da coordenação (coord@huios.dev — supabase/seed.sql)
-- ============================================================
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text,
  true
);

SELECT lives_ok(
  $$ SELECT * FROM profiles $$,
  'coordenador: SELECT em profiles não gera recursão 42P17'
);

SELECT is(
  (SELECT count(*)::int FROM profiles),
  7,
  'coordenador: enxerga todos os 7 perfis semeados (profiles_coordinator_read)'
);

-- ============================================================
-- Sessão do admin (admin@huios.dev)
-- ============================================================
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true
);

SELECT lives_ok(
  $$ SELECT * FROM profiles $$,
  'admin: SELECT em profiles não gera recursão 42P17'
);

SELECT is(
  (SELECT count(*)::int FROM profiles),
  7,
  'admin: enxerga todos os 7 perfis semeados (profiles_admin_write cobre SELECT via FOR ALL)'
);

-- ============================================================
-- Sessão de um líder (lider.norte@huios.dev) — profiles_self_read e
-- profiles_coordinator_read são avaliadas juntas (OR) pelo planner; a
-- recursão histórica também podia ser disparada aqui
-- ============================================================
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
SELECT set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text,
  true
);

SELECT lives_ok(
  $$ SELECT * FROM profiles $$,
  'líder: SELECT em profiles não gera recursão 42P17'
);

SELECT is(
  (SELECT count(*)::int FROM profiles),
  1,
  'líder: enxerga apenas o próprio perfil (profiles_self_read), não os demais'
);

SELECT * FROM finish();

ROLLBACK;
