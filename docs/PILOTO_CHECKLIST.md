# Checklist Operacional — Piloto do Pastoreio HUIOS

Este checklist cobre os itens da Fase 10 (`docs/ROADMAP.md`) que **não são código** — decisões e configurações que só o responsável pelo produto (ou quem administra a conta Supabase/Netlify) pode executar. Nenhum destes itens pode ser resolvido por uma alteração no repositório.

---

## 1. Configurar backups automáticos no Supabase

O ambiente de produção do piloto precisa de backups configurados antes de qualquer dado real de membro ser inserido (ver seção 3 abaixo).

- No dashboard do projeto Supabase de produção: **Settings → Database → Backups**.
- Em planos pagos do Supabase, backups diários automáticos (e, dependendo do plano, Point-in-Time Recovery) já vêm habilitados ou podem ser habilitados nessa tela.
- No plano gratuito, a retenção e a recuperação pontual (PITR) são limitadas ou indisponíveis — **confirme o plano contratado no dashboard antes de assumir que o backup automático está ativo**; não presuma, verifique diretamente na tela de Backups do projeto usado em produção.
- Ação: registrar aqui (ou em `docs/DECISIONS.md`) qual plano está em uso e qual é a política de retenção confirmada na tela do Supabase, para que a equipe saiba com que frequência e por quanto tempo os dados podem ser restaurados.

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

`docs/DECISIONS.md`, **DEC-035**, documenta que as suítes de teste de RLS (pgTAP, `supabase/tests/database/`) e E2E (Playwright, `tests/e2e/`) foram **escritas e revisadas por leitura**, mas **nunca executadas de fato** em nenhum ambiente — o sandbox de desenvolvimento usado até aqui não tem Docker disponível, o que impede subir um Postgres local para rodar `supabase test db` e servir o app para o Playwright.

Isso significa que a checagem "RLS testada e validada" do item 3.2 acima **não pode ser marcada como concluída só por essas suítes existirem** — elas precisam efetivamente rodar, com resultado verde, antes ou durante o piloto (não depois). Os passos, já descritos na DEC-035, são:

1. `pnpm supabase:start` (requer Docker Desktop local ou um runner de CI com Docker habilitado).
2. `pnpm supabase:test` — roda os 4 arquivos pgTAP via `pg_prove`.
3. `pnpm dev` (ou o `webServer` do `playwright.config.ts`) apontando para esse banco local semeado, seguido de `pnpm test:e2e`.
4. Para o cenário de conta pendente de aprovação em `auth.spec.ts`, definir `LEADER_SIGNUP_CODE` no ambiente de teste.

Ação recomendada: rodar isso em uma máquina com Docker disponível (local do desenvolvedor) ou configurar um pipeline de CI (GitHub Actions, por exemplo) que tenha Docker habilitado, antes de considerar o piloto com dados fictícios como validado o suficiente para avançar para dados reais.

---

## Resumo de responsabilidade

| Item | Quem executa | Bloqueia dados reais? |
|---|---|---|
| 1. Backups no Supabase | Administrador da conta Supabase | Sim |
| 2. Variáveis de ambiente na Netlify | Quem tem acesso ao dashboard Netlify | Sim (app não funciona em produção sem isso) |
| 3. Aprovação explícita (CLAUDE.md §16) | Responsável pelo produto | Sim — é o gate final |
| 4. Rodar RLS/E2E de verdade | Desenvolvedor com acesso a Docker/CI | Sim (pré-requisito do item 3.2) |
