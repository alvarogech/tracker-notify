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

---

## Decisões Pendentes

### PEND-001 — Remoção do código tracker-notify
**Questão:** O código existente do tracker-notify (serviço de rastreio de encomendas) deve ser removido do repositório?
**Impacto:** Estrutura do repositório. Os commits históricos ficam preservados no git independentemente.
**Status:** Aguardando decisão do responsável pelo produto.

### PEND-002 — Versão do Next.js
**Questão:** Next.js 14 (estável, App Router maduro) ou 15 (mais recente)?
**Consideração:** Next.js 15 traz React 19 e melhorias de performance, mas pode ter arestas em algumas integrações.
**Status:** Aguardando decisão.

### PEND-003 — Componentes UI
**Questão:** Usar shadcn/ui (acessível, baseado em Radix UI, sem lock-in) ou construir do zero com Tailwind?
**Recomendação:** shadcn/ui — agiliza o desenvolvimento sem criar dependência de biblioteca proprietária, e os componentes são copiados para o projeto.
**Status:** Aguardando decisão.

### PEND-004 — Projeto Supabase de Desenvolvimento
**Questão:** A URL e as keys do Supabase de desenvolvimento já estão disponíveis ou serão criadas no início da Fase 1?
**Impacto:** Necessário para Fase 1. Localmente pode usar Supabase CLI.
**Status:** Aguardando informação.

### PEND-005 — Testes Unitários
**Questão:** Vitest ou Jest?
**Recomendação:** Vitest — melhor integração com ESM e Next.js, mais rápido.
**Status:** Aguardando decisão.
