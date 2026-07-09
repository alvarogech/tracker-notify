# Checklist Operacional — Piloto do Pastoreio HUIOS

Este checklist cobre os itens da Fase 10 (`docs/ROADMAP.md`) que **não são código** — decisões e configurações que só o responsável pelo produto (ou quem administra a conta Supabase/Netlify) pode executar. Nenhum destes itens pode ser resolvido por uma alteração no repositório.

---

## 1. Backups automáticos

O ambiente de produção do piloto precisa de backups configurados antes de qualquer dado real de membro ser inserido (ver seção 3 abaixo).

### Opção A — Supabase nativo (pago)

- No dashboard do projeto Supabase de produção: **Settings → Database → Backups**.
- Em planos pagos (Pro, US$25/mês), backups diários automáticos com 7 dias de retenção já vêm habilitados; Point-in-Time Recovery é um add-on separado.
- No plano gratuito, não há backup automático nem PITR — **confirme o plano contratado no dashboard antes de assumir que o backup automático está ativo**.

### Opção B — GitHub Actions gratuito (já configurado neste repositório)

`.github/workflows/supabase-backup.yml` roda `pg_dump` todo dia às 03:00 (horário de Brasília) e publica o dump como artifact do GitHub Actions (retenção de 30 dias), sem custo adicional. Para ativar:

1. No Supabase: **Settings → Database → Connection string**, formato **URI**, copiar a connection string completa (com a senha do banco).
2. No GitHub: **Settings → Secrets and variables → Actions → New repository secret**, nome `SUPABASE_DB_URL`, colar a connection string.
3. Disparar manualmente uma vez em **Actions → Backup do banco Supabase → Run workflow** para confirmar que funciona antes de depender do agendamento automático.
4. Para restaurar um backup: baixar o artifact `.dump` e rodar `pg_restore --clean --if-exists -d "<connection-string-do-destino>" arquivo.dump`.

Nenhuma das duas opções é mutuamente exclusiva — dá pra usar a B agora (grátis) e migrar pra A se/quando o plano pago for contratado.

- Ação: registrar aqui (ou em `docs/DECISIONS.md`) qual opção está ativa, e confirmar que o primeiro backup rodou com sucesso antes de considerar este item concluído.

---

## 2. Confirmar variáveis de ambiente na Netlify (produção)

Conferir que todas as variáveis abaixo (listadas em `.env.example`) estão configuradas no dashboard da Netlify do site de produção, com os valores do projeto Supabase de produção — **não os do ambiente local/homologação**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (nunca com prefixo `NEXT_PUBLIC_`; nunca exposta ao browser)
- `NEXT_PUBLIC_APP_URL` (URL pública real do site em produção)
- `NODE_ENV=production`
- `LEADER_SIGNUP_CODE` (código de convite do autocadastro de líder — trocar do valor usado em testes)
- Variáveis `WHATSAPP_*` — só necessárias se/quando o envio automático por WhatsApp for aprovado para uso (está fora do escopo atual, CLAUDE.md seção 11); enquanto isso, `WHATSAPP_PROVIDER=mock` é suficiente e não requer as demais.

Ação: confirmar cada variável na tela **Site settings → Environment variables** da Netlify antes do primeiro deploy de produção usado no piloto.

---

## 3. Aprovação explícita antes de qualquer dado real de membro

CLAUDE.md, seção 16, é explícito: **não usar dados reais de membros** até que todas as cinco condições abaixo estejam atendidas — citação literal:

> 1. Autenticação esteja funcionando
> 2. RLS esteja testada e validada
> 3. Perfis de acesso estejam validados
> 4. Ambiente de produção esteja separado do desenvolvimento
> 5. Backups estejam configurados

E, adicionalmente: **"O responsável pelo produto aprove explicitamente."**

Este é um gate de decisão humana — não uma tarefa de engenharia. O checklist abaixo é o que falta confirmar item a item antes de solicitar essa aprovação:

- [ ] (1) Autenticação — Supabase Auth em funcionamento no ambiente de produção (login, recuperação de senha, autocadastro de líder com aprovação).
- [ ] (2) RLS testada e validada — ver item 4 abaixo (DEC-035): as suítes existem mas ainda não rodaram de fato em nenhum ambiente.
- [ ] (3) Perfis de acesso validados — líder, coordenação e admin exercitados manualmente (ou via E2E rodado de verdade) contra o banco de produção/homologação semeado.
- [ ] (4) Ambiente de produção separado do desenvolvimento — confirmar que o projeto Supabase de produção é distinto do projeto usado em desenvolvimento/testes, com credenciais próprias.
- [ ] (5) Backups configurados — ver item 1 acima.
- [ ] Aprovação explícita e por escrito do responsável pelo produto, feita **depois** de (1)–(5) confirmados, não antes.

Até essa aprovação, o piloto continua rodando exclusivamente com os dados fictícios de `supabase/seed.sql`, como já ocorre.

---

## 4. Executar de fato as suítes de RLS e E2E antes do piloto

`docs/DECISIONS.md`, **DEC-035**, documenta que as suítes de teste de RLS (pgTAP, `supabase/tests/database/`) e E2E (Playwright, `tests/e2e/`) foram **escritas e revisadas por leitura**, mas não puderam ser executadas no sandbox de desenvolvimento usado até aqui (sem Docker disponível). Isso significa que a checagem "RLS testada e validada" do item 3.2 acima **não pode ser marcada como concluída só por essas suítes existirem** — elas precisam efetivamente rodar, com resultado verde, antes ou durante o piloto (não depois).

**`.github/workflows/tests.yml`** já automatiza isso — sobe um Postgres local via Docker (disponível nos runners do GitHub Actions), aplica migrations + seed, roda as 8 suítes pgTAP e os 10 cenários Playwright, tudo isolado do banco de produção. Para rodar:

1. No GitHub: **Actions → Testes (RLS + E2E) → Run workflow**.
2. Aguardar a execução (alguns minutos) e conferir se todos os steps ficaram verdes.
3. Se algo falhar, o relatório do Playwright fica disponível como artifact do run para investigação.
4. Nenhum secret adicional é necessário — o workflow usa apenas o Supabase local descartável, nunca o banco de produção.

Ação recomendada: disparar este workflow e confirmar resultado verde antes de considerar o item (2) da seção 3 abaixo como concluído. Alternativa (sem GitHub Actions): rodar `pnpm supabase:start && pnpm supabase:test` e `pnpm test:e2e` numa máquina com Docker Desktop instalado.

---

## Resumo de responsabilidade

| Item | Quem executa | Bloqueia dados reais? |
|---|---|---|
| 1. Backups no Supabase | Administrador da conta Supabase | Sim |
| 2. Variáveis de ambiente na Netlify | Quem tem acesso ao dashboard Netlify | Sim (app não funciona em produção sem isso) |
| 3. Aprovação explícita (CLAUDE.md §16) | Responsável pelo produto | Sim — é o gate final |
| 4. Rodar RLS/E2E de verdade | Disparar `.github/workflows/tests.yml` no GitHub Actions (sem Docker local necessário) | Sim (pré-requisito do item 3.2) |
