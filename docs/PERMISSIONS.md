# Permissões e Acesso — Pastoreio HUIOS

## Princípio

> Negar por padrão. Liberar apenas o necessário.

RLS (Row Level Security) habilitado em todas as tabelas do Supabase.

As regras de acesso devem estar implementadas no banco (RLS/constraints) e no servidor — nunca apenas na UI.

---

## Perfis

| Papel | Código | Escopo |
|-------|--------|--------|
| Líder do GR | `leader` | Próprio GR |
| Coordenação HUIOS | `coordinator` | Rede HUIOS inteira |
| Administrador | `admin` | Instalação completa |

---

## Líder do GR

### Pode

- Visualizar o próprio GR
- Visualizar pessoas com relação ativa no próprio GR (visitantes e participantes)
- Cadastrar visitantes no próprio GR
- Registrar reuniões do próprio GR
- Preencher chamada das reuniões do próprio GR
- Registrar ausências justificadas
- Revisar e enviar o relatório da reunião
- Visualizar casos de pastoreio do próprio GR
- Registrar ações de pastoreio nos casos do próprio GR
- Definir o discipulador responsável por pessoas do próprio GR
- Atualizar informações declarativas de Cultura Emaús das pessoas do próprio GR
- Atualizar informações declarativas da Escola Makarios das pessoas do próprio GR
- Visualizar e atualizar áreas de serviço (respeitando regras de elegibilidade)
- Visualizar histórico das pessoas do próprio GR
- Visualizar indicadores do próprio GR

### Não pode

- Visualizar pessoas de outros GRs
- Consultar dados de outros GRs por manipulação de URL ou chamada direta à API
- Transferir pessoas entre GRs
- Criar, editar ou excluir GRs
- Alterar usuários ou papéis de acesso
- Visualizar logs administrativos globais
- Alterar configurações gerais
- Editar catálogos globais (áreas de serviço, programas)
- Visualizar dados de outras redes
- Apagar históricos

---

## Coordenação HUIOS

### Pode (além das permissões do líder, no escopo da rede)

- Visualizar todos os GRs da rede HUIOS
- Visualizar todos os participantes e visitantes da rede HUIOS
- Visualizar relatórios atrasados de qualquer GR
- Visualizar e acompanhar casos sinalizados ou encaminhados
- Transferir pessoas entre GRs
- Revisar o discipulador no momento da transferência
- Gerenciar GRs (criar, editar, ativar/desativar)
- Gerenciar líderes vinculados aos GRs
- Visualizar indicadores gerais da rede
- Visualizar histórico de alterações importantes
- Reabrir um relatório quando houver justificativa operacional
- Encerrar ou corrigir vínculos de GR

### Não pode (sem perfil de administrador)

- Gerenciar usuários globalmente
- Configurar novas redes
- Visualizar logs de auditoria completos (apenas eventos da rede)
- Executar procedimentos de manutenção técnica

---

## Administrador

### Pode

- Tudo da coordenação, mais:
- Gerenciar usuários (criar, editar, ativar, desativar)
- Configurar redes
- Configurar GRs em qualquer rede
- Configurar catálogos globais (áreas de serviço, programas formativos)
- Visualizar logs de auditoria completos
- Corrigir dados administrativos
- Administrar configurações técnicas
- Executar procedimentos de manutenção

---

## Políticas de RLS por Tabela

### networks
- Leitura: autenticado
- Escrita: admin

### profiles
- Leitura própria: autenticado (próprio perfil)
- Leitura geral: coordinator, admin
- Escrita: admin

### groups
- Leitura: leader (próprio GR), coordinator (rede), admin (todos)
- Escrita: coordinator (rede), admin

### people
- Leitura: leader (pessoas do próprio GR), coordinator (rede), admin (todos)
- Escrita: leader (visitantes no próprio GR), coordinator (rede), admin

### group_relationships
- Leitura: leader (próprio GR), coordinator (rede), admin
- Escrita: coordinator (transferências), admin
- Inserção de visitante: leader (próprio GR)

### meetings
- Leitura: leader (próprio GR), coordinator (rede), admin
- Criação/edição: leader (próprio GR, enquanto pendente), coordinator, admin
- Reabertura: coordinator, admin

### attendance_records
- Leitura: leader (próprio GR), coordinator (rede), admin
- Escrita: leader (próprio GR, reunião aberta), coordinator, admin

### discipleship_assignments
- Leitura: leader (pessoas do próprio GR), coordinator (rede), admin
- Escrita: leader (pessoas do próprio GR), coordinator (rede), admin

### pastoral_cases
- Leitura: leader (próprio GR), coordinator (rede), admin
- Escrita: leader (próprio GR), coordinator (rede), admin

### pastoral_actions
- Leitura: leader (próprio GR), coordinator (rede), admin
- Escrita: leader (próprio GR), coordinator (rede), admin

### temporary_absences
- Leitura: leader (próprio GR), coordinator (rede), admin
- Escrita: leader (próprio GR), coordinator (rede), admin

### training_records
- Leitura: leader (pessoas do próprio GR), coordinator (rede), admin
- Escrita: leader (pessoas do próprio GR), coordinator (rede), admin

### ministry_areas
- Leitura: autenticado
- Escrita: coordinator, admin

### service_assignments
- Leitura: leader (pessoas do próprio GR), coordinator (rede), admin
- Escrita: leader (pessoas do próprio GR, com verificação de elegibilidade), coordinator, admin

### group_transfers
- Leitura: coordinator (rede), admin
- Escrita: coordinator (rede), admin

### notifications
- Leitura: próprio usuário
- Escrita: sistema (server-side)

### audit_logs
- Leitura: coordinator (rede, filtrado), admin (todos)
- Escrita: sistema (server-side apenas)

---

## Verificação Técnica de Segurança

1. `service_role` **nunca** exposto no cliente (browser)
2. Variáveis de ambiente para todas as keys do Supabase
3. Clientes separados: `lib/supabase/client.ts` (browser, anon key) e `lib/supabase/server.ts` (server, service_role)
4. Validação Zod obrigatória no servidor para todas entradas externas
5. Testes de RLS devem cobrir os cenários de isolamento entre GRs
6. Manipulação direta de endpoint ou de ID não deve contornar RLS
