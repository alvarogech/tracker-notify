# Decisões Técnicas — Pastoreio HUIOS

Registro de decisões de arquitetura e produto. Atualizar sempre que uma decisão relevante for tomada.

---

## Decisões Aprovadas

### DEC-001 — Stack Principal
**Data:** 2026-06-28
**Decisão:** Next.js + App Router + TypeScript estrito + Tailwind CSS + Supabase
**Motivo:** Stack matura, bem documentada, excelente suporte para mobile-first, Supabase simplifica auth + banco + RLS sem necessidade de backend separado.

### DEC-002 — Banco de Dados
**Data:** 2026-06-28
**Decisão:** PostgreSQL via Supabase, com RLS em todas as tabelas, migrations SQL versionadas, tipos gerados a partir do schema.
**Motivo:** RLS é a camada de segurança mais confiável para isolamento entre GRs. Migrations versionadas garantem rastreabilidade.

### DEC-003 — Gerenciador de Pacotes
**Data:** 2026-06-28
**Decisão:** pnpm
**Motivo:** Mais eficiente em espaço em disco, estrito no isolamento de dependências.

### DEC-004 — Fuso Horário
**Data:** 2026-06-28
**Decisão:** America/Sao_Paulo em todas as operações
**Motivo:** Sistema destinado à Igreja Emaús, Brasil. Prazo do relatório (48h) deve ser calculado neste fuso.

### DEC-005 — Soft Delete
**Data:** 2026-06-28
**Decisão:** Usar `archived_at` em `people` e `ended_at/status` em vínculos, em vez de DELETE físico.
**Motivo:** Histórico pastoral é valioso e não pode ser perdido acidentalmente.

### DEC-006 — Formação Declarativa
**Data:** 2026-06-28
**Decisão:** Dados de Cultura Emaús e Makarios são declarativos (o líder pergunta à pessoa e registra). Sem integração com sistemas externos no MVP.
**Motivo:** Integração com secretaria ou outros sistemas está fora do escopo do MVP. O dado declarativo já atende a necessidade operacional.

### DEC-007 — Aptidão como Cálculo, Não Campo
**Data:** 2026-06-28
**Decisão:** Aptidão para servir e para liderar são calculadas dinamicamente a partir dos `training_records`, não armazenadas como campo redundante.
**Motivo:** Evita inconsistência entre o status registrado e o calculado. Mais simples de manter.

### DEC-008 — Remoção do código tracker-notify
**Data:** 2026-06-28
**Decisão:** Código do serviço tracker-notify (rastreio de encomendas) removido completamente via `git rm`. Histórico de commits preservado.
**Motivo:** O repositório é reutilizado para o Pastoreio HUIOS; o código anterior era de escopo completamente diferente.

### DEC-009 — Next.js 14
**Data:** 2026-06-28
**Decisão:** Next.js 14 (App Router).
**Motivo:** App Router maduro, ampla documentação, `@supabase/ssr` tem suporte consolidado para Next.js 14.

### DEC-010 — shadcn/ui
**Data:** 2026-06-28
**Decisão:** shadcn/ui com Radix UI para componentes de interface.
**Motivo:** Acessível por padrão, componentes copiados para o projeto (sem lock-in), integra nativamente com Tailwind CSS. Tokens de cor mapeados para a identidade HUIOS.

### DEC-011 — Supabase Keys
**Data:** 2026-06-28
**Decisão:** Keys do Supabase ainda não existem. Configuração via `.env.local` quando o projeto for criado. Desenvolvimento local usa `supabase start`.
**Motivo:** Fase 1 criará o projeto Supabase. Fase 0 documenta apenas o contrato de variáveis.

### DEC-012 — Vitest para testes unitários
**Data:** 2026-06-28
**Decisão:** Vitest.
**Motivo:** Melhor integração com ESM e Next.js, mais rápido que Jest, mesma API.

### DEC-013 — WhatsApp via MessagingProvider
**Data:** 2026-06-28
**Decisão:** Abstração `MessagingProvider` com implementações `MockWhatsAppProvider` (dev) e `MetaWhatsAppCloudProvider` (produção), selecionadas por `WHATSAPP_PROVIDER` env var.
**Motivo:** Permite desenvolvimento e testes sem dependência de conta Meta. Isolamento do provedor facilita eventual troca ou extensão.

### DEC-014 — Consentimento WhatsApp padrão desativado
**Data:** 2026-06-28
**Decisão:** `whatsapp_notifications_enabled` inicia como `false`. Líder ativa explicitamente nas configurações.
**Motivo:** Privacidade e conformidade. Não enviar mensagens sem consentimento explícito.

### DEC-015 — Idempotência de notificações
**Data:** 2026-06-28
**Decisão:** `UNIQUE (meeting_id, user_id, notification_type, channel)` na tabela `notifications`.
**Motivo:** Garante que falhas de job/retry não gerem mensagens duplicadas ao líder.

### DEC-016 — next.config.mjs em vez de .ts
**Data:** 2026-06-28
**Decisão:** Usar `next.config.mjs` (Next.js 14 não suporta `.ts`).
**Motivo:** Next.js 14 só aceita `next.config.js` ou `next.config.mjs`.

### DEC-017 — Tabela `visitor_visits` para contagem de visitas
**Data:** 2026-07-01
**Decisão:** Nova tabela `visitor_visits` (uma linha por visita, FK para `group_relationships`) em vez de reaproveitar `attendance_records` para visitantes.
**Motivo:** `attendance_records` está acoplada a `meetings` e ao motor de ausências de membros; misturar visitantes ali violaria a regra de que visitante nunca entra no denominador de frequência nem gera ausência. Uma tabela dedicada mantém a contagem de visitas simples, auditável e desacoplada do fluxo de chamada obrigatória.

### DEC-018 — Adiamento da sugestão de vinculação sem flag de banco
**Data:** 2026-07-01
**Decisão:** "Adiar" a sugestão de vinculação (3+ visitas) é tratado apenas como estado de UI (client-side), sem persistir flag no banco. A sugestão volta a aparecer normalmente na próxima renderização, conforme `docs/BUSINESS_RULES.md` (\"sugestão reaparece após próxima visita\").
**Motivo:** Não há regra pastoral que exija suprimir a sugestão indefinidamente; adicionar um campo de \"dispensado\" seria estado extra sem valor operacional e contrariaria a proibição de inventar regras pastorais não descritas no documento mestre.

### DEC-019 — Um caso de pastoreio aberto por pessoa
**Data:** 2026-07-02
**Decisão:** Índice único parcial `UNIQUE (person_id) WHERE status = 'open'` em `pastoral_cases`, garantido no banco (não apenas na aplicação).
**Motivo:** A regra 5.7 proíbe casos duplicados para a mesma sequência de ausências. Como a sequência de faltas de uma pessoa corresponde a um único caso em andamento — que é escalado (não duplicado) ao chegar em 4 faltas —, no máximo um caso aberto por pessoa é a modelagem correta. A constraint no banco torna a idempotência estrutural, não apenas uma checagem de aplicação sujeita a condição de corrida.

### DEC-020 — Escalonamento mantém acesso do líder
**Data:** 2026-07-02
**Decisão:** Ao escalar um caso à coordenação (streak = 4), as policies de RLS do líder sobre `pastoral_cases`/`pastoral_actions` continuam válidas — não há flag ou policy que revogue a visibilidade do líder. "Escalar" significa apenas que a coordenação também passa a enxergar e agir sobre o caso.
**Motivo:** CLAUDE.md 5.1 descreve escalonamento como ampliação de alçada ("escala... à coordenação"), não como transferência de responsabilidade. O líder continua sendo quem acompanha a pessoa no dia a dia.

### DEC-021 — Notificações internas adiadas
**Data:** 2026-07-02
**Decisão:** O item "Notificações internas básicas" do roadmap da Fase 5 não foi implementado nesta fase.
**Motivo:** Não há mecanismo de notificação in-app definido no sistema (a infraestrutura de notificações existente, Fases A/B, é específica para lembretes de relatório via WhatsApp). Implementar um canal de notificação in-app genérico sem definição prévia de UX/produto violaria a proibição de inventar comportamento não descrito no documento mestre. Fica pendente de definição do responsável pelo produto.

### DEC-022 — Discipulador é um `profiles`, não um `people`

**Data:** 2026-07-03
**Decisão:** `discipleship_assignments.discipler_id` referencia `profiles(id)` (usuários autenticados: líder, coordenação ou admin), não `people(id)`.
**Motivo:** O documento mestre descreve discipulado como algo conduzido por quem exerce liderança/pastoreio no sistema — não há modelagem de "quem pode discipular" fora dos papéis autenticados existentes. Referenciar `people` exigiria inventar um novo conceito (pessoa comum como discipuladora) sem base no documento mestre. `profiles` já representa exatamente o conjunto de pessoas com responsabilidade pastoral reconhecida pelo sistema.

### DEC-023 — Opções de discipulador seguem o RLS existente de `profiles`

**Data:** 2026-07-03
**Decisão:** A lista de discipuladores disponíveis para atribuição no perfil da pessoa é obtida com o cliente anônimo (RLS), sem relaxar as policies de `profiles`. Como `profiles_self_read` só permite ao líder ler o próprio registro, na prática um líder só enxerga a si mesmo como opção (e portanto só pode se atribuir como discipulador do seu GR). Coordenação e admin, cobertos por `profiles_coordinator_read`, enxergam todos os perfis ativos com papel `leader`, `coordinator` ou `admin` e podem atribuir qualquer um deles. O Server Action `assignDiscipler` reforça a mesma regra no servidor (líder só pode indicar a si mesmo), não confiando apenas na lista exibida na UI.
**Motivo:** Evita duplicar ou relaxar RLS de `profiles` só para popular um seletor — o comportamento de acesso já existente é exatamente o que faz sentido aqui: um líder de GR normalmente é quem disciplina as pessoas do próprio grupo; substituições que envolvem outro discipulador são decisão da coordenação.

### DEC-024 — RLS de `training_records` escopada por join, sem `group_id` direto

**Data:** 2026-07-04
**Decisão:** `training_records` não tem coluna `group_id`. O escopo de leitura/inserção do líder é feito via `EXISTS` unindo `group_relationships` → `groups` por `person_id`, no mesmo padrão de `visitor_visits` (`20260701000001_visitors.sql`). Não há policy de UPDATE/DELETE para o líder — o registro é declarativo e apenas de inserção; correção de lançamento indevido é tarefa da coordenação (coberta pela policy `training_records_coordinator_write`).
**Motivo:** Adicionar `group_id` a `training_records` duplicaria uma informação já derivável de `people` → `group_relationships`, e a formação de uma pessoa não muda de GR quando ela é transferida (é uma característica da pessoa, não do vínculo atual). O join por `person_id` mantém a tabela simples e evita um campo redundante que poderia divergir após uma transferência futura (Fase 8).

### DEC-025 — "Bloqueio de função de liderança sem formação completa" não implementado nesta fase

**Data:** 2026-07-04
**Decisão:** A Fase 7 implementa o cálculo de aptidão formativa para liderar (`isEligibleToLeadFormatively`) e a exibição da frase mandatória da seção 12 quando aplicável, mas não implementa um bloqueio de "função de liderança" em código, porque essa função não existe ainda como conceito no sistema. Nenhuma fase anterior modela "nomear alguém como líder de GR" como uma ação de aplicação (a associação `groups.leader_id` é definida apenas via seed/administração direta do banco). Da mesma forma, "Testes de serviço (6 cenários)" do roadmap não foi implementado: `CLAUDE.md` seção 9 lista como obrigatórios apenas os módulos de regra de negócio pura (`absences.ts`, `visitors.ts`, `eligibility.ts`) e não inclui um módulo de regra de negócio dedicado a `service_assignments` — a única regra pura de serviço (`canStartServiceAssignment`) já está coberta pelos 7 cenários de `eligibility.test.ts`, e testar `startServiceAssignment`/`endServiceAssignment` exigiria mockar o cliente Supabase, o que não está no escopo obrigatório desta fase.
**Motivo:** Implementar um fluxo de "atribuir função de liderança" sem essa modelagem já existir no documento mestre ou em fases anteriores seria inventar um comportamento não descrito, violando a seção 12. `isEligibleToLeadFormatively` já fica disponível para uso futuro (ex.: Fase 9 — painéis, ou uma futura Fase de administração de papéis) sem duplicação de regra. Fica pendente de definição do responsável pelo produto sobre onde/como uma "função de liderança" deve ser atribuída no sistema.

### DEC-026 — Autocadastro público de líder com aprovação administrativa obrigatória

**Data:** 2026-07-08
**Decisão:** Adicionada a rota pública `/cadastro-lider` onde um futuro líder informa seus dados e os do próprio GR (nome, dia, horário, local). O envio cria o usuário de autenticação e as linhas em `profiles`/`groups` imediatamente, mas com `active = false` e `pending_approval = true` — a pessoa não consegue acessar o sistema (cai em `/acesso-desativado`, que agora mostra uma mensagem distinta para "cadastro em análise") até que um administrador aprove pela nova tela `/admin/solicitacoes`. Rejeitar exclui permanentemente o usuário de autenticação, o perfil e o GR criados. Um código de convite (`LEADER_SIGNUP_CODE`, variável de ambiente secreta) é exigido no formulário como barreira mínima contra cadastros aleatórios, complementando — não substituindo — a aprovação manual.
**Motivo:** O responsável pelo produto pediu uma forma de não precisar cadastrar cada líder manualmente, mas mantendo controle explícito sobre quem entra na rede (consistente com a seção 7 do CLAUDE.md, que reserva ao administrador a gestão de usuários). Criar o registro como inativo por padrão, em vez de usar uma tabela de "solicitação" separada, reaproveita o mecanismo de `active`/RLS já existente e testado, evitando duplicar a modelagem de acesso.

### DEC-027 — Exportação CSV de GRs autocadastrados

**Data:** 2026-07-08
**Decisão:** Rota `GET /api/admin/export/grs`, restrita a `role = 'admin'` (checagem manual via `getCurrentProfile()`, já que `redirect()` de `next/navigation` não é apropriado dentro de um Route Handler), gera um CSV (sem dependência externa) com os GRs onde `signup_source = 'self'`: nome, líder, e-mail, dia/horário, local, status, data de cadastro e contagem de membros/visitantes ativos.
**Motivo:** Pedido explícito do responsável pelo produto para poder analisar em planilha os dados que os próprios líderes cadastraram. CSV evita adicionar uma biblioteca de planilhas (xlsx/exceljs) para uma necessidade que um texto delimitado por vírgulas já resolve — abre nativamente no Excel e no Google Sheets.

---

## Decisões Pendentes

- Definir mecanismo de notificações internas para casos de pastoreio (criado, escalado) — ver DEC-021.
- Definir onde/como o sistema deve expor um fluxo de atribuição de "função de liderança" que consulte `isEligibleToLeadFormatively` — ver DEC-025.
- Considerar um mecanismo de limitação de tentativas (rate limiting) em `/cadastro-lider` caso o código de convite vaze — hoje a única barreira além do código é a aprovação manual.

