# Roadmap — Pastoreio HUIOS

## Fases de Construção

---

### Fase 0 — Fundação e Documentação ✅

**Objetivo:** Base sólida antes de qualquer funcionalidade.

Entregas:
- [x] Inspeção e limpeza do repositório (remoção do tracker-notify)
- [x] `CLAUDE.md` com regras permanentes
- [x] Documentação completa em `/docs`
- [x] `.env.example` (Supabase + WhatsApp)
- [x] Configuração do projeto Next.js 14 + TypeScript estrito + Tailwind CSS
- [x] Configuração de ESLint, Prettier
- [x] Configuração de Vitest e Playwright (pt-BR, America/Sao_Paulo)
- [x] Configuração do Supabase CLI local (`supabase/config.toml`)
- [x] Script `pnpm check-all`
- [x] Componentes de marca: `HuiosLogo`, `HuiosAppIcon`, `EmausLogo`, `AppBrandHeader`, `InstitutionalFooter`
- [x] Componentes UI base: Button, Input, Label, Card, Badge, Separator
- [x] Assets SVG: `huios-mark.svg`, `huios-mark-on-green.svg`, `favicon.svg`, `huios-wordmark-placeholder.svg`
- [x] PWA: `manifest.json`, favicon SVG
- [x] Tokens de cor HUIOS mapeados ao sistema shadcn/ui
- [x] `pnpm typecheck` — zero erros
- [x] `pnpm build` — build de produção ok
- [x] `docs/BRAND_GUIDELINES.md` e `docs/WHATSAPP_INTEGRATION.md`

**Resultado:** Fase 0 concluída. Próximo: Fase A (dados WhatsApp) → Fase 1 (Autenticação).

---

### Fase A — WhatsApp: Dados

**Objetivo:** Adicionar campos necessários para notificações WhatsApp ao modelo de dados.

Entregas:
- [ ] Migration: `whatsapp_phone`, `whatsapp_notifications_enabled`, `whatsapp_opt_in_at`, `whatsapp_opt_out_at` em `profiles`
- [ ] Migration: `scheduled_end_time`, `timezone` em `groups`
- [ ] Migration: `scheduled_end_at`, `whatsapp_reminder_due_at` em `meetings`
- [ ] Migration: tabela `notifications` com idempotência `UNIQUE(meeting_id, user_id, notification_type, channel)`
- [ ] RLS para `notifications`

---

### Fase B — WhatsApp: MessagingProvider

**Objetivo:** Abstração de provedor de mensageria com mock funcional.

Entregas:
- [ ] `lib/messaging/types.ts`
- [ ] `lib/messaging/provider.ts` — interface `MessagingProvider`
- [ ] `lib/messaging/providers/mock.ts` — logs no terminal
- [ ] `lib/messaging/providers/meta-whatsapp.ts` — Meta Cloud API
- [ ] `lib/messaging/factory.ts` — seleção por env var
- [ ] `lib/messaging/templates/meeting-report-reminder.ts`
- [ ] Testes unitários do MockProvider

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

### Fase 4 — Visitantes e Conversão ✅

**Objetivo:** Acompanhamento de visitantes e transição para participante.

Entregas:
- [x] Migration: tabela `visitor_visits` (uma linha por visita, ligada a `group_relationships`)
- [x] Contagem de visitas por relação ativa
- [x] Sugestão após 3 visitas (não automático)
- [x] Tela de confirmação, adiamento ou encerramento
- [x] Conversão atômica (visitante → participante), histórico de visitas preservado
- [x] Encerramento de relação de visitante preserva histórico
- [x] Deduplicação por telefone
- [x] Alerta de nome semelhante
- [x] Testes unitários (10 cenários de visitantes)

**Resultado:** Fase 4 concluída. Próximo: Fase 5 (Casos e Ações de Pastoreio).

---

### Fase 5 — Casos e Ações de Pastoreio ✅

**Objetivo:** Acompanhamento de ausências e resolução de situações.

Entregas:
- [x] Migration: `pastoral_cases`, `pastoral_actions`
- [x] Criação automática após 2 ausências consecutivas (idempotente)
- [x] Escalonamento após 4 ausências (mesmo caso)
- [x] Criação manual pelo líder
- [x] Registro de ações de pastoreio
- [x] Linha do tempo de ações por caso
- [x] Resolução manual com resultado
- [ ] Notificações internas básicas
- [x] Testes de idempotência

**Resultado:** Fase 5 concluída, exceto notificações internas básicas (adiado — sem mecanismo de notificação in-app definido ainda; ver `docs/DECISIONS.md` DEC-021). Próximo: Fase 6 (Discipulado).

---

### Fase 6 — Discipulado ✅

**Objetivo:** Registro de quem tem discipulador responsável.

Entregas:
- [x] Migration: `discipleship_assignments`
- [x] Definição e substituição de discipulador
- [x] Encerramento de vínculo
- [x] Histórico de discipuladores
- [x] Indicador de cobertura de discipulado
- [x] Testes unitários (5 cenários)

**Resultado:** Fase 6 concluída. Próximo: Fase 7 (Formação e Serviço).

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
