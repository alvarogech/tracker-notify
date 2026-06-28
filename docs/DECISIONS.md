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

---

## Decisões Pendentes

Nenhuma pendência em aberto no momento.

