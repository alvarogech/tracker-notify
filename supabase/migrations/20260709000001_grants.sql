-- RLS restringe quais LINHAS uma role vê/altera, mas o Postgres exige que a
-- role já tenha o GRANT de tabela correspondente antes mesmo de avaliar
-- qualquer policy — sem o GRANT, toda consulta falha com
-- "permission denied for table X" (SQLSTATE 42501), independente do que a
-- RLS permitiria. O Supabase Cloud concede isso automaticamente no
-- provisionamento do projeto (por isso o app sempre funcionou em produção),
-- mas o Postgres local do `supabase start` (usado pela suíte de RLS em CI,
-- .github/workflows/tests.yml) não tem esse bootstrap implícito — as 8
-- suítes pgTAP falhavam com "permission denied for table profiles" antes
-- desta migration existir. Torna explícito e portável o que o Supabase
-- Cloud já fazia implicitamente, para qualquer ambiente.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
