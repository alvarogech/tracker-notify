-- Grupos de Atuação: substitui a lista de áreas de "Serviço" por completo, a
-- pedido do responsável pelo produto (Velos, Áreas Executivas, Sobrenatural,
-- EPL, Ekballo, Adoração, Raízes). Renomeia 7 das 8 linhas já existentes no
-- lugar (preserva o id, então nenhum service_assignments existente perde a
-- referência); a 8ª linha ("Recepção") é removida — qualquer vínculo que
-- ainda apontasse para ela é redirecionado para "Velos" antes da remoção,
-- para nunca deixar um service_assignments com FK quebrada.

UPDATE ministry_areas SET name = 'Velos'            WHERE name = 'Acolhimento';
UPDATE ministry_areas SET name = 'Áreas Executivas'  WHERE name = 'Louvor';
UPDATE ministry_areas SET name = 'Sobrenatural'      WHERE name = 'Mídia e Som';
UPDATE ministry_areas SET name = 'EPL'               WHERE name = 'Infantil';
UPDATE ministry_areas SET name = 'Ekballo'           WHERE name = 'Intercessão';
UPDATE ministry_areas SET name = 'Adoração'          WHERE name = 'Comunicação';
UPDATE ministry_areas SET name = 'Raízes'            WHERE name = 'Limpeza e Organização';

UPDATE service_assignments
SET ministry_area_id = (SELECT id FROM ministry_areas WHERE name = 'Velos')
WHERE ministry_area_id = (SELECT id FROM ministry_areas WHERE name = 'Recepção');

DELETE FROM ministry_areas WHERE name = 'Recepção';
