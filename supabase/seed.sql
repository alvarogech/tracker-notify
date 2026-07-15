-- seed.sql — Dados fictícios para desenvolvimento local
-- NUNCA usar dados reais de membros
-- Executar após migrations: pnpm supabase:seed

-- ============================================================
-- Usuários de autenticação (inseridos via auth.users)
-- ============================================================
-- Senha padrão de todos os usuários de seed: Huios@2026
--
-- instance_id e as colunas de token (confirmation_token, recovery_token etc.)
-- são preenchidos explicitamente porque a API admin do GoTrue filtra por
-- instance_id e falha ao escanear NULL nessas colunas de texto — sem isso,
-- os usuários existem em auth.users mas ficam invisíveis para
-- admin.listUsers()/updateUserById() (ver docs/DECISIONS.md DEC-043).
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
VALUES
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@huios.dev',       crypt('Huios@2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'coord@huios.dev',       crypt('Huios@2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'lider.norte@huios.dev', crypt('Huios@2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'lider.sul@huios.dev',   crypt('Huios@2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'lider.leste@huios.dev', crypt('Huios@2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'lider.oeste@huios.dev', crypt('Huios@2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'lider.centro@huios.dev',crypt('Huios@2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'cooperador.norte@huios.dev', crypt('Huios@2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', '', '');

-- ============================================================
-- Perfis
-- ============================================================
INSERT INTO profiles (id, full_name, email, role, active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin HUIOS',       'admin@huios.dev',        'admin',       true),
  ('00000000-0000-0000-0000-000000000002', 'Coord. HUIOS',      'coord@huios.dev',        'coordinator', true),
  ('00000000-0000-0000-0000-000000000003', 'Lucas Ferreira',    'lider.norte@huios.dev',  'leader',      true),
  ('00000000-0000-0000-0000-000000000004', 'Camila Souza',      'lider.sul@huios.dev',    'leader',      true),
  ('00000000-0000-0000-0000-000000000005', 'Rafael Oliveira',   'lider.leste@huios.dev',  'leader',      true),
  ('00000000-0000-0000-0000-000000000006', 'Juliana Mendes',    'lider.oeste@huios.dev',  'leader',      true),
  ('00000000-0000-0000-0000-000000000007', 'André Costa',       'lider.centro@huios.dev', 'leader',      true),
  ('00000000-0000-0000-0000-000000000008', 'Marcelo Dias',      'cooperador.norte@huios.dev', 'cooperator', true);

-- ============================================================
-- Rede e GRs
-- ============================================================
INSERT INTO networks (id, name) VALUES
  ('10000000-0000-0000-0000-000000000001', 'HUIOS');

INSERT INTO groups (id, network_id, name, leader_id, day_of_week, meeting_time, scheduled_end_time, location) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'GR Norte',  '00000000-0000-0000-0000-000000000003', 3, '19:30', '21:00', 'Setor Norte'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'GR Sul',    '00000000-0000-0000-0000-000000000004', 4, '19:00', '20:30', 'Setor Sul'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'GR Leste',  '00000000-0000-0000-0000-000000000005', 2, '20:00', '21:30', 'Setor Leste'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'GR Oeste',  '00000000-0000-0000-0000-000000000006', 5, '19:30', '21:00', 'Setor Oeste'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'GR Centro', '00000000-0000-0000-0000-000000000007', 6, '10:00', '11:30', 'Setor Central');

-- ============================================================
-- Acesso de cooperador (fase 11) — cooperador do GR Norte
-- ============================================================
INSERT INTO group_helpers (profile_id, group_id, created_by) VALUES
  ('00000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');

-- ============================================================
-- Pessoas fictícias
-- ============================================================
INSERT INTO people (id, full_name, phone, birthdate) VALUES
  -- GR Norte
  ('30000000-0000-0000-0000-000000000001', 'Marcos Alves',       '+5562991110001', '1995-03-12'),
  ('30000000-0000-0000-0000-000000000002', 'Tatiane Rocha',      '+5562991110002', '1998-07-22'),
  ('30000000-0000-0000-0000-000000000003', 'Bruno Lima',         '+5562991110003', '1993-11-05'),
  ('30000000-0000-0000-0000-000000000004', 'Fernanda Castro',    '+5562991110004', '2000-01-30'),
  ('30000000-0000-0000-0000-000000000005', 'Diego Martins',      '+5562991110005', '1990-09-18'),
  ('30000000-0000-0000-0000-000000000006', 'Priscila Nunes',     '+5562991110006', '1997-04-14'),
  -- GR Sul
  ('30000000-0000-0000-0000-000000000007', 'Henrique Barros',    '+5562991110007', '1994-06-08'),
  ('30000000-0000-0000-0000-000000000008', 'Larissa Cardoso',    '+5562991110008', '1999-12-25'),
  ('30000000-0000-0000-0000-000000000009', 'Thiago Ribeiro',     '+5562991110009', '1992-02-17'),
  ('30000000-0000-0000-0000-000000000010', 'Aline Pereira',      '+5562991110010', '1996-08-03'),
  ('30000000-0000-0000-0000-000000000011', 'Gustavo Santos',     '+5562991110011', '2001-05-20'),
  ('30000000-0000-0000-0000-000000000012', 'Natalia Gomes',      '+5562991110012', '1988-10-11'),
  -- GR Leste
  ('30000000-0000-0000-0000-000000000013', 'Rodrigo Dias',       '+5562991110013', '1991-03-29'),
  ('30000000-0000-0000-0000-000000000014', 'Vanessa Moreira',    '+5562991110014', '1997-07-07'),
  ('30000000-0000-0000-0000-000000000015', 'Felipe Araújo',      '+5562991110015', '2000-11-15'),
  ('30000000-0000-0000-0000-000000000016', 'Carolina Lopes',     '+5562991110016', '1995-01-23'),
  ('30000000-0000-0000-0000-000000000017', 'Leonardo Carvalho',  '+5562991110017', '1993-09-01'),
  ('30000000-0000-0000-0000-000000000018', 'Amanda Teixeira',    '+5562991110018', '1999-04-19'),
  -- GR Oeste
  ('30000000-0000-0000-0000-000000000019', 'Eduardo Pinto',      '+5562991110019', '1990-06-30'),
  ('30000000-0000-0000-0000-000000000020', 'Isabela Ramos',      '+5562991110020', '1998-02-14'),
  ('30000000-0000-0000-0000-000000000021', 'Matheus Vieira',     '+5562991110021', '1996-08-22'),
  ('30000000-0000-0000-0000-000000000022', 'Patrícia Melo',      '+5562991110022', '1994-12-05'),
  ('30000000-0000-0000-0000-000000000023', 'Renato Figueiredo',  '+5562991110023', '2001-03-17'),
  -- GR Centro
  ('30000000-0000-0000-0000-000000000024', 'Gabriela Correia',   '+5562991110024', '1997-05-28'),
  ('30000000-0000-0000-0000-000000000025', 'Danilo Barbosa',     '+5562991110025', '1992-10-09'),
  ('30000000-0000-0000-0000-000000000026', 'Letícia Nascimento', '+5562991110026', '1995-07-16'),
  ('30000000-0000-0000-0000-000000000027', 'Paulo Cavalcanti',   '+5562991110027', '1988-01-04'),
  ('30000000-0000-0000-0000-000000000028', 'Simone Andrade',     '+5562991110028', '2000-09-13'),
  ('30000000-0000-0000-0000-000000000029', 'Vinícius Cunha',     '+5562991110029', '1993-12-31'),
  ('30000000-0000-0000-0000-000000000030', 'Mariana Freitas',    '+5562991110030', '1999-06-06');

-- ============================================================
-- Vínculos pessoa ↔ GR
-- ============================================================
INSERT INTO group_relationships (person_id, group_id, type, status) VALUES
  -- GR Norte (6 membros)
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', 'visitor','active'),
  -- GR Sul (6 membros)
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000002', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000002', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000002', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000002', 'visitor','active'),
  -- GR Leste (6 membros)
  ('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000003', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000003', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000003', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000003', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000003', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000003', 'visitor','active'),
  -- GR Oeste (5 membros)
  ('30000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000004', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000004', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000021', '20000000-0000-0000-0000-000000000004', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000004', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000023', '20000000-0000-0000-0000-000000000004', 'visitor','active'),
  -- GR Centro (7 membros)
  ('30000000-0000-0000-0000-000000000024', '20000000-0000-0000-0000-000000000005', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000025', '20000000-0000-0000-0000-000000000005', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000026', '20000000-0000-0000-0000-000000000005', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000027', '20000000-0000-0000-0000-000000000005', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000028', '20000000-0000-0000-0000-000000000005', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000029', '20000000-0000-0000-0000-000000000005', 'member', 'active'),
  ('30000000-0000-0000-0000-000000000030', '20000000-0000-0000-0000-000000000005', 'visitor','active');

-- ============================================================
-- Reuniões e frequência — GR Norte (Fase 3)
-- Datas no passado para demonstrar o sistema
-- ============================================================

-- Reunião 1: 5 semanas atrás — relatório enviado
INSERT INTO meetings (id, group_id, scheduled_at, status, report_submitted_at, notes) VALUES
  ('40000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   now() - interval '35 days',
   'completed',
   now() - interval '35 days' + interval '2 hours',
   'Estudo sobre comunidade');

INSERT INTO attendance_records (meeting_id, person_id, status) VALUES
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'present'),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'present'),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'present'),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'absent'),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'present');

-- Reunião 2: 4 semanas atrás — relatório enviado
INSERT INTO meetings (id, group_id, scheduled_at, status, report_submitted_at) VALUES
  ('40000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001',
   now() - interval '28 days',
   'completed',
   now() - interval '28 days' + interval '3 hours');

INSERT INTO attendance_records (meeting_id, person_id, status) VALUES
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'present'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'excused'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', 'present'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 'absent'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000005', 'on_leave');

-- Reunião 3: 3 semanas atrás — cancelada
INSERT INTO meetings (id, group_id, scheduled_at, status, notes) VALUES
  ('40000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000001',
   now() - interval '21 days',
   'cancelled',
   'Cancelada — feriado local');

-- Reunião 4: 2 semanas atrás — relatório enviado
-- Fernanda (004) agora tem 2 ausências seguidas → flag pastoral
INSERT INTO meetings (id, group_id, scheduled_at, status, report_submitted_at) VALUES
  ('40000000-0000-0000-0000-000000000004',
   '20000000-0000-0000-0000-000000000001',
   now() - interval '14 days',
   'completed',
   now() - interval '14 days' + interval '4 hours');

INSERT INTO attendance_records (meeting_id, person_id, status) VALUES
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 'present'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'present'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'absent'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'absent'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005', 'present');

-- Reunião 5: 1 semana atrás — agendada sem relatório (prazo encerrado)
INSERT INTO meetings (id, group_id, scheduled_at, status) VALUES
  ('40000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000001',
   now() - interval '7 days',
   'scheduled');

-- ============================================================
-- Visitantes — GR Norte (Fase 4)
-- Demonstra os três estados: poucas visitas, sugestão de vinculação e já convertido
-- ============================================================

-- Priscila Nunes (006) já cadastrada como visitante — 1 visita registrada
INSERT INTO visitor_visits (group_relationship_id, visited_at)
SELECT id, now() - interval '10 days'
FROM group_relationships
WHERE person_id = '30000000-0000-0000-0000-000000000006'
  AND group_id = '20000000-0000-0000-0000-000000000001'
  AND type = 'visitor';

-- Yasmin Rocha — visitante com exatamente 3 visitas → dispara sugestão de vinculação
INSERT INTO people (id, full_name, phone, birthdate) VALUES
  ('30000000-0000-0000-0000-000000000031', 'Yasmin Rocha', '+5562991110031', '1998-03-02');

INSERT INTO group_relationships (id, person_id, group_id, type, status) VALUES
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000031', '20000000-0000-0000-0000-000000000001', 'visitor', 'active');

INSERT INTO visitor_visits (group_relationship_id, visited_at) VALUES
  ('50000000-0000-0000-0000-000000000001', now() - interval '28 days'),
  ('50000000-0000-0000-0000-000000000001', now() - interval '14 days'),
  ('50000000-0000-0000-0000-000000000001', now() - interval '7 days');

-- Otávio Farias — ex-visitante já convertido a membro, histórico de visitas preservado
INSERT INTO people (id, full_name, phone, birthdate) VALUES
  ('30000000-0000-0000-0000-000000000032', 'Otávio Farias', '+5562991110032', '1996-11-19');

INSERT INTO group_relationships (id, person_id, group_id, type, status) VALUES
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000001', 'member', 'active');

INSERT INTO visitor_visits (group_relationship_id, visited_at) VALUES
  ('50000000-0000-0000-0000-000000000002', now() - interval '90 days'),
  ('50000000-0000-0000-0000-000000000002', now() - interval '75 days'),
  ('50000000-0000-0000-0000-000000000002', now() - interval '60 days'),
  ('50000000-0000-0000-0000-000000000002', now() - interval '45 days');

-- ============================================================
-- Casos de pastoreio — GR Norte (Fase 5)
-- Demonstra os dois estados relevantes: caso aberto sem ação
-- (resolução bloqueada) e caso aberto com ação registrada (resolução liberada)
-- ============================================================

-- Fernanda Castro (004) atingiu streak 2 na Reunião 2 → caso automático aberto.
-- A Reunião 4 elevou o streak real para 3 (reunião cancelada não conta), mas a
-- regra de escalonamento é exata (streak === 4), então o caso permanece aberto
-- sem escalonamento — nenhuma ação foi registrada ainda.
INSERT INTO pastoral_cases (id, person_id, group_id, status, trigger_streak, created_by, created_at) VALUES
  ('60000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000004',
   '20000000-0000-0000-0000-000000000001',
   'open',
   2,
   '00000000-0000-0000-0000-000000000003',
   now() - interval '28 days');

-- Diego Martins (005): caso aberto manualmente pelo líder (sem gatilho de
-- ausência), já com 1 ação registrada → demonstra o estado de resolução liberada.
INSERT INTO pastoral_cases (id, person_id, group_id, status, trigger_streak, created_by, created_at) VALUES
  ('60000000-0000-0000-0000-000000000002',
   '30000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000001',
   'open',
   NULL,
   '00000000-0000-0000-0000-000000000003',
   now() - interval '10 days');

INSERT INTO pastoral_actions (case_id, description, created_by, created_at) VALUES
  ('60000000-0000-0000-0000-000000000002',
   'Ligação realizada — combinado retorno na próxima reunião',
   '00000000-0000-0000-0000-000000000003',
   now() - interval '9 days');

-- ============================================================
-- Discipulado — GR Norte (Fase 6)
-- Demonstra uma atribuição ativa e uma substituição, preservando histórico
-- ============================================================

-- Marcos Alves (001): discipulado ativo pelo próprio líder do GR Norte
INSERT INTO discipleship_assignments (person_id, discipler_id, group_id, started_at, created_by, created_at) VALUES
  ('30000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000001',
   now() - interval '60 days',
   '00000000-0000-0000-0000-000000000003',
   now() - interval '60 days');

-- Tatiane Rocha (002): discipulado inicial pelo líder do GR, encerrado e
-- substituído pela coordenação — demonstra que a substituição encerra o
-- vínculo anterior preservando o histórico (5.3)
INSERT INTO discipleship_assignments (person_id, discipler_id, group_id, started_at, ended_at, created_by, created_at) VALUES
  ('30000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000001',
   now() - interval '90 days',
   now() - interval '30 days',
   '00000000-0000-0000-0000-000000000003',
   now() - interval '90 days');

INSERT INTO discipleship_assignments (person_id, discipler_id, group_id, started_at, created_by, created_at) VALUES
  ('30000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001',
   now() - interval '30 days',
   '00000000-0000-0000-0000-000000000002',
   now() - interval '30 days');

-- ============================================================
-- Formação — GR Norte (Fase 7)
-- Demonstra os três estados relevantes: todos os 4 programas concluídos,
-- apenas Cultura Emaús concluído, e nenhum programa registrado
-- ============================================================

-- Bruno Lima (003): os 4 programas concluídos → atende aos requisitos
-- formativos cadastrados para liderança
INSERT INTO training_records (person_id, program_id, completed_at, recorded_by)
SELECT '30000000-0000-0000-0000-000000000003', tp.id, now() - interval '120 days',
       '00000000-0000-0000-0000-000000000003'
FROM training_programs tp WHERE tp.code = 'cultura_emaus';

INSERT INTO training_records (person_id, program_id, completed_at, recorded_by)
SELECT '30000000-0000-0000-0000-000000000003', tp.id, now() - interval '90 days',
       '00000000-0000-0000-0000-000000000003'
FROM training_programs tp WHERE tp.code = 'makarios_1';

INSERT INTO training_records (person_id, program_id, completed_at, recorded_by)
SELECT '30000000-0000-0000-0000-000000000003', tp.id, now() - interval '60 days',
       '00000000-0000-0000-0000-000000000003'
FROM training_programs tp WHERE tp.code = 'makarios_2';

INSERT INTO training_records (person_id, program_id, completed_at, recorded_by)
SELECT '30000000-0000-0000-0000-000000000003', tp.id, now() - interval '30 days',
       '00000000-0000-0000-0000-000000000003'
FROM training_programs tp WHERE tp.code = 'makarios_3';

-- Marcos Alves (001): apenas Cultura Emaús concluído → apto a servir, não apto a liderar
INSERT INTO training_records (person_id, program_id, completed_at, recorded_by)
SELECT '30000000-0000-0000-0000-000000000001', tp.id, now() - interval '45 days',
       '00000000-0000-0000-0000-000000000003'
FROM training_programs tp WHERE tp.code = 'cultura_emaus';

-- Fernanda Castro (004): nenhum programa registrado (ausência de linhas =
-- nenhum programa concluído) → não apta a servir nem a liderar

-- ============================================================
-- Serviço — GR Norte (Fase 7)
-- Bruno Lima e Marcos Alves já concluíram Cultura Emaús → podem iniciar
-- vínculo de serviço ativo
-- ============================================================
INSERT INTO service_assignments (person_id, ministry_area_id, group_id, started_at, created_by)
SELECT '30000000-0000-0000-0000-000000000003', ma.id, '20000000-0000-0000-0000-000000000001',
       now() - interval '20 days', '00000000-0000-0000-0000-000000000003'
FROM ministry_areas ma WHERE ma.name = 'Acolhimento';

INSERT INTO service_assignments (person_id, ministry_area_id, group_id, started_at, created_by)
SELECT '30000000-0000-0000-0000-000000000001', ma.id, '20000000-0000-0000-0000-000000000001',
       now() - interval '15 days', '00000000-0000-0000-0000-000000000003'
FROM ministry_areas ma WHERE ma.name = 'Mídia e Som';

-- ============================================================
-- Papéis no GR — Anfitrião e Cooperador — GR Norte (5.8)
-- Demonstra o anfitrião ativo único do GR e dois cooperadores ativos
-- simultâneos, todos membros ativos do GR Norte
-- ============================================================

-- Diego Martins (005): anfitrião ativo do GR Norte
INSERT INTO group_hosts (id, person_id, group_id, started_at, created_by, created_at) VALUES
  ('90000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000005',
   '20000000-0000-0000-0000-000000000001',
   now() - interval '45 days',
   '00000000-0000-0000-0000-000000000003',
   now() - interval '45 days');

-- Tatiane Rocha (002) e Bruno Lima (003): cooperadores ativos simultâneos
-- do GR Norte — demonstra que vários cooperadores podem coexistir (5.8)
INSERT INTO group_cooperators (id, person_id, group_id, started_at, created_by, created_at) VALUES
  ('90000000-0000-0000-0000-000000000002',
   '30000000-0000-0000-0000-000000000002',
   '20000000-0000-0000-0000-000000000001',
   now() - interval '40 days',
   '00000000-0000-0000-0000-000000000003',
   now() - interval '40 days'),
  ('90000000-0000-0000-0000-000000000003',
   '30000000-0000-0000-0000-000000000003',
   '20000000-0000-0000-0000-000000000001',
   now() - interval '25 days',
   '00000000-0000-0000-0000-000000000003',
   now() - interval '25 days');
