-- Dois pastores da rede HUIOS, disponíveis como opção de discipulador em
-- toda a rede — prioridade máxima na lista de discipuladores, acima até de
-- líderes/cooperadores, a pedido do responsável pelo produto. Não são
-- perfis do sistema (sem login), só registros de pessoa, no mesmo padrão
-- dos registros sintéticos criados para líder/coordenação/admin na
-- migration 20260715000001 — sem group_relationships, só disponíveis para
-- atribuição/prioridade.
INSERT INTO people (id, full_name) VALUES
  ('50000000-0000-0000-0000-000000000001', 'Álvaro Henrique'),
  ('50000000-0000-0000-0000-000000000002', 'Larissa Andrade');
