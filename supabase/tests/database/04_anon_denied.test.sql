-- Cenário 7 (docs/ROADMAP.md Fase 10 / CLAUDE.md seção 6 — "RLS habilitado
-- em todas as tabelas; princípio: negar por padrão"): uma requisição sem
-- sessão (role anon do PostgREST, sem auth.uid()) não enxerga nem escreve
-- nenhuma linha em tabelas sensíveis, mesmo sem nenhuma tentativa de
-- personificar um usuário — este é o piso de "negar por padrão" que todas
-- as demais policies constroem em cima.
--
-- Ao contrário dos demais arquivos, aqui não há set_config de
-- request.jwt.claims: um visitante anônimo genuíno não tem esse claim, e é
-- exatamente essa ausência que este teste verifica.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(6);

SET LOCAL ROLE anon;

SELECT is(
  (SELECT count(*)::int FROM people),
  0,
  'anônimo não enxerga nenhuma linha de people'
);

SELECT is(
  (SELECT count(*)::int FROM pastoral_cases),
  0,
  'anônimo não enxerga nenhuma linha de pastoral_cases'
);

SELECT is(
  (SELECT count(*)::int FROM profiles),
  0,
  'anônimo não enxerga nenhuma linha de profiles'
);

SELECT is(
  (SELECT count(*)::int FROM groups),
  0,
  'anônimo não enxerga nenhuma linha de groups'
);

SELECT throws_ok(
  $$ INSERT INTO people (full_name) VALUES ('Pessoa Anônima Teste') $$,
  '42501',
  'anônimo não pode inserir em people'
);

SELECT throws_ok(
  $$ INSERT INTO pastoral_cases (person_id, group_id, status, created_by)
     VALUES ('30000000-0000-0000-0000-000000000001',
             '20000000-0000-0000-0000-000000000001',
             'open',
             NULL) $$,
  '42501',
  'anônimo não pode inserir em pastoral_cases'
);

SELECT * FROM finish();

ROLLBACK;
