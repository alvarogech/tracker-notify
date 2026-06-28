# Pastoreio HUIOS

Ferramenta interna de apoio ao pastoreio, discipulado, integração, formação, serviço e desenvolvimento de liderança da rede HUIOS — Igreja Emaús.

## O que é

O Pastoreio HUIOS registra fatos operacionais para apoiar decisões humanas e pastorais:

- Frequência nos GRs (Grupos de Relacionamento)
- Acompanhamento de visitantes e conversão para participantes
- Casos de pastoreio gerados por ausências consecutivas
- Discipulado responsável por cada pessoa
- Formação: Cultura Emaús e Escola Makarios (volumes 1, 2 e 3)
- Áreas de serviço com verificação de requisitos formativos
- Transferências entre GRs com preservação de histórico

## Stack

- **Next.js** (App Router) + **TypeScript** estrito
- **Tailwind CSS** + componentes acessíveis
- **Supabase** (PostgreSQL + Auth + RLS)
- **pnpm**

## Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Iniciar Supabase local
pnpm supabase:start

# Servidor de desenvolvimento
pnpm dev

# Verificar qualidade (lint + typecheck + testes + build)
pnpm check-all
```

Veja `CLAUDE.md` para instruções completas de desenvolvimento.

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| `CLAUDE.md` | Instruções permanentes para desenvolvimento |
| `docs/PRODUCT_VISION.md` | Visão e propósito do sistema |
| `docs/FUNCTIONAL_REQUIREMENTS.md` | Requisitos funcionais completos |
| `docs/BUSINESS_RULES.md` | Regras de negócio imutáveis |
| `docs/DATA_MODEL.md` | Modelo de dados e tabelas |
| `docs/PERMISSIONS.md` | Políticas de acesso e RLS |
| `docs/SECURITY_AND_PRIVACY.md` | Segurança e proteção de dados |
| `docs/USER_FLOWS.md` | Fluxos principais de usuário |
| `docs/TESTING.md` | Política e cenários de teste |
| `docs/ROADMAP.md` | Fases de construção e status |
| `docs/DECISIONS.md` | Decisões técnicas tomadas e pendentes |

## Fases

Ver `docs/ROADMAP.md` para o status de cada fase.

**Fase atual:** Fase 0 — Fundação e Documentação

## Importante

- Interface em português do Brasil
- Fuso horário: `America/Sao_Paulo`
- Mobile-first (320px+)
- Não usar dados reais até aprovação explícita do responsável pelo produto
- Regras de negócio imutáveis: ver `CLAUDE.md` seção 5

---

Pertence à Igreja Emaús. Uso interno.
