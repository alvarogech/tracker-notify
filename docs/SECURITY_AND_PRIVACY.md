# Segurança e Privacidade — Pastoreio HUIOS

## Contexto

O sistema armazena informações relacionadas à participação em uma organização religiosa. Os dados devem ser tratados com cuidado elevado, mesmo quando aparentemente triviais.

---

## Princípios de Privacidade

1. **Coletar apenas o necessário** — sem campos por precaução ou "pode ser útil depois"
2. **Limitar acesso por função** — RLS garante isolamento técnico
3. **Evitar campos livres extensos** — campos de texto aberto ampliam o risco de armazenamento inadequado
4. **Não registrar confissões**
5. **Não registrar conteúdo de aconselhamento**
6. **Não registrar diagnósticos médicos ou de saúde**
7. **Não registrar conflitos familiares detalhados**
8. **Não registrar opiniões políticas**
9. **Não registrar informações sem finalidade operacional**
10. **Auditar alterações importantes**

---

## Dados Que NÃO Devem Ser Armazenados

| Categoria | Exemplos |
|-----------|----------|
| Saúde | diagnósticos, condições médicas, histórico hospitalar |
| Espiritual subjetivo | avaliação de maturidade, fé, comprometimento |
| Confissão | conteúdo de confissões ou arrependimentos |
| Aconselhamento | detalhes de conversas pastorais, orientações recebidas |
| Família | conflitos, situações íntimas de terceiros |
| Político | posicionamentos, afiliações |
| Financeiro | situação econômica, dívidas, doações |

---

## Notas de Ações de Pastoreio

- Limite de **300 caracteres**
- Objetivo e breve
- O sistema exibe orientação próxima ao campo:

> "Registre apenas uma informação breve e objetiva. Não inclua confissões, detalhes íntimos ou conteúdo de aconselhamento."

---

## Exclusão e Desativação

**Não permitir exclusão física casual** de pessoas ou históricos.

Preferir:
- Desativação de pessoa (`archived_at`)
- Encerramento de vínculo (`ended_at`)
- Arquivamento com preservação de histórico
- Anonimização futura quando formalmente definida e aprovada

---

## Segurança Técnica

### Autenticação e Acesso

- `service_role` **nunca** exposto no cliente (browser)
- Variáveis de ambiente em `.env.local` (nunca commitado)
- `.env.example` sem valores reais
- Clientes separados de Supabase: browser (anon key) e servidor (service_role)
- Todas as regras críticas implementadas no banco (RLS) e no servidor
- Não confiar apenas em esconder botões na interface

### Validação

- Validação com Zod no servidor para todas as entradas externas
- Validação no cliente apenas para usabilidade (não como segurança)
- Nunca confiar em dados do cliente sem revalidar no servidor

### Row Level Security

- RLS habilitado em todas as tabelas
- Princípio: **negar por padrão**
- Testes automatizados de RLS obrigatórios

### Logs e Observabilidade

- Logs técnicos sem dados sensíveis
- Não registrar conteúdo de campos sensíveis (notas, confissões)
- Auditoria no banco para operações críticas (`audit_logs`)
- Sem ferramentas externas de analytics comportamental sem aprovação

### Dependências

- Manter dependências atualizadas
- Verificar vulnerabilidades conhecidas antes de releases

---

## Dados Reais: Quando Podem Ser Usados

**NÃO usar dados reais de membros até que:**

1. Autenticação funcional e testada
2. RLS implementada e testada por cenários
3. Perfis de acesso validados (testes de isolamento)
4. Ambiente de produção separado do ambiente de desenvolvimento
5. Backups configurados no Supabase
6. Responsável pelo produto aprove explicitamente

**Durante o desenvolvimento:** usar exclusivamente os dados fictícios do `supabase/seed.sql`.

---

## Transferência de Dados

- Os dados ficam no banco Supabase do projeto (PostgreSQL gerenciado)
- Não há integração com sistemas externos no MVP
- Não implementar WhatsApp, SMS ou e-mail com dados de pessoas sem aprovação
