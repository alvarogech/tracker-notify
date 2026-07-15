-- Discipulador: permitir qualquer pessoa cadastrada (não só quem tem login
-- no sistema), a pedido do responsável pelo produto — reverte a restrição
-- da DEC-022/DEC-023 (Fase 6), que limitava discipulador a `profiles`.

-- ============================================================
-- profiles.person_id — vínculo opcional com o registro de pessoa (people)
-- correspondente, usado para priorizar líderes na lista de discipuladores
-- da coordenação/admin (cooperadores já têm o vínculo em group_helpers).
-- ============================================================
ALTER TABLE profiles ADD COLUMN person_id uuid REFERENCES people(id);

COMMENT ON COLUMN profiles.person_id IS 'Vínculo opcional com people(id), quando este perfil também é uma pessoa cadastrada num GR — usado para priorizar líderes/cooperadores na lista de discipuladores.';

-- Backfill: cooperadores já têm o vínculo em group_helpers.person_id
UPDATE profiles p
SET person_id = gh.person_id
FROM group_helpers gh
WHERE gh.profile_id = p.id AND p.person_id IS NULL;

-- Backfill: demais perfis (líder/coordenação/admin) sem pessoa vinculada
-- ganham um registro novo em people, copiando o nome. Não entram em
-- nenhum GR (sem group_relationships) — só ficam disponíveis para
-- seleção/priorização como discipulador.
DO $$
DECLARE
  rec RECORD;
  new_person_id uuid;
BEGIN
  FOR rec IN SELECT id, full_name FROM profiles WHERE person_id IS NULL LOOP
    INSERT INTO people (full_name) VALUES (rec.full_name) RETURNING id INTO new_person_id;
    UPDATE profiles SET person_id = new_person_id WHERE id = rec.id;
  END LOOP;
END $$;

-- ============================================================
-- discipleship_assignments.discipler_id: de profiles(id) para people(id)
-- ============================================================
ALTER TABLE discipleship_assignments DROP CONSTRAINT discipleship_assignments_discipler_id_fkey;

UPDATE discipleship_assignments da
SET discipler_id = p.person_id
FROM profiles p
WHERE da.discipler_id = p.id;

ALTER TABLE discipleship_assignments
  ADD CONSTRAINT discipleship_assignments_discipler_id_fkey
  FOREIGN KEY (discipler_id) REFERENCES people(id);
