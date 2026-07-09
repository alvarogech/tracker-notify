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

### Fase 7 — Formação e Serviço ✅

**Objetivo:** Rastreamento declarativo de formação e elegibilidade para servir.

Entregas:
- [x] Migrations: `training_programs`, `training_records`, `ministry_areas`, `service_assignments`
- [x] Seed de áreas de serviço (8 áreas iniciais)
- [x] Seed de programas formativos (Cultura + Makarios 1/2/3)
- [x] Atualização declarativa de Cultura Emaús
- [x] Atualização declarativa de Makarios por volume
- [x] Cálculo de aptidão para servir
- [x] Cálculo de aptidão formativa para liderar
- [x] Bloqueio de serviço sem Cultura concluído
- [ ] Bloqueio de função de liderança sem formação completa
- [x] Testes unitários de elegibilidade (7 cenários)
- [ ] Testes de serviço (6 cenários)

**Resultado:** Fase 7 concluída, exceto os dois itens acima (adiados — ver `docs/DECISIONS.md` DEC-024 e DEC-025). Próximo: Fase 8 (Transferências).

---

### Fase 8 — Transferências ✅

**Objetivo:** Movimentação segura de pessoas entre GRs.

Entregas:
- [x] Migration: `group_transfers`
- [x] Fluxo exclusivo da coordenação
- [x] Encerramento do vínculo anterior + criação do novo (atômico)
- [x] Revisão do discipulador no fluxo
- [x] Registro em `audit_logs`
- [ ] Testes de atomicidade e auditoria

**Resultado:** Fase 8 concluída, exceto testes automatizados de atomicidade/auditoria (adiado — não há infraestrutura de testes de RLS via SQL neste repositório em nenhuma fase anterior, e a lógica de transferência é orquestração sequencial de chamadas ao Supabase sem regra pura nova a testar; ver `docs/DECISIONS.md` DEC-028, DEC-029 e DEC-030). Próximo: Fase 9 (Painéis).

---

### Papéis no GR — Anfitrião e Cooperador ✅

**Objetivo:** Registrar os papéis operacionais de anfitrião (1 ativo por GR) e cooperador (vários ativos por GR), conforme CLAUDE.md 5.8 (regra adicionada diretamente pelo responsável pelo produto, fora da numeração original das fases).

Entregas:
- [x] Migration: `group_hosts`, `group_cooperators`
- [x] Regra pura de resolução de anfitrião ativo e cooperadores ativos (`lib/business-rules/group-roles.ts`)
- [x] Definição e substituição de anfitrião (1 ativo por GR)
- [x] Encerramento de vínculo de anfitrião
- [x] Adição e remoção de cooperador (múltiplos simultâneos por GR)
- [x] RLS: líder escopado ao próprio GR, coordenação/admin livres
- [x] Painel no perfil da pessoa, visível a líder (do próprio GR)/coordenação/admin
- [x] Seed de exemplo no GR Norte (1 anfitrião ativo, 2 cooperadores ativos)
- [x] Testes unitários (9 cenários)

**Resultado:** Concluído. Ver `docs/DECISIONS.md` DEC-031 e DEC-032. Pré-requisito de dados para a Fase 9 (Painéis), que ainda não foi iniciada.

---

### Fase 9 — Painéis ✅

**Objetivo:** Dashboards com indicadores para líder e coordenação.

Entregas:
- [x] Dashboard do líder (mobile-first, ações prioritárias)
- [x] Dashboard da coordenação (visão consolidada da rede)
- [x] Todos os 12 indicadores (pessoas, visitantes, presença, discipulado, formação, serviço, aptidão, pontualidade)
- [x] Relatórios atrasados
- [x] Casos escalados na visão da coordenação
- [ ] Filtros e busca consolidada

**Resultado:** Fase 9 concluída, exceto filtros e busca consolidada (adiado — ver `docs/DECISIONS.md` DEC-034). Próximo: Fase 10 (Segurança e Piloto).

---

### Fase 10 — Segurança e Piloto

**Objetivo:** Revisão completa, acessibilidade e deploy de homologação.

Entregas:
- [x] Revisão completa de RLS (todos os cenários) — 8 cenários pgTAP em `supabase/tests/database/` cobrindo isolamento de líder (leitura e escrita, inclusive por id direto), visão de rede da coordenação, escrita completa do admin, negação padrão ao anônimo e a regressão da recursão de `profiles`; **escritos mas não executados neste ambiente** por falta de Docker — ver DEC-035 em `docs/DECISIONS.md`
- [x] Revisão de logs (sem dados sensíveis) — único ponto sensível encontrado foi `lib/messaging/providers/mock.ts` registrando telefone completo e conteúdo de parâmetros de template no console; mascarado e reduzido a contagem de parâmetros — ver DEC-036 em `docs/DECISIONS.md`
- [x] Acessibilidade: labels, contraste, foco, ARIA, HTML semântico — contraste dos tokens `--status-warning/danger/info` corrigido (reprovavam WCAG AA), links secundários em telas de auth ajustados, `<select>`s sem rótulo associado em 3 painéis receberam `aria-label`; labels/foco dos formulários e primitivos de `components/ui/` já estavam corretos — ver DEC-036
- [x] Responsividade a partir de 320px — corrigido overflow potencial do menu inferior do admin (5 itens, rótulo "Solicitações" sem ponto de quebra); grades de `StatTile` (`grid-cols-2`) confirmadas seguras por já usarem `minmax(0,1fr)` do Tailwind — ver DEC-036
- [x] Performance: sem N+1, paginação, índices — duas consultas independentes paralelizadas em `/coordenacao` e em `/pessoas/[id]` (6 painéis, 11 consultas agora em um único `Promise.all`); paginação avaliada e adiada por julgamento (escala de piloto, ~30 pessoas por GR) — ver DEC-036; nova migration `20260708000001_performance_indexes.sql` cobre 12 colunas de chave estrangeira sem índice
- [x] Build de produção sem erros — confirmado após as mudanças desta fase (`pnpm lint && pnpm typecheck && pnpm test && pnpm build`)
- [ ] Deploy no Netlify (homologação) — hospedagem migrou de Vercel para Netlify (CLAUDE.md seção 2); o deploy de homologação em si já ocorreu fora deste repositório/sandbox, item mantido em aberto aqui apenas para refletir que a confirmação formal não foi feita nesta fase
- [ ] Configuração de backups no Supabase — ação do responsável pela conta Supabase, não código; checklist em `docs/PILOTO_CHECKLIST.md`
- [x] Documentação de treinamento para líderes — `docs/GUIA_DO_LIDER.md`
- [x] Piloto com dados fictícios — já em vigor via `supabase/seed.sql` desde fases anteriores; nenhuma mudança necessária nesta fase
- [ ] Aprovação para piloto controlado com dados reais — decisão do responsável pelo produto, condicionada às 5 exigências da CLAUDE.md seção 16; checklist em `docs/PILOTO_CHECKLIST.md`

---

## Critérios do MVP Pronto

O MVP está apto ao piloto quando todos os 24 critérios do documento mestre forem atendidos. Ver `docs/FUNCTIONAL_REQUIREMENTS.md` para a lista completa.
