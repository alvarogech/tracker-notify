-- Renomeia os programas Makarios exibidos em Formação, a pedido do
-- responsável pelo produto. Os códigos (makarios_1/2/3) não mudam — só o
-- nome de exibição — então nenhuma lógica de elegibilidade é afetada.

UPDATE training_programs SET name = 'Makarios - Vol. 1 Essência' WHERE code = 'makarios_1';
UPDATE training_programs SET name = 'Makarios - Vol. 2 Caminho'  WHERE code = 'makarios_2';
UPDATE training_programs SET name = 'Makarios - Vol. 3 Voz'      WHERE code = 'makarios_3';
