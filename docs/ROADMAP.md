# Roadmap — Pastoreio HUIOS

## Fases de Construção

---

### Fase 0 — Fundação e Documentação ✅

**Objetivo:** Base sólida antes de qualquer funcionalidade.

Entregas:
- [x] Inspeção do repositório
- [x] `CLAUDE.md`
- [x] Documentação em `/docs`
- [x] `.env.example`
- [ ] Configuração do projeto Next.js + TypeScript + Tailwind
- [ ] Configuração de ESLint, Prettier
- [ ] Configuração de Vitest e Playwright
- [ ] Configuração do Supabase CLI local
- [ ] Script `pnpm check-all`
- [ ] CI inicial (GitHub Actions)

**Resultado atual:** Documentação criada. Aguardando aprovação para configuração do projeto.

---

### Fase 1 — Autenticação e Acesso

**Objetivo:** Login seguro com papéis e proteção de rotas.

Entregas:
- [ ] Supabase Auth configurado
- [ ] Tabela `profiles` com papéis `leader | coordinator | admin`
- [ ] RLS básica para `profiles`
- [ ] Middleware de proteção de rotas por papel
- [ ] Tela de login (e-mail + senha)
- [ ] Recuperação de senha
- [ ] Mensagem de acesso desativado
- [ ] Redirecionamento por papel após login
- [ ] Testes de permissão (8 cenários de RLS)
- [ ] Testes unitários de verificação de papel

---

### Fase 2 — Rede, GRs e Pessoas

**Objetivo:** Estrutura base de dados e cadastro.

Entregas:
- [ ] Migrations: `networks`, `groups`, `people`, `group_relationships`
- [ ] Seed com dados fictícios (5 GRs, 1 admin, 1 coordenador, 5 líderes, ~30 pessoas)
- [ ] Listagem de GRs (coordenação e admin)
- [ ] Listagem de pessoas do GR (líder)
- [ ] Cadastro básico de pessoa
- [ ] Busca por nome e telefone
- [ ] Visualização de perfil da pessoa
- [ ] RLS para todas as tabelas desta fase

---

### Fase 3 — Reuniões e Frequência

**Objetivo:** Fluxo semanal do líder.

Entregas:
- [ ] Migration: `meetings`, `attendance_records`
- [ ] Geração de reuniões futuras por agenda do GR
- [ ] Chamada: marcar presente/ausente/justificada
- [ ] Adição de visitante durante chamada
- [ ] Revisão antes do envio (resumo + alertas)
- [ ] Envio e bloqueio do relatório
- [ ] Cálculo do prazo (48h, fuso America/Sao_Paulo)
- [ ] Status do relatório: pendente/enviado no prazo/enviado com atraso
- [ ] Histórico de reuniões
- [ ] Testes unitários completos do motor de ausências (12 cenários)

---

### Fase 4 — Visitantes e Conversão

**Objetivo:** Acompanhamento de visitantes e transição para participante.

Entregas:
- [ ] Contagem de visitas por relação ativa
- [ ] Sugestão após 3 visitas (não automático)
- [ ] Tela de confirmação, adiamento ou encerramento
- [ ] Conversão atômica (visitante → participante)
- [ ] Deduplicação por telefone
- [ ] Alerta de nome semelhante
- [ ] Testes unitários (10 cenários de visitantes)

---

### Fase 5 — Casos e Ações de Pastoreio

**Objetivo:** Acompanhamento de ausências e resolução de situações.

Entregas:
- [ ] Migration: `pastoral_cases`, `pastoral_actions`
- [ ] Criação automática após 2 ausências consecutivas (idempotente)
- [ ] Escalonamento após 4 ausências (mesmo caso)
- [ ] Criação manual pelo líder
- [ ] Registro de ações de pastoreio
- [ ] Linha do tempo de ações por caso
- [ ] Resolução manual com resultado
- [ ] Notificações internas básicas
- [ ] Testes de idempotência

---

### Fase 6 — Discipulado

**Objetivo:** Registro de quem tem discipulador responsável.

Entregas:
- [ ] Migration: `discipleship_assignments`
- [ ] Definição e substituição de discipulador
- [ ] Encerramento de vínculo
- [ ] Histórico de discipuladores
- [ ] Indicador de cobertura de discipulado
- [ ] Testes unitários (5 cenários)

---

### Fase 7 — Formação e Serviço

**Objetivo:** Rastreamento declarativo de formação e elegibilidade para servir.

Entregas:
- [ ] Migrations: `training_programs`, `training_records`, `ministry_areas`, `service_assignments`
- [ ] Seed de áreas de serviço (8 áreas iniciais)
- [ ] Seed de programas formativos (Cultura + Makarios 1/2/3)
- [ ] Atualização declarativa de Cultura Emaús
- [ ] Atualização declarativa de Makarios por volume
- [ ] Cálculo de aptidão para servir
- [ ] Cálculo de aptidão formativa para liderar
- [ ] Bloqueio de serviço sem Cultura concluído
- [ ] Bloqueio de função de liderança sem formação completa
- [ ] Testes unitários de elegibilidade (7 cenários)
- [ ] Testes de serviço (6 cenários)

---

### Fase 8 — Transferências

**Objetivo:** Movimentação segura de pessoas entre GRs.

Entregas:
- [ ] Migration: `group_transfers`
- [ ] Fluxo exclusivo da coordenação
- [ ] Encerramento do vínculo anterior + criação do novo (atômico)
- [ ] Revisão do discipulador no fluxo
- [ ] Registro em `audit_logs`
- [ ] Testes de atomicidade e auditoria

---

### Fase 9 — Painéis

**Objetivo:** Dashboards com indicadores para líder e coordenação.

Entregas:
- [ ] Dashboard do líder (mobile-first, ações prioritárias)
- [ ] Dashboard da coordenação (visão consolidada da rede)
- [ ] Todos os 12 indicadores (pessoas, visitantes, presença, discipulado, formação, serviço, aptidão, pontualidade)
- [ ] Relatórios atrasados
- [ ] Casos escalados na visão da coordenação
- [ ] Filtros e busca consolidada

---

### Fase 10 — Segurança e Piloto

**Objetivo:** Revisão completa, acessibilidade e deploy de homologação.

Entregas:
- [ ] Revisão completa de RLS (todos os cenários)
- [ ] Revisão de logs (sem dados sensíveis)
- [ ] Acessibilidade: labels, contraste, foco, ARIA, HTML semântico
- [ ] Responsividade a partir de 320px
- [ ] Performance: sem N+1, paginação, índices
- [ ] Build de produção sem erros
- [ ] Deploy no Vercel (homologação)
- [ ] Configuração de backups no Supabase
- [ ] Documentação de treinamento para líderes
- [ ] Piloto com dados fictícios
- [ ] Aprovação para piloto controlado com dados reais

---

## Critérios do MVP Pronto

O MVP está apto ao piloto quando todos os 24 critérios do documento mestre forem atendidos. Ver `docs/FUNCTIONAL_REQUIREMENTS.md` para a lista completa.
