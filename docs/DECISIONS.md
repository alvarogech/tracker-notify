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

### DEC-028 — Atomicidade da transferência por chamadas sequenciais, sem função Postgres dedicada

**Data:** 2026-07-08
**Decisão:** `transferPerson` (`app/(leader)/pessoas/[id]/transferencia-actions.ts`) executa a transferência como uma sequência de chamadas `createAdminClient()` (encerrar vínculo atual → criar vínculo no novo GR → encerrar/criar vínculo de discipulado quando aplicável → registrar `group_transfers` → registrar `audit_logs`), sem uma função `LANGUAGE plpgsql` chamada via `.rpc()` para transação real no banco.
**Motivo:** Nenhuma fase anterior introduziu esse mecanismo — `confirmConversion` (Fase 4) e `assignDiscipler` (Fase 6) já resolvem substituições multi-passo com chamadas sequenciais, aceitando atomicidade best-effort como convenção estabelecida. O risco específico da transferência (linha de `group_relationships` encerrada sem a nova ser criada) é o mesmo risco já aceito em `assignDiscipler`, que encerra o vínculo de discipulado antes de inserir o novo. Introduzir uma função de banco só para este fluxo criaria uma segunda convenção de atomicidade coexistindo com a primeira, aumentando a superfície sem eliminar o risco (o registro de `group_transfers`/`audit_logs` continuaria sendo uma chamada separada de qualquer forma). Caso o produto exija atomicidade transacional real no futuro, o padrão deve ser adotado de uma vez para todos os fluxos multi-passo, não apenas para transferências.

### DEC-029 — Sequência de faltas já começa do zero no novo GR, sem alteração de código

**Data:** 2026-07-08
**Decisão:** Confirmado, por leitura de `lib/pastoral-care/case-sync.ts`, que nenhuma mudança de código é necessária para a regra 5.5 ("a sequência operacional de faltas começa no novo GR após a transferência"). `syncPastoralCasesAfterReport` busca o histórico de reuniões filtrando `.eq('group_id', groupId)` (o GR cujo relatório acabou de ser enviado) e computa `computeAbsenceStreak` apenas sobre esse histórico. Como a pessoa transferida não tem `attendance_records` em reuniões do novo GR anteriores à transferência (reuniões são específicas de cada GR), a sequência começa naturalmente do zero na primeira reunião do novo GR após a mudança. Não há nenhum ponto do código que consulte sequência ou histórico de ausências apenas por `person_id` sem escopo de `group_id`.
**Motivo:** Evita alteração desnecessária em código já correto; documenta a verificação exigida pela Fase 8 em vez de introduzir lógica redundante.

### DEC-030 — Sem módulo de regra pura dedicado a transferências

**Data:** 2026-07-08
**Decisão:** Não foi criado `lib/business-rules/transfers.ts`. As únicas decisões da transferência além da orquestração de banco são checagens triviais de existência/igualdade (GR de destino diferente do atual; pessoa é membro ativo; há atribuição de discipulado ativa) já expressas como guards simples no Server Action, e a decisão "oferecer manter/encerrar discipulador" na UI reaproveita o mesmo `activeAssignment` que a página da pessoa já calcula (mesmo padrão `.find(a => a.endedAt === null)` consagrado por `resolveActiveAssignment`, `lib/business-rules/discipleship.ts`, Fase 6) — sem reintroduzir a checagem.
**Motivo:** Mesmo julgamento da DEC-025: criar um módulo de regra pura só para encapsular comparações triviais (`===`) seria forçar uma abstração sem lógica de negócio genuína por trás, e duplicaria uma checagem de discipulador ativo que já existe e já é testada desde a Fase 6.

### DEC-031 — Índice único de anfitrião escopado por GR, não por pessoa (inverso do discipulado)

**Data:** 2026-07-09
**Decisão:** `group_hosts` usa `UNIQUE (group_id) WHERE ended_at IS NULL`, ao contrário de `discipleship_assignments`, que usa `UNIQUE (person_id) WHERE ended_at IS NULL`. A regra 5.8 diz "1 anfitrião ativo por GR por vez" — quem tem no máximo um vínculo ativo é o **grupo**, não a pessoa. Uma mesma pessoa poderia, em tese, ser anfitriã de mais de um GR ao mesmo tempo sem violar a 5.8 (o sistema não proíbe isso explicitamente), mas o Server Action `assignHost` já impede esse cenário na prática, pois só permite definir como anfitrião uma pessoa que seja membro ativo do próprio GR — e uma pessoa só tem uma relação de GR ativa por vez (regra implícita já usada por `getActiveGroupForPerson` desde a Fase 6).
**Motivo:** Modelar a constraint no sentido oposto ao de `discipleship_assignments` evita o erro de copiar o índice de discipulado sem adaptar ao sujeito correto da regra ("por GR", não "por pessoa"). Colocar a constraint no banco (não apenas checagem de aplicação) torna a regra estrutural, seguindo o mesmo padrão de segurança já estabelecido pela DEC-019 (caso de pastoreio) e pela Fase 6 (discipulado).

### DEC-032 — Guarda de integridade opcional em `group_cooperators`: `UNIQUE(group_id, person_id) WHERE ended_at IS NULL`

**Data:** 2026-07-09
**Decisão:** Diferente de `service_assignments` (Fase 7), que não tem nenhum índice de unicidade sobre atribuições ativas, `group_cooperators` recebeu `UNIQUE (group_id, person_id) WHERE ended_at IS NULL`. A tabela também não tem coluna `updated_at`/trigger, ao contrário de `group_hosts` e `service_assignments` — cooperador é apenas inserido ou encerrado, nunca editado em outro campo.
**Motivo:** A 5.8 não exige essa constraint explicitamente, mas sem ela seria possível a mesma pessoa acumular duas linhas "ativas" de cooperador redundantes no mesmo GR (ex.: duplo clique em "Marcar como cooperador"), o que não representa nenhum estado de negócio válido — diferente de `service_assignments`, onde a mesma pessoa pode legitimamente servir em duas áreas distintas ao mesmo tempo (a unicidade ali seria incorreta). `addCooperator` já checa a existência antes de inserir (idempotência na aplicação), e a constraint no banco fecha a mesma condição de corrida que a DEC-019 já resolveu para casos de pastoreio.

### DEC-033 — Os 12 indicadores da Fase 9 e suas janelas de cálculo

**Data:** 2026-07-09
**Decisão:** `lib/business-rules/indicators.ts` centraliza o cálculo (taxas de cobertura genéricas, taxa de presença e seleção das reuniões mais recentes) usado pelo dashboard do líder (`app/(leader)/inicio/page.tsx`, escopado ao próprio GR) e pelo dashboard da coordenação (`app/(coordination)/coordenacao/page.tsx`, agregado à rede inteira — visível a `coordinator` e `admin`, não restrito a admin). Os 12 indicadores, cobrindo as 8 categorias citadas no roadmap, são:
1. **Pessoas** — Membros ativos (contagem).
2. **Pessoas** — Anfitrião definido no GR (líder: Sim/Não) / GRs sem anfitrião definido (coordenação: contagem), via `resolveActiveHost` (`group-roles.ts`).
3. **Pessoas** — Cooperadores ativos (contagem), via `resolveActiveCooperators`.
4. **Visitantes** — Visitantes ativos (contagem total da relação ativa; distinto do indicador de ação "aguardando vinculação", que usa o mesmo `shouldSuggestConversion` já usado no `/admin`).
5. **Presença** — Taxa de presença nas últimas 6 reuniões com relatório enviado por GR (`selectRecentMeetings`/`selectRecentMeetingsPerGroup` + `computeAttendanceRate`, que exclui `on_leave` do denominador por força da regra 5.1).
6. **Discipulado** — Cobertura de discipulado: % de membros ativos com `discipleship_assignments` ativo (via `computeCoverageRate`).
7. **Formação** — % de membros ativos com Cultura Emaús concluída (registro declarativo em `training_records`).
8. **Aptidão** — Aptos a servir, via `isEligibleToServe`.
9. **Aptidão** — Atendem requisitos formativos para liderança, via `isEligibleToLeadFormatively` (rótulo evita "aprovado"/"pronto para liderar", seção 12).
10. **Serviço** — % de membros ativos com `service_assignments` ativo.
11. **Pontualidade** — % de relatórios enviados dentro do prazo de 48h nos últimos 30 dias (reaproveita `isReportWithinDeadline` passando `report_submitted_at` como "agora", em vez de duplicar a constante de 48h).
12. **Pontualidade** — Relatórios com prazo encerrado e ainda não enviados (contagem; mesma métrica do "Relatórios atrasados" do roadmap, também exposta como item acionável no topo de cada painel).

Além dos 12, o painel da coordenação expõe "Casos escalados" (contagem de `pastoral_cases` com `status = 'open' AND escalated_at IS NOT NULL`) — satisfaz o item de roadmap "Casos escalados na visão da coordenação" separadamente dos 12, já que casos não é uma das 8 categorias nomeadas.
**Motivo:** O `/admin` (Fase 0/painel master) já mostra casos/visitantes/GRs/relatórios, mas é uma rota exclusiva de `admin` (`requireRole(['admin'])`) — a coordenação nunca teve acesso a essa página. Repetir os mesmos fatos operacionais em `/coordenacao` não é duplicação inútil: é a única forma de o papel `coordinator` efetivamente enxergar esses números, o que o próprio roadmap pede explicitamente ("Relatórios atrasados", "Casos escalados na visão da coordenação"). O foco de esforço novo desta fase, porém, foi discipulado/formação/serviço/aptidão/anfitrião/cooperador — indicadores que não existiam em nenhum painel anterior. Todas as taxas passam pelas mesmas funções puras testadas (`tests/unit/business-rules/indicators.test.ts`, 15 cenários), evitando duplicar a aritmética entre os dois painéis mesmo com consultas SQL necessariamente diferentes (uma escopada a um GR, outra à rede inteira).

### DEC-034 — "Filtros e busca consolidada" adiado

**Data:** 2026-07-09
**Decisão:** O item de roadmap "Filtros e busca consolidada" da Fase 9 não foi implementado.
**Motivo:** É uma peça de UI genuinamente separada (busca/filtro textual sobre GRs e pessoas na visão da coordenação) sem especificação de produto sobre quais campos, comportamento de filtro combinado ou onde deve viver na navegação — implementá-la por adivinhação arriscaria inventar comportamento de UX não pedido. Os dashboards desta fase já dão à coordenação visão consolidada por contagens/taxas; busca/filtro fica pendente de definição do responsável pelo produto, assim como os demais itens já registrados em "Decisões Pendentes" abaixo.

### DEC-035 — Suítes de testes de RLS (pgTAP) e E2E (Playwright) escritas, não executadas neste ambiente

**Data:** 2026-07-09
**Decisão:** Criados `supabase/tests/database/01_profiles_recursion.test.sql`, `02_leader_isolation.test.sql`, `03_coordinator_admin_access.test.sql` e `04_anon_denied.test.sql` (8 cenários de RLS exigidos pela CLAUDE.md seção 9, um por linha comentada em cada arquivo) e `tests/e2e/auth.spec.ts`, `meetings.spec.ts`, `people.spec.ts`, `pastoral-cases.spec.ts`, `leader-signup.spec.ts` (10 cenários E2E críticos exigidos pela mesma seção). Nenhuma das duas suítes pôde ser efetivamente executada neste ambiente de sandbox, por uma restrição de infraestrutura, não de código:

- **Docker não está disponível** neste sandbox (o daemon não inicia — restrição de permissões do ambiente). `supabase start`/`pnpm supabase:start` dependem de Docker para subir Postgres + Auth localmente.
- `pnpm supabase:test` (`supabase test db`) foi executado uma vez para confirmar a causa real da falha: `{"code":"LegacyDbConnectError","message":"failed to connect to postgres: ... PgClient: Failed to connect"}` — falha de conexão, não erro de sintaxe SQL. As 4 migrations/policies referenciadas pelos testes foram lidas integralmente antes da escrita (todas as `supabase/migrations/*.sql`), e cada asserção usa ids fixos do `supabase/seed.sql` (nunca dados inventados), mas a correção das consultas não pôde ser confirmada por execução real — apenas por leitura cuidadosa.
- `pnpm test:e2e` foi executado uma vez (`npx playwright test tests/e2e/home.spec.ts --project=chromium`, com timeout externo de 45s) e travou esperando o `webServer` (`pnpm dev`, definido em `playwright.config.ts`) ficar saudável em `localhost:3000` — nunca fica, pois este worktree não tem `.env.local` com credenciais Supabase válidas e não há banco semeado alcançável. Como alternativa, `npx playwright test --list` foi executado com sucesso (não depende de `webServer`) e confirmou que as 4 novas specs + `home.spec.ts` pré-existente somam exatamente **33 testes** (11 cenários × 3 projetos: chromium, Mobile Chrome, Mobile Safari) — ou seja, todos os arquivos são TypeScript válido e todos os 10 cenários novos são reconhecidos estruturalmente pelo Playwright.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` (84 testes unitários) e `pnpm build` rodaram limpos incluindo os novos arquivos `.ts`/`.spec.ts` (o `pnpm lint` mostrou apenas o conflito conhecido e inócuo do plugin `@next/next` por causa do path de worktree aninhado, já documentado como inofensivo em fases anteriores). Os arquivos `.sql` de `supabase/tests/database/` não são cobertos por nenhum desses quatro comandos — isso é esperado, pgTAP só roda via `supabase test db`.

**Para rodar de fato (fora deste sandbox):**
1. `pnpm supabase:start` (exige Docker Desktop ou um runner de CI com Docker habilitado) — sobe Postgres + Auth locais e aplica `supabase/migrations/` + `supabase/seed.sql`.
2. `pnpm supabase:test` (`supabase test db`) — roda os 4 arquivos pgTAP via `pg_prove` contra esse banco local.
3. `pnpm dev` (ou deixar o `webServer` do `playwright.config.ts` subir automaticamente) apontando `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` em `.env.local` para esse mesmo banco local semeado; então `pnpm test:e2e` (ou `BASE_URL=... pnpm test:e2e` contra um ambiente de homologação também semeado como o seed).
4. Para o cenário 3 de `auth.spec.ts` (conta pendente de aprovação), definir `LEADER_SIGNUP_CODE` no ambiente antes de rodar os testes — sem essa variável o teste é pulado (`test.skip`) explicitamente, não falha silenciosamente.

**Importante:** em nenhum momento este trabalho usou ou tentou usar o `.env.local` do piloto implantado (não presente neste worktree) — a restrição do ambiente foi respeitada integralmente; nenhuma suíte foi apontada para um banco real/produção.

### DEC-036 — Segunda metade da Fase 10: logs, acessibilidade, responsividade, performance e documentação

**Data:** 2026-07-09

**Revisão de logs (CLAUDE.md seção 6, "não registrar dados sensíveis em logs"):** `grep -rn "console\." app/ lib/ components/ middleware.ts` (excluindo `node_modules`/`.next`/testes) encontrou uma única ocorrência real: `lib/messaging/providers/mock.ts` (provedor mock de WhatsApp, usado quando `WHATSAPP_PROVIDER=mock`, hoje sem nenhum Server Action que o invoque — é scaffolding para uma integração fora do escopo atual, CLAUDE.md seção 11). O mock registrava no console o número de telefone completo (`params.to`) e o texto de cada parâmetro de template (`param.text`, que pode conter nome da pessoa, nome do GR etc.) a cada simulação de envio. Corrigido: o telefone agora é mascarado (mantém DDI/DDD e os 2 últimos dígitos, ex. `+556****78`) e o conteúdo dos parâmetros não é mais impresso — apenas o tipo do componente e a contagem de parâmetros. O restante da base já segue o padrão de Server Actions retornando `{ error }` em vez de logar (`lib/messaging/providers/meta-whatsapp.ts`, o provedor real, nunca usa `console.*`), confirmando por leitura — não apenas suposição — que não havia outro ponto de log sensível.

**Acessibilidade:**
- **Contraste:** os tokens `--status-warning`, `--status-danger` e `--status-info` (`app/globals.css`) reprovavam WCAG AA (4.5:1) tanto contra branco quanto contra o próprio fundo em tom (usado em `Badge` variants e em textos diretos como `VisitorPanel.tsx`/`RegisterVisitorForm.tsx`) — medido com script de contraste (fórmula de luminância relativa do WCAG): warning 1.91:1, danger 3.11:1, info 3.06:1 contra o fundo com opacidade 15% (só `--status-success`, 5.21:1, já passava). Ajustada apenas a luminosidade (L do HSL), mantendo matiz/saturação (ainda reconhecível como âmbar/vermelho/azul): warning 50%→27%, danger 60%→40%, info 60%→44%, resultando em ≥4.5:1 em todos os cenários testados (branco, fundo 10% e 15%). `--status-success` não foi alterado.
- Nas telas de autenticação (`app/(auth)/**`, `components/auth/*`), vários links/textos secundários sobre `bg-huios-dark` usavam `text-huios-cream/40` ou `/50` (contraste 3.20:1 e 4.23:1, abaixo de 4.5:1): "Voltar para o login" (`RecoverPasswordForm.tsx`, duas ocorrências), "Esqueci a senha" (`LoginForm.tsx`), o texto de convite para cadastro/login (`login/page.tsx`, `cadastro-lider/page.tsx`) e o rótulo de seção "Dados do GR" (`LeaderSignupForm.tsx`). Todos elevados para `/60` ou `/70` (5.46:1 e 6.93:1), preservando a hierarquia visual (ainda mais claros que o texto principal em `/80`–`100`). Separadores decorativos (`·`) em opacidade baixa não foram alterados — não transmitem informação textual.
- **Rótulos de formulário:** `LoginForm.tsx` e `LeaderSignupForm.tsx` já tinham todo `<Label htmlFor>` corretamente associado (confirmado por leitura, não só suposição — a suíte E2E da Fase 10 já depende disso via `getByLabel`). Encontrados 3 `<select>` sem nome acessível (nem `<Label htmlFor>` nem `aria-label`, apenas um `<p>` de legenda visual não associado programaticamente): dois em `DisciplershipPanel.tsx` (substituir/atribuir discipulador) e um cada em `ServiceAssignmentsPanel.tsx` (área de serviço) e `TransferPersonPanel.tsx` (GR de destino). Todos receberam `aria-label` com o texto da ação correspondente; nenhum desses `<select>` é referenciado pelos specs E2E existentes (`tests/e2e/`), então não há risco de quebrar teste.
- **Botões somente ícone:** varredura completa de `<Button size="icon">` e de `<Button>` sem texto visível não encontrou nenhuma ocorrência em `app/`/`components/` — todo botão com ícone já tem texto adjacente (ex. `<UserMinus /> Encerrar vínculo`) ou é texto puro (`DeleteGroupButton.tsx`). Nenhuma correção necessária.
- **Foco:** todo uso de `outline-none`/`focus:outline-none` no código está sempre pareado com `focus:ring-2`/`focus-visible:ring-2` (`components/ui/button.tsx`, `input.tsx`, `badge.tsx`, e os `<select>`/`<textarea>` dos formulários) — confirmado por grep e leitura de cada ocorrência; nenhum estado de foco removido acidentalmente.
- **`BottomNav.tsx`:** cada item já tem o rótulo em texto visível ao lado do ícone (nome acessível vem do próprio link), não precisando de `aria-label`.

**Responsividade a 320px:**
- `BottomNav.tsx`: o nav do admin tem 5 itens (`Painel`, `Solicitações`, `GRs`, `Pessoas`, `Casos`) dentro de um `flex` sem padding horizontal — a 320px cada item tem ~64px. Um `Link` com `flex-1` e sem `min-w-0` usa como largura mínima o `min-content` do seu conteúdo; como "Solicitações" é uma palavra de 12 caracteres sem ponto de quebra, seu `min-content` (~79px estimado a `text-xs`) excede os 64px disponíveis, forçando overflow horizontal de toda a barra em vez de quebrar a palavra. Corrigido com `min-w-0` no `Link` e `break-words`/`leading-tight` no rótulo (agora em `<span>` próprio), permitindo que rótulos longos quebrem em duas linhas dentro da própria coluna em vez de estourar a barra.
- `StatTile.tsx` e as grades `grid-cols-2` de `/inicio`, `/admin` e `/coordenacao` (rótulos longos como "Visitantes aguardando vinculação", "Atendem requisitos formativos p/ liderança"): verificado que **não** há o mesmo problema — `grid-cols-2` do Tailwind gera `repeat(2, minmax(0, 1fr))`, que já impede o overflow do min-content (diferente do `flex-1` sem `min-w-0` do BottomNav), e o `<span>` do rótulo não usa `whitespace-nowrap`, então quebra normalmente por palavra dentro da célula. Nenhuma mudança necessária; documentado aqui para não ser reaberto como dúvida futura.

**Performance:**
- `/coordenacao` (`app/(coordination)/coordenacao/page.tsx`): duas consultas independentes (`visitor_visits` e `training_records`, ambas dependentes apenas do primeiro lote já resolvido, não uma da outra) rodavam em sequência; unificadas em um único `Promise.all`.
- `/pessoas/[id]` (`app/(leader)/pessoas/[id]/page.tsx`): os 6 painéis (visitante, caso, discipulado, formação, serviço, anfitrião/cooperador, transferência) faziam 11 consultas totalmente sequenciais, mesmo sendo mutuamente independentes (todas dependem apenas do resultado da primeira consulta, `group_relationships`). Reestruturado em um único `Promise.all` com branches condicionais (`Promise.resolve(...)` como fallback) preservando exatamente a mesma lógica condicional original (`rel.type === 'visitor'`, `isMemberWithGroup`, `canTransfer`). Nenhuma consulta faz laço por item (sem N+1 real) em nenhuma das páginas revisadas, incluindo `/admin`, que já usava `Promise.all` desde antes desta fase.
- **Paginação — adiada por julgamento, não implementada:** `app/(leader)/pessoas/page.tsx` é escopado a um único GR (`.eq('group_id', ...)`), com ~30 pessoas no piloto — sem necessidade real de paginação. `app/(leader)/reunioes/page.tsx` cresce com o tempo (uma reunião semanal por GR), mas mesmo após alguns anos fica na casa de poucas centenas de linhas para um único GR — ainda pequeno para o piloto. Adicionar um `.limit()` simples sem uma UI de "carregar mais" esconderia reuniões antigas silenciosamente (pior do que a lista não paginada atual); construir essa UI é uma mudança de produto (decidir se histórico completo deve ficar sempre acessível, se a coordenação precisa de outro comportamento etc.), não uma correção de hardening — mesmo padrão de julgamento já usado na DEC-034 para "filtros e busca consolidada". Fica registrado como item a revisitar quando houver definição de produto, não como pendência técnica bloqueante.
- **Índices ausentes:** auditoria de todo `REFERENCES` em `supabase/migrations/*.sql` contra todo `CREATE INDEX` existente encontrou 12 colunas de chave estrangeira em tabelas de alto tráfego sem índice líder cobrindo-as: `group_relationships.group_id`/`person_id` (base de quase toda consulta escopada a um GR ou pessoa), `groups.leader_id` (avaliada por várias políticas de RLS do líder) e `.network_id`, `meetings.group_id`, `attendance_records.person_id` (motor de sequência de ausências, regra 5.1), `pastoral_cases.person_id` (só havia índice único parcial `WHERE status = 'open'`, não cobrindo histórico geral), `service_assignments.ministry_area_id`, `training_records.program_id`, `group_transfers.from_group_id`/`to_group_id` e `discipleship_assignments.discipler_id`. Todas adicionadas em `supabase/migrations/20260708000001_performance_indexes.sql` com `CREATE INDEX IF NOT EXISTS`. Deliberadamente **não** indexadas: colunas de atribuição/auditoria ("quem fez isso" — `created_by`, `resolved_by`, `recorded_by`, `transferred_by`, `report_reopened_by`, `audit_logs.actor_id`) — consultadas raramente (telas pontuais de auditoria), o volume do piloto não justifica o custo de escrita adicional de mais 11 índices; podem ser adicionadas depois se uma tela de auditoria por autor for construída.

**Vercel → Netlify:** `docs/ROADMAP.md` ("Deploy no Vercel") e `.env.example` (comentário "configurar estas variáveis no dashboard da Vercel") citavam a hospedagem antiga; corrigidos para Netlify, consistente com CLAUDE.md seção 2. Nenhum deploy foi executado por este trabalho — apenas a wording desatualizada foi corrigida.

**Documentação nova:** `docs/GUIA_DO_LIDER.md` (guia passo a passo para o líder de GR — login, reuniões/chamada/relatório e prazo de 48h, pessoas, visitantes e a sugestão de vinculação em 3 visitas, casos de pastoreio, discipulado, formação, serviço, anfitrião/cooperador) e `docs/PILOTO_CHECKLIST.md` (checklist não-código para o responsável pelo produto: backups no Supabase, variáveis de ambiente na Netlify, o gate de aprovação da CLAUDE.md seção 16 citado literalmente, e o lembrete de que a DEC-035 ainda não foi executada de fato em nenhum ambiente).

**Motivo geral:** esta é a segunda metade da Fase 10 (Segurança e Piloto) — hardening (logs, acessibilidade, responsividade, performance/índices) mais documentação, sem alterar regra de negócio, Server Action ou política de RLS existente. Todas as mudanças de UI foram limitadas a correções de defeito concreto e mensurável (contraste medido, rótulo ausente, overflow por cálculo de largura), não reescrita de estilo; cada componente alterado foi checado quanto a outros usos antes da mudança (grep de consumidores) para não quebrar props/comportamento existente.

### DEC-037 — Backup gratuito via GitHub Actions como alternativa ao Supabase Pro

**Data:** 2026-07-09
**Decisão:** `.github/workflows/supabase-backup.yml` roda `pg_dump -F c` diariamente (03:00 America/Sao_Paulo, mais disparo manual via `workflow_dispatch`) contra o banco de produção usando a connection string em `secrets.SUPABASE_DB_URL`, publicando o dump como artifact do GitHub Actions com retenção de 30 dias. Documentado em `docs/PILOTO_CHECKLIST.md` como "Opção B", alternativa ao backup nativo pago do Supabase (plano Pro, US$25/mês).
**Motivo:** O responsável pelo produto decidiu liberar o cadastro de dados reais para os líderes e pediu uma forma de backup sem custo. O plano gratuito do Supabase não inclui backup automático nem PITR. `pg_dump` agendado via GitHub Actions cobre a exigência da seção 16 do CLAUDE.md ("backups estejam configurados") sem depender de upgrade de plano, usando apenas infraestrutura já gratuita (Actions em repositório privado). Não é um substituto de Point-in-Time Recovery — é um snapshot diário completo, suficiente para o estágio de piloto. Requer que o responsável pelo produto configure o secret `SUPABASE_DB_URL` e dispare uma execução manual de teste antes de contar com o agendamento automático.

### DEC-038 — CI no GitHub Actions para rodar RLS/E2E de verdade

**Data:** 2026-07-09
**Decisão:** `.github/workflows/tests.yml` (disparo manual via `workflow_dispatch`, mais em todo push para `main`) sobe um Supabase local via Docker no runner do GitHub Actions (`supabase start` + `supabase db reset` para aplicar migrations e seed), roda as 8 suítes pgTAP (`supabase test db`) e os 10 cenários Playwright (`playwright test`) contra esse banco descartável, e publica o relatório do Playwright como artifact. `LEADER_SIGNUP_CODE=ci-teste` é fixado apenas no ambiente do job, sem relação com o código de convite real usado em produção.
**Motivo:** O sandbox de desenvolvimento usado neste projeto não tem Docker disponível (DEC-035), impedindo executar de fato as suítes de teste escritas. Runners do GitHub Actions têm Docker habilitado por padrão, tornando esse o caminho gratuito mais direto para finalmente rodar RLS/E2E de verdade — sem exigir que o responsável pelo produto instale nada localmente. Este workflow nunca toca o banco de produção; todo o ciclo (subir, semear, testar, derrubar) acontece em um Postgres efêmero do próprio job.

### DEC-039 — GRANT explícito de tabela para `anon`/`authenticated`

**Data:** 2026-07-09
**Decisão:** `supabase/migrations/20260709000001_grants.sql` concede explicitamente `SELECT` a `anon` e `SELECT/INSERT/UPDATE/DELETE` a `authenticated` em todas as tabelas do schema `public`, mais `ALTER DEFAULT PRIVILEGES` equivalente para tabelas futuras.
**Motivo:** A primeira execução real do `.github/workflows/tests.yml` (DEC-038) revelou que as 8 suítes pgTAP falhavam inteiramente com `permission denied for table profiles` (SQLSTATE 42501) — um erro de **GRANT ausente**, não de RLS. RLS restringe quais linhas uma role vê, mas o Postgres exige o GRANT de tabela antes mesmo de avaliar qualquer policy. Nenhuma migration deste projeto jamais concedeu esses privilégios explicitamente porque o Supabase Cloud já faz isso automaticamente no provisionamento do projeto (por isso o app sempre funcionou normalmente em produção, apesar de essa lacuna existir desde a Fase 1) — mas o Postgres local iniciado por `supabase start` no runner do GitHub Actions não herda esse bootstrap implícito. Esta migration tem efeito nulo em produção (privilégio já concedido) e corrige o ambiente de CI/local, tornando as migrations autossuficientes em qualquer Postgres, não apenas no provisionado pelo Supabase.

### DEC-040 — Correção de `throws_ok()` de 3 argumentos nos testes de RLS

**Data:** 2026-07-09
**Decisão:** As seis chamadas `throws_ok(sql, '42501', 'descrição em português')` em `02_leader_isolation.test.sql` e `04_anon_denied.test.sql` foram trocadas para a forma de dois argumentos `throws_ok(sql, '42501')`, movendo a descrição em português para um comentário SQL acima de cada chamada.
**Motivo:** A segunda execução real do `.github/workflows/tests.yml` (após a DEC-039 corrigir o GRANT) mostrou 8/8 arquivos rodando, mas 6 subtestes falhando por um motivo diferente: a documentação oficial do pgTAP especifica que, na forma de três argumentos, se o segundo argumento tiver exatamente 5 bytes (como `'42501'`), ele é tratado como código SQLSTATE e **o terceiro argumento passa a ser a mensagem de erro esperada, não uma descrição** — nossas chamadas comparavam a mensagem literal do Postgres (ex: `new row violates row-level security policy for table "pastoral_cases"`) contra o texto em português que tínhamos escrito como descrição, o que nunca poderia bater. A RLS em si estava correta o tempo todo (SQLSTATE 42501 era lançado como esperado); o defeito era só na chamada de asserção do teste.

### DEC-041 — WebKit ausente e senhas semeadas incompatíveis com GoTrue local

**Data:** 2026-07-09
**Decisão:** (1) `.github/workflows/tests.yml` agora instala `chromium webkit` (antes só `chromium`) — o projeto Playwright "Mobile Safari" usa o motor WebKit, que nunca tinha sido baixado, fazendo toda a suíte falhar rapidamente com "Executable doesn't exist" e, combinado com `retries: 2` do `playwright.config.ts`, inflando o tempo total do job. (2) Novo `scripts/fix-seed-passwords.mjs`, rodado logo após capturar as variáveis do Supabase local e antes dos testes E2E, redefine a senha de cada usuário semeado via `auth.admin.updateUserById()` (API do GoTrue), em vez de confiar no hash inserido por `crypt(senha, gen_salt('bf'))` direto em `auth.users` via SQL em `supabase/seed.sql`. Também adicionado `timeout-minutes: 15` ao job como rede de segurança.
**Motivo:** A terceira execução real do workflow (após a DEC-040 corrigir os testes de RLS, que passaram 8/8) revelou que **todo** cenário E2E que dependia de login efetivamente funcionar falhava com `E-mail ou senha incorretos` — exatamente o mesmo sintoma que o responsável pelo produto teve que corrigir manualmente no Supabase Cloud mais cedo nesta sessão (rodando `UPDATE auth.users SET encrypted_password = crypt(...)` na mão). O hash gerado por `crypt()` em SQL funciona no Postgres do Supabase Cloud mas nem sempre é aceito pela verificação do GoTrue no Postgres local iniciado por `supabase start` — a causa exata (versão do pgcrypto, formato do hash) não foi confirmada, mas o sintoma e a correção são idênticos aos já observados em produção. Usar a API admin do GoTrue para definir a senha, em vez de inserir o hash via SQL, garante que o próprio GoTrue faça o hashing, eliminando essa incompatibilidade em qualquer ambiente — não altera `supabase/seed.sql` (que já funciona em produção) para não arriscar regressão no caminho que já é usado no piloto real.

### DEC-042 — Aspas literais do `$GITHUB_ENV` quebravam `createClient()` no script de senha

**Data:** 2026-07-09
**Decisão:** `scripts/fix-seed-passwords.mjs` agora passa `process.env.API_URL` e `process.env.SERVICE_ROLE_KEY` por uma função `stripQuotes()` (`.replace(/^"(.*)"$/, '$1')`) antes de repassá-los a `createClient()`.
**Motivo:** A quarta execução real do workflow (após a DEC-041 corrigir WebKit e senhas) falhou numa etapa nova: `node scripts/fix-seed-passwords.mjs` lançava `Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL`. Causa: `pnpm exec supabase status -o env >> "$GITHUB_ENV"` escreve linhas como `API_URL="http://127.0.0.1:54321"`, com aspas duplas fazendo parte literal do valor. O mecanismo `$GITHUB_ENV` do GitHub Actions não remove essas aspas (ao contrário do parser de `.env.local` usado pelo Next.js, que por coincidência já tolerava o mesmo formato antes, no heredoc que escreve `.env.local`). O script recebia a string `"http://127.0.0.1:54321"` com as aspas incluídas, que falhava na validação de esquema HTTP/HTTPS da biblioteca `@supabase/supabase-js`.

### DEC-043 — `instance_id` e colunas de token ausentes tornavam usuários semeados invisíveis à API admin do GoTrue

**Data:** 2026-07-09
**Decisão:** `supabase/seed.sql` agora insere `auth.users` especificando explicitamente `instance_id = '00000000-0000-0000-0000-000000000000'`, `aud = 'authenticated'`, `role = 'authenticated'` e todas as colunas de token (`confirmation_token`, `recovery_token`, `email_change_token_new`, `email_change`, `email_change_token_current`, `phone_change`, `phone_change_token`, `reauthentication_token`) como string vazia `''`, em vez de deixá-las no valor padrão da coluna. Removida a etapa temporária de diagnóstico `[Diagnóstico temporário] Inspecionar auth.users` do workflow.
**Motivo:** A quinta execução real do workflow (após a DEC-042 corrigir a URL) trocou o erro `Invalid supabaseUrl` por `User not found` em `updateUserById()`, e `admin.listUsers()` retornava `[]` — nenhum usuário visível para a API admin do GoTrue, mesmo a etapa de seed tendo rodado sem erro e os 7 registros existindo em `auth.users` (confirmado via `SELECT` direto por `psql` numa etapa de diagnóstico temporária). A API admin do GoTrue filtra internamente por `instance_id`; como o INSERT original de `supabase/seed.sql` não especificava essa coluna, ela ficava com seu valor padrão (não necessariamente o UUID zerado que o GoTrue local usa como instância corrente), fazendo toda consulta administrativa por `id` ou listagem não encontrar nenhuma linha — mesmo com os dados presentes e corretos na tabela. Preencher `instance_id`/`aud`/`role`/tokens explicitamente é a prática documentada da comunidade Supabase para seeds manuais de `auth.users` e não muda nenhum comportamento já em produção (só adiciona valores explícitos onde antes havia o padrão da coluna).

### DEC-044 — `pg_dump` do backup precisa ser da mesma versão major do Postgres de produção

**Data:** 2026-07-09
**Decisão:** `.github/workflows/supabase-backup.yml` passa a usar a imagem de container `postgres:17` (antes `postgres:15`) para rodar o `pg_dump`.
**Motivo:** Ao testar manualmente o workflow de backup pela primeira vez (após o responsável pelo produto cadastrar o secret `SUPABASE_DB_URL`), a execução falhou com `pg_dump: error: aborting because of server version mismatch — server version: 17.6; pg_dump version: 15.18`. O `pg_dump` recusa fazer dump de um servidor com versão major mais nova que a sua própria. O projeto Supabase de produção roda Postgres 17; a imagem do container precisa acompanhar essa versão (ou mais nova) para o backup funcionar.

### DEC-045 — Página de detalhe do GR e exclusão em cascata para limpeza de GRs de teste

**Data:** 2026-07-13
**Decisão:** (1) Nova página `/coordenacao/[id]` (coordenação/admin) mostra um dashboard completo de um único GR — indicadores (membros, visitantes, presença, casos, anfitrião/cooperadores, cobertura de discipulado/formação/serviço), lista de membros e visitantes (linkando para `/pessoas/[id]`), casos de pastoreio abertos (linkando para `/casos/[id]`) e as últimas reuniões. O `GroupCard` na lista de `/coordenacao` agora é clicável e leva a essa página. (2) Nova ação `deleteGroupCascade` (só admin) exclui um GR e, na ordem correta de dependência, tudo vinculado a ele — reuniões, casos de pastoreio, discipulado, vínculos de serviço, anfitriões, cooperadores, transferências e os vínculos de pessoas — além de remover as pessoas que ficarem sem nenhum vínculo em qualquer outro GR (pessoas com histórico em outro GR são preservadas). Exposta via `CascadeDeleteGroupButton`, que exige digitar o nome exato do GR para confirmar (mais forte que o `confirm()` do botão "Excluir" padrão), tanto na lista quanto no dashboard do GR.
**Motivo:** O botão "Excluir" existente (`deleteGroup`) recusa a exclusão sempre que o GR tem qualquer pessoa/reunião/caso vinculado — comportamento correto como padrão de segurança para GRs reais, mas que impedia o responsável pelo produto de limpar os GRs de teste criados durante o desenvolvimento antes de liberar o sistema para os líderes reais. Como essa operação é irreversível e apaga histórico pastoral, ela fica claramente separada do fluxo normal, exige confirmação por digitação do nome e é restrita a admin — não deve ser usada em GRs com dados reais.

### DEC-046 — Páginas de Configurações (admin e líder), divulgação pública de GRs, e correção de bug pré-existente no middleware

**Data:** 2026-07-13
**Decisão:** (1) Nova página `/admin/configuracoes`: nome da rede, troca da própria senha, e gestão de usuários (ativar/desativar, trocar papel, redefinir senha de qualquer usuário — exceto a própria conta, para evitar lockout acidental). (2) Nova página `/configuracoes` (líder/coordenação/admin): edição dos dados do próprio GR (nome, dia, horário, local — sem o campo "ativo", que continua exclusivo do admin) e troca da própria senha. Acesso a ambas via um ícone de engrenagem no cabeçalho (`AppBrandHeader`), sem ocupar espaço na navegação inferior. (3) Nova página pública `/grs` (sem login, `dynamic = 'force-dynamic'` para nunca cachear estaticamente) lista os GRs ativos — nome, líder, dia, horário, local — para divulgação a quem quer visitar; atualiza sozinha porque busca direto do banco a cada acesso. (4) **Correção de bug pré-existente**: o middleware (`middleware.ts`) nunca incluía `/` (a home pública) em `PUBLIC_ROUTES`, então todo visitante anônimo que acessasse a raiz do site era silenciosamente redirecionado para `/login` sem nunca ver a página inicial. Corrigido com uma comparação exata `path === '/'` (não `startsWith`, que tornaria qualquer rota "pública"). A nova rota `/grs` foi para uma lista separada, `ALWAYS_PUBLIC`, que não redireciona em nenhuma direção (nem para usuário logado, nem deslogado), já que também é útil para quem já está autenticado conferir o que está sendo divulgado.
**Motivo:** Pedido do responsável pelo produto para (a) conseguir ajustar dados de conta/sistema sem depender de mim para cada alteração pontual, (b) dar autonomia ao líder para manter dia/horário/local do próprio GR atualizados sem depender da coordenação, e (c) ter uma página pronta para divulgar externamente onde e quando os GRs acontecem. O bug do middleware foi encontrado ao verificar que a nova página `/grs` precisava ser acessível sem login — o mesmo problema já afetava a home (`/`) desde sempre, só nunca tinha sido percebido porque ninguém testou o acesso anônimo à raiz do site nesta sessão até agora.

### DEC-047 — Link público por GR para membro completar/mesclar os próprios dados de contato

**Data:** 2026-07-13
**Decisão:** Cada GR na página pública `/grs` ganha um botão "Quero participar / completar meus dados" que leva a `/grs/[id]` — formulário público (sem login) que lista os nomes já vinculados como membro ativo daquele GR num `<select>`; a pessoa escolhe o próprio nome (ou "Meu nome não está na lista") e preenche telefone/e-mail/nascimento. Se escolheu um nome da lista, os dados são mesclados diretamente no registro existente (`people.update`), sem revisão/aprovação. Se escolheu "não está na lista", cria uma pessoa nova vinculada ao GR como **visitante** (não membro) — mesma régua que qualquer visita presencial, cabendo ao líder confirmar e converter depois. A ação (`submitPublicGroupSignup`) confirma que o `person_id` enviado pertence de fato àquele `group_id` antes de escrever, para a URL pública não virar um jeito de editar pessoa de outro GR.
**Motivo:** Fecha o ciclo aberto pela DEC-043→ importação por nome: em vez do líder digitar telefone/e-mail/nascimento de cada pessoa manualmente, o próprio membro completa via link. O responsável pelo produto escolheu explicitamente o modelo de confiança mais simples (escolher da lista, sem revisão) por ser um grupo pequeno e conhecido, mas pediu também a opção de cadastro livre para quem não estiver na lista — atendida como registro de **visitante**, não membro, para não pular a etapa de confirmação pessoal do líder que já existe para qualquer novo integrante (CLAUDE.md 5.2). Sem CAPTCHA/rate-limiting, mesmo padrão já aceito para `/cadastro-lider` (ver "Decisões Pendentes" abaixo).

### DEC-048 — Detalhe de reunião (somente leitura) para coordenação/admin

**Data:** 2026-07-13
**Decisão:** Nova rota `/coordenacao/[id]/reunioes/[meetingId]`, restrita a coordenação/admin, mostra a mesma frequência (presente/ausente/justificado/afastado) e sequências de falta que o líder já vê em `/reunioes/[id]`, mas sempre em modo leitura — nunca renderiza o formulário interativo de chamada, mesmo para reunião ainda não finalizada. A lista "Últimas reuniões" em `/coordenacao/[id]` agora é clicável e leva a essa página.
**Motivo:** Pedido do responsável pelo produto para conseguir ver como foi uma reunião específica (quem compareceu, quem não) a partir do dashboard do GR, sem precisar pedir print pro líder. Optei por uma página nova em vez de abrir `/reunioes/[id]` (hoje restrita a `requireRole(['leader'])` com checagem de posse por `leader_id`) para coordenação/admin, para não arriscar expor o formulário editável de chamada — que deve continuar sendo prerrogativa exclusiva do líder — através de uma ramificação de permissão numa página que já tem lógica de posse sensível.

### DEC-049 — Acesso ao sistema para cooperadores (escopo puramente operacional)

**Data:** 2026-07-13
**Decisão:** Nova role `cooperator` em `profiles` (ao lado de leader/coordinator/admin) e nova tabela `group_helpers` (profile_id único → group_id, mais person_id opcional para ligar de volta ao registro de `people`/`group_cooperators`). O cooperador tem acesso só a **Reuniões** (criar, fazer chamada, enviar relatório) e **Pessoas** (cadastrar, editar contato, registrar/converter visitante) do GR ao qual foi vinculado — sem Casos de pastoreio, Discipulado, Formação, Serviço, Transferências, papéis de anfitrião/cooperador ou edição dos dados do GR, conforme CLAUDE.md 5.8 ("cooperador... é dado puramente operacional/organizacional"). Convite feito pelo líder (ou coordenação/admin) direto do perfil da pessoa, num novo painel "Acesso ao sistema" que só aparece quando a pessoa já é cooperadora ativa do GR (`group_cooperators`) — gera login com senha temporária (mesmo padrão do reset de senha do admin) e mostra a senha uma única vez. Todas as policies de RLS novas são **aditivas**: nenhuma policy de líder existente foi alterada, só `people_leader_insert` teve a lista de roles ampliada (já não tinha escopo de GR para nenhuma role). Um helper compartilhado, `getCallerGroupId()`, resolve o GR do usuário logado (via `groups.leader_id` para líder, via `group_helpers` para cooperador) e substitui a busca `.eq('leader_id', profile.id)` espalhada pelas páginas/ações de Reuniões e Pessoas. Cooperador aterrissa em `/reunioes` após login (não em `/inicio`, que tem indicadores de casos de pastoreio) e vê uma navegação inferior reduzida (só Reuniões e Pessoas). Testado com nova suíte pgTAP (`05_cooperator_scope.test.sql`, 11 cenários) cobrindo escopo positivo (próprio GR), isolamento (outro GR) e exclusão de pastoreio/discipulado mesmo do próprio GR.
**Motivo:** Pedido do responsável pelo produto para que cooperadores também ajudem a alimentar o sistema, não só o líder. O escopo (Reuniões + Pessoas, nada de pastoreio/discipulado) não foi uma decisão nova minha — é a própria definição de cooperador já registrada em CLAUDE.md 5.8 desde a Fase 9, então apliquei a mesma régua ao acesso técnico. Optei por policies RLS aditivas (em vez de reescrever as existentes para incluir `OR EXISTS group_helpers...`) especificamente para não arriscar regressão nas policies de líder que já protegem dados reais — é mais fácil auditar "o que essa role nova pode fazer a mais" do que reconferir todas as policies antigas por inteiro.

### DEC-050 — Duas quebras na suíte pgTAP causadas pela própria DEC-049

**Data:** 2026-07-15
**Decisão:** (1) `01_profiles_recursion.test.sql` esperava exatamente 7 perfis semeados (contagem hardcoded) — corrigido para 8 depois que a DEC-049 adicionou o cooperador de teste ao `seed.sql`. (2) `05_cooperator_scope.test.sql` testava a prevenção de auto-escalonamento de escopo do cooperador (`UPDATE group_helpers SET group_id = ...`) com `throws_ok(..., '42501')`, mas RLS em UPDATE **não lança exceção** quando a linha alvo fica invisível ao `USING` da policy — o Postgres só atualiza 0 linhas silenciosamente (diferente de INSERT, onde falhar o `WITH CHECK` lança 42501 de verdade). Corrigido trocando por uma verificação de estado: roda o UPDATE como instrução solta e confirma via `is()` que o `group_id` da linha permaneceu inalterado.
**Motivo:** A primeira execução real do workflow após a DEC-049 (commit 76ecb59) falhou a suíte de RLS antes mesmo de chegar ao E2E — `Files=5, Tests=41, Result: FAIL`, com os dois problemas acima. Ambos eram defeitos nos próprios testes novos/no fixture de seed, não nas policies de RLS em si (a policy de `group_helpers` já estava correta — o teste que a exercitava é que usava a técnica de asserção errada para UPDATE).

### DEC-051 — Navegação inferior inconsistente entre route groups

**Data:** 2026-07-15
**Decisão:** Os três layouts `(admin)`, `(coordination)` e `(leader)` cada um definia sua própria lista de itens de `BottomNav`. Como rotas como `/pessoas` e `/casos` moram fisicamente em `(leader)/`, qualquer papel que navegasse até essas URLs passava a ser envolvido pelo layout `(leader)`, não pelo layout da seção de onde a navegação partiu — trocando os ícones do rodapé no meio da navegação (ex: admin em `/admin` via um rodapé, ao clicar em "Pessoas" via outro). Corrigido centralizando a decisão numa única função, `getNavItemsForRole(role)` em `components/layout/BottomNav.tsx`, usada de forma idêntica pelos três layouts — o rodapé agora depende só do papel do usuário logado, nunca da rota/route group atual. De quebra, corrigido o mesmo tipo de inconsistência no ícone de engrenagem (configurações): admin sempre vai para `/admin/configuracoes`, independente de qual layout física está renderizando a página.
**Motivo:** Bug relatado pelo responsável pelo produto ("os icones da parte inferior mudam dependendo da pagina").

### DEC-052 — Discipulador: qualquer pessoa cadastrada, não só quem tem login

**Data:** 2026-07-15
**Decisão:** Reverte a DEC-022/DEC-023 (Fase 6), que restringiam discipulador a `profiles` (quem tem conta no sistema). `discipleship_assignments.discipler_id` agora referencia `people(id)` — qualquer pessoa cadastrada pode ser discipuladora, inclusive alguém sem login. Nova coluna `profiles.person_id` (nullable, `REFERENCES people(id)`) vincula, quando existir, o perfil de um líder/coordenação/admin/cooperador ao registro de pessoa correspondente — usada só para priorizar a lista, não para autorização. Migration faz backfill: cooperadores herdam o vínculo já existente em `group_helpers.person_id`; os demais perfis sem pessoa vinculada ganham um registro novo em `people` (cópia do nome), sem `group_relationships` — não aparecem como membro de nenhum GR, só ficam disponíveis para seleção/prioridade como discipulador. `seed.sql` e os dois fluxos de criação de perfil (`cadastro-lider`, `grantCooperatorAccess`) foram atualizados para manter esse vínculo em dia. A lista de opções na tela da pessoa (`getDisciplerOptions`, `app/(leader)/pessoas/[id]/page.tsx`) ordena líderes ativos e cooperadores ativos primeiro, resto em ordem alfabética — mas o **escopo** depende do papel de quem está olhando: coordenação/admin veem a rede inteira (já enxergavam todos os `people`/`profiles` via RLS antes disso); líder comum continua vendo só pessoas do próprio GR, porque CLAUDE.md 7 proíbe explicitamente o líder de visualizar pessoas de outros GRs — perguntei ao responsável pelo produto antes de decidir isso, já que a pedido original ("depois o restante da rede") por si só entraria em conflito com essa regra de acesso se aplicado ao líder comum. Dentro do próprio GR, o líder agora pode escolher **qualquer pessoa ativa do GR** como discipuladora de outra pessoa do GR (antes só podia se autoatribuir) — verificado no servidor via `canAssign` (checa `group_relationships` do GR do líder), não apenas pela lista exibida.
**Motivo:** Pedido explícito do responsável pelo produto, que é quem tem autoridade para alterar regras de negócio imutáveis (CLAUDE.md seção 5.3/5, "Qualquer modificação... exige aprovação explícita"). O motivo original da DEC-022 ("não há modelagem de pessoa comum como discipuladora sem base no documento mestre") deixa de valer no momento em que o próprio responsável pede essa modelagem.

---

## Decisões Pendentes

- Definir mecanismo de notificações internas para casos de pastoreio (criado, escalado) — ver DEC-021.
- Definir onde/como o sistema deve expor um fluxo de atribuição de "função de liderança" que consulte `isEligibleToLeadFormatively` — ver DEC-025.
- Considerar um mecanismo de limitação de tentativas (rate limiting) em `/cadastro-lider` e em `/grs/[id]` (DEC-047) — hoje sem CAPTCHA/throttling em nenhum dos dois.
- Disparar `.github/workflows/tests.yml` novamente após a DEC-049 (novas policies RLS de cooperador) e confirmar resultado verde (RLS e E2E) antes de aprovar dados reais.
- Investigar a causa exata da incompatibilidade de hash do `crypt()` entre o Postgres do Supabase Cloud e o Postgres local do `supabase start` (DEC-041) — hoje contornada, não explicada.
- Definir campos/comportamento de "Filtros e busca consolidada" para a coordenação — ver DEC-034.

