# CLAUDE.md — Pastoreio HUIOS

Este arquivo contém instruções permanentes para o desenvolvimento do sistema Pastoreio HUIOS.
Leia este arquivo integralmente antes de qualquer implementação.

---

## 1. Nome e Propósito

**Nome oficial:** Pastoreio HUIOS

**Propósito:** Ferramenta interna de apoio ao pastoreio, discipulado, integração, formação, serviço e desenvolvimento de liderança da rede HUIOS, pertencente à Igreja Emaús.

O sistema registra fatos operacionais e apoia decisões humanas e pastorais. Não avalia maturidade espiritual, santidade, comprometimento ou qualidade da fé.

---

## 2. Stack Oficial

- **Framework:** Next.js (App Router) + TypeScript estrito
- **UI:** React + Tailwind CSS + componentes acessíveis
- **Banco:** PostgreSQL via Supabase
- **Auth:** Supabase Auth
- **Segurança:** Row Level Security (RLS) obrigatória
- **Validação:** Zod (servidor e cliente)
- **Formulários:** React Hook Form (quando justificado)
- **Datas/Fuso:** date-fns + date-fns-tz
- **Testes unitários/integração:** Vitest
- **Testes E2E:** Playwright
- **Gerenciador de pacotes:** pnpm
- **Hospedagem:** Vercel (app) + Supabase (banco e auth)
- **Repositório:** GitHub

---

## 3. Comandos de Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Servidor de desenvolvimento
pnpm dev

# Build de produção
pnpm build

# Verificação de tipos
pnpm typecheck

# Lint
pnpm lint

# Formatação
pnpm format

# Testes unitários e de integração
pnpm test

# Testes com cobertura
pnpm test:coverage

# Testes E2E
pnpm test:e2e

# Supabase local — iniciar
pnpm supabase:start

# Supabase local — parar
pnpm supabase:stop

# Aplicar migrations
pnpm supabase:migrate

# Gerar tipos a partir do banco
pnpm supabase:types

# Seed de dados fictícios
pnpm supabase:seed

# Antes de qualquer commit: lint + typecheck + testes + build
pnpm check-all
```

---

## 4. Estrutura do Projeto

```
/
├── app/
│   ├── (auth)/               ← login, recuperação de senha
│   ├── (leader)/             ← rotas do líder do GR
│   ├── (coordination)/       ← rotas da coordenação HUIOS
│   ├── (admin)/              ← rotas administrativas
│   └── api/                  ← rotas de API server-side
├── components/
│   ├── ui/                   ← componentes base (acessíveis)
│   ├── attendance/
│   ├── pastoral-care/
│   ├── people/
│   ├── training/
│   └── service/
├── lib/
│   ├── auth/                 ← helpers de autenticação
│   ├── supabase/
│   │   ├── client.ts         ← cliente browser (anon key)
│   │   └── server.ts         ← cliente servidor (service_role NUNCA no browser)
│   ├── validations/          ← schemas Zod
│   ├── permissions/          ← verificações de autorização
│   ├── business-rules/
│   │   ├── absences.ts       ← motor de ausências (funções puras)
│   │   ├── visitors.ts       ← regras de visitantes
│   │   ├── eligibility.ts    ← aptidão para servir e liderar
│   │   └── indicators.ts     ← cálculo de indicadores
│   ├── attendance/
│   └── pastoral-care/
├── supabase/
│   ├── migrations/           ← migrations SQL versionadas
│   ├── seed.sql              ← APENAS dados fictícios
│   └── tests/                ← testes de RLS
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   └── *.md
├── CLAUDE.md
├── README.md
├── .env.example
└── package.json
```

---

## 5. Regras de Negócio Imutáveis

Estas regras não podem ser modificadas sem aprovação explícita do responsável pelo produto.

### 5.1 Ausências
- **2 ausências não justificadas consecutivas** → cria caso de pastoreio automaticamente
- **4 ausências não justificadas consecutivas** → escala o mesmo caso à coordenação (não cria duplicata)
- Ausência justificada **interrompe** a sequência
- Reunião cancelada é **ignorada** para fins de sequência
- Visitante **nunca** gera ausência
- Pessoa em afastamento temporário **nunca** acumula ausências
- Relatório não enviado **não altera** a sequência

### 5.2 Visitantes
- **3 visitas** (consecutivas ou não, na relação ativa) → sugestão de vinculação (nunca automático)
- Visitante não entra na chamada obrigatória nem no denominador de frequência
- A conversão para participante é atômica e preserva o histórico de visitas
- Encerramento de relação de visitante preserva histórico; pessoa pode retornar futuramente

### 5.3 Discipulado
- Uma pessoa só pode ter **1 discipulador ativo** por vez
- Substituição encerra o vínculo anterior (histórico preservado)
- Não registrar conteúdo de conversas, confissões ou aconselhamento

### 5.4 Formação e Serviço
- **Aptidão para servir:** Cultura Emaús concluído
- **Aptidão formativa para liderar:** Cultura Emaús + Makarios 1 + 2 + 3 concluídos
- Aptidão formativa ≠ nomeação pastoral (o sistema apenas verifica requisito objetivo)
- Novo vínculo de serviço ativo exige Cultura Emaús concluído
- Função de liderança exige todos os 4 programas concluídos
- Dados de formação são **declarativos** (líder pergunta à pessoa e registra)

### 5.5 Transferências
- Apenas a **coordenação** pode transferir pessoas entre GRs
- A transferência deve ser atômica, auditada e revisar o discipulador
- A sequência operacional de faltas começa no novo GR após a transferência

### 5.6 Reuniões
- Prazo para envio do relatório: **48 horas** após o horário previsto
- Fuso horário: **America/Sao_Paulo**
- Reunião cancelada não gera ausência, não exige chamada, não afeta pontualidade
- Relatório enviado fica **bloqueado** para edição normal; reabertura é exclusiva da coordenação e deve ser auditada

### 5.7 Casos de Pastoreio
- Um caso só pode ser resolvido quando houver ao menos **1 ação registrada**
- Presença posterior não resolve automaticamente um caso aberto
- Não criar casos duplicados para a mesma sequência de ausências

---

## 6. Regras de Segurança

- **NUNCA** expor `service_role` no cliente (browser)
- Usar variáveis de ambiente para todas as keys do Supabase
- Separar `lib/supabase/client.ts` (browser, anon key) de `lib/supabase/server.ts` (server, service_role)
- Todas as regras críticas devem estar no banco (RLS/constraints) ou no servidor — nunca apenas na UI
- Validação com Zod obrigatória no servidor para todas as entradas externas
- RLS habilitado em todas as tabelas; princípio: **negar por padrão**
- Criar testes de RLS para verificar que o isolamento funciona
- Não registrar dados sensíveis em logs de aplicação
- Não confiar apenas em esconder botões na interface para controle de acesso

---

## 7. Regras de Acesso

### Líder do GR
- Acessa apenas dados do **próprio GR**
- Não pode visualizar pessoas de outros GRs, mesmo por manipulação de URL ou API direta
- Não pode transferir pessoas, criar/excluir GRs, alterar usuários ou papéis

### Coordenação HUIOS
- Acessa todos os GRs da rede HUIOS
- Pode transferir pessoas, revisar casos escalados, reabrir relatórios com justificativa
- Não tem acesso a outras redes

### Administrador
- Acesso administrativo global à instalação
- Gerencia usuários, redes, GRs, catálogos, logs de auditoria

---

## 8. Convenções de Código

- TypeScript com `strict: true`; evitar `any`
- Funções de regra de negócio **puras** quando possível (sem efeitos colaterais)
- Nomes descritivos em português técnico (ou inglês para código interno)
- Componentes pequenos; separar UI, acesso a dados e regras de negócio
- Sem SQL espalhado aleatoriamente — centralizar em `lib/`
- Sem duplicação de regras de elegibilidade
- Sem lógica crítica apenas no cliente
- Server Components por padrão; Client Components apenas quando necessário (interatividade, hooks de estado)
- Sem comentários explicativos do que o código faz — nomes descritivos substituem
- Comentários apenas para invariantes não óbvias ou workarounds específicos

---

## 9. Política de Testes

**Obrigatório antes de declarar qualquer fase concluída:**
- Sem erros de TypeScript (`pnpm typecheck`)
- Sem erros de lint (`pnpm lint`)
- Build funcionando (`pnpm build`)
- Testes unitários passando
- Testes de RLS passando para as funcionalidades da fase

**Módulos com testes unitários obrigatórios:**
- `lib/business-rules/absences.ts` — 12 cenários descritos em docs/TESTING.md
- `lib/business-rules/visitors.ts` — 10 cenários
- `lib/business-rules/eligibility.ts` — 7 cenários
- Permissões — 8 cenários de RLS
- Fluxos E2E críticos — 10 cenários com Playwright

**Cobertura mínima para lógica de negócio:** 80%

---

## 10. Política de Documentação

- Manter `docs/` atualizado ao final de cada fase
- Atualizar `docs/DECISIONS.md` quando decisões técnicas importantes forem tomadas
- Atualizar `docs/ROADMAP.md` ao concluir cada fase
- Não criar documentação para código óbvio — código bem nomeado é suficiente
- Migrations SQL devem ter nome descritivo: `YYYYMMDDHHMMSS_descricao.sql`

---

## 11. O Que Está Fora do Escopo

**Não implementar sem aprovação explícita:**
- WhatsApp automático
- Aplicativo nativo (iOS/Android)
- Controle de cultos ou eventos HUIOS
- Gestão financeira
- Envio de mensagens em massa
- Prontuário pastoral ou armazenamento de aconselhamento
- Upload obrigatório de certificados
- Integração com secretaria, Escola Makarios ou outros sistemas da igreja
- Agenda de discipulado ou conteúdo de cursos
- Geolocalização ou reconhecimento facial
- Ranking de GRs ou gamificação
- Pontuação espiritual ou IA para avaliar pessoas
- Múltiplas igrejas (SaaS multi-tenant)
- Funcionamento offline completo
- Redux, microserviços, GraphQL, Prisma, filas complexas, Kubernetes

---

## 12. Proibição Absoluta: Inventar Regras Pastorais

**NUNCA inventar regras pastorais não descritas no documento mestre.**

O sistema registra fatos operacionais. Qualquer dúvida sobre comportamento pastoral deve ser levada ao responsável pelo produto antes da implementação.

Exemplos do que NÃO fazer:
- Criar campo "nível espiritual" ou similar
- Sugerir "promoção" de pessoas
- Implementar ranking ou pontuação de participação
- Inferir comprometimento a partir da frequência
- Usar linguagem como "líder aprovado", "pronto para liderar", "deve ser promovido"

Usar sempre: **"Atende aos requisitos formativos cadastrados para liderança."**

---

## 13. Obrigação de Qualidade

**Antes de qualquer commit em fase concluída, executar:**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Não declarar uma funcionalidade concluída quando:
- Houver erros de TypeScript
- O build falhar
- Testes relevantes estiverem falhando
- Políticas de acesso não tiverem sido testadas
- Existirem fluxos principais sem tratamento de erro

---

## 14. Fuso Horário

**America/Sao_Paulo** em todas as operações de data e hora.

- Prazo do relatório: 48h após horário previsto da reunião (no fuso correto)
- Exibição de datas: `dd/mm/aaaa`
- Exibição de horários: formato 24 horas
- Timestamps no banco: `timestamptz`

---

## 15. Idioma da Interface

Toda a interface em **português do Brasil**.

Código interno (variáveis, funções, tabelas) pode usar inglês técnico.

---

## 16. Proibição de Dados Reais

**NÃO usar dados reais de membros até que:**
1. Autenticação esteja funcionando
2. RLS esteja testada e validada
3. Perfis de acesso estejam validados
4. Ambiente de produção esteja separado do desenvolvimento
5. Backups estejam configurados
6. O responsável pelo produto aprove explicitamente

**Durante o desenvolvimento:** usar exclusivamente dados fictícios do `supabase/seed.sql`.

---

## Contato e Aprovação

Qualquer modificação nas regras de negócio imutáveis (seção 5) exige aprovação explícita do responsável pelo produto antes da implementação.
