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

---

## Decisões Pendentes

- Definir mecanismo de notificações internas para casos de pastoreio (criado, escalado) — ver DEC-021.

