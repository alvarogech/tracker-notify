# Política de Testes — Pastoreio HUIOS

## Stack

- **Unitários e integração:** Vitest
- **E2E:** Playwright (Chromium)
- **RLS:** Testes SQL diretos no Supabase local

## Princípio

Nenhuma fase é considerada concluída sem testes passando. Ver `CLAUDE.md` seção 9 e 13.

---

## Módulos com Testes Obrigatórios

### 1. Motor de Ausências (`lib/business-rules/absences.ts`)

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 1 | Duas ausências consecutivas | Cria caso |
| 2 | Uma ausência | Não cria caso |
| 3 | Ausência → presença → ausência | Não cria caso (sequência interrompida) |
| 4 | Ausência → justificada → ausência | Não cria caso (justificada interrompe) |
| 5 | Reunião cancelada entre ausências | Ignorada, sequência continua |
| 6 | Visitante ausente | Não gera ausência (visitante não tem chamada obrigatória) |
| 7 | Pessoa em afastamento | Não gera ausência |
| 8 | Relatório não enviado | Não altera sequência |
| 9 | Quatro ausências consecutivas | Escalona o mesmo caso (não cria duplicata) |
| 10 | Mesmo gatilho duas vezes | Não cria caso duplicado (idempotência) |
| 11 | Presença após caso aberto | Sistema sugere resolução, mas não resolve automaticamente |
| 12 | Transferência: ausências anteriores | Preservadas no histórico; nova sequência começa após transferência |

### 2. Visitantes (`lib/business-rules/visitors.ts`)

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 1 | Primeira visita | Cria presença de visitante |
| 2 | Visitante na chamada | Não aparece como obrigatório |
| 3 | Visitante no denominador | Não entra no cálculo de frequência |
| 4 | Três visitas | Gera sugestão de vinculação |
| 5 | Duas visitas | Não gera sugestão |
| 6 | Confirmação de vinculação | Exige confirmação explícita do líder |
| 7 | Conversão | Preserva histórico de visitas |
| 8 | Conversão | Cria vínculo regular ativo |
| 9 | Visitante encerrado | Pode retornar futuramente como novo visitante |
| 10 | Cadastro com telefone duplicado | Sugere cadastro existente antes de criar novo |

### 3. Elegibilidade (`lib/business-rules/eligibility.ts`)

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 1 | Cultura concluído | Apto para servir |
| 2 | Cultura cursando | Não apto para servir |
| 3 | Cultura desconhecido | Informação insuficiente |
| 4 | Makarios 1+2+3 concluídos, Cultura não | Não apto para liderar |
| 5 | Cultura + Makarios 1+2+3 | Apto formativamente para liderar |
| 6 | Cultura + dois Makarios | Não apto para liderar |
| 7 | Dado declarativo | Resultado baseado no status informado, sem validação externa |

### 4. Discipulado

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 1 | Criar segundo discipulador ativo | Deve falhar ou encerrar o anterior |
| 2 | Substituir discipulador | Encerra vínculo anterior, cria novo, histórico preservado |
| 3 | Histórico após encerramento | Registro anterior permanece acessível |
| 4 | Líder altera discipulador de outro GR | Deve ser bloqueado |
| 5 | Coordenação altera qualquer vínculo da rede | Permitido |

### 5. Serviço

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 1 | Múltiplas áreas | Uma pessoa pode ter vínculos ativos em várias áreas |
| 2 | Ativar serviço sem Cultura | Bloqueado |
| 3 | Pausar serviço | Preserva histórico, muda status |
| 4 | Função de liderança sem Makarios completo | Bloqueado |
| 5 | Encerrar vínculo | Vínculos anteriores preservados |
| 6 | Área desativada | Não aparece para novos vínculos |

---

## Testes de RLS

Verificar que o isolamento técnico funciona independentemente de manipulação:

| # | Cenário | Resultado esperado |
|---|---------|-------------------|
| 1 | Líder A tenta ler GR B | Sem resultados (RLS bloqueia) |
| 2 | Líder A tenta ler pessoas exclusivas do GR B | Sem resultados |
| 3 | Líder tenta transferir pessoa | Operação negada |
| 4 | Coordenação lê todos os GRs da HUIOS | Retorna todos |
| 5 | Admin acessa configurações | Permitido |
| 6 | Usuário inativo tenta acessar | Negado (verificar via trigger ou middleware) |
| 7 | Chamada direta ao endpoint com ID adulterado | RLS bloqueia acesso ao registro |
| 8 | Manipulação de ID para outro GR | RLS bloqueia |

---

## Testes E2E — Fluxos Críticos (Playwright)

| # | Fluxo |
|---|-------|
| 1 | Líder entra pelo login, registra reunião completa e envia |
| 2 | Líder adiciona visitante com telefone existente (deduplicação) |
| 3 | Terceira visita de um visitante gera sugestão de vinculação |
| 4 | Duas ausências consecutivas geram caso de pastoreio |
| 5 | Líder registra ação e resolve o caso manualmente |
| 6 | Quatro ausências: caso aparece para coordenação como escalado |
| 7 | Líder define discipulador para uma pessoa |
| 8 | Líder atualiza Cultura Emaús e os três volumes da Makarios |
| 9 | Líder adiciona área de serviço elegível (Cultura concluído) |
| 10 | Coordenação transfere pessoa e revisa discipulador |

---

## Executar Testes

```bash
# Unitários e integração
pnpm test

# Com cobertura
pnpm test:coverage

# E2E (requer app rodando e Supabase local)
pnpm test:e2e

# Apenas RLS
pnpm supabase:test
```

---

## Cobertura Mínima

- Lógica de negócio (`lib/business-rules/`): **80%**
- Políticas de acesso (RLS): **100% dos cenários listados**
- E2E fluxos críticos: **100% dos fluxos listados**
