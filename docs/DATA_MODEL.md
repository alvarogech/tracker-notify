# Modelo de Dados — Pastoreio HUIOS

Banco: PostgreSQL via Supabase.
Chaves primárias: UUID.
Timestamps: `timestamptz`.
Soft delete ou desativação onde a exclusão destruiria histórico.

---

## networks

Redes da igreja (MVP: apenas HUIOS/Igreja Emaús).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| name | text | Nome da rede |
| church_name | text | Nome da igreja |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Seed: `{ name: 'HUIOS', church_name: 'Igreja Emaús' }`

---

## profiles

Usuários autenticados (espelha Supabase Auth).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK, FK → auth.users |
| full_name | text | |
| email | text | |
| role | text | `leader` \| `coordinator` \| `admin` |
| person_id | uuid | FK → people (opcional) |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## groups

GRs (Grupos de Relacionamento).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| network_id | uuid | FK → networks |
| name | text | |
| leader_user_id | uuid | FK → profiles |
| day_of_week | int | 0=domingo ... 6=sábado |
| start_time | time | Horário habitual |
| location_name | text | |
| capacity | int | Opcional |
| status | text | `active` \| `inactive` |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## people

Pessoas cadastradas (visitantes e participantes).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| full_name | text | |
| preferred_name | text | Opcional |
| phone | text | Opcional, para deduplicação |
| birth_date | date | Opcional |
| lifecycle_status | text | `visitor` \| `active` \| `attention` \| `temporarily_away` \| `inactive` |
| created_by | uuid | FK → profiles |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| archived_at | timestamptz | Opcional (soft delete) |

Não armazenar `current_group_id` diretamente — obter da `group_relationships`.

---

## group_relationships

Vínculo da pessoa com um GR (visitante ou participante).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| person_id | uuid | FK → people |
| group_id | uuid | FK → groups |
| relationship_type | text | `visitor` \| `participant` |
| status | text | `active` \| `closed` |
| started_at | timestamptz | |
| ended_at | timestamptz | Opcional |
| end_reason | text | Opcional |
| converted_from_relationship_id | uuid | FK → group_relationships (opcional) |
| created_by | uuid | FK → profiles |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Constraint:** uma pessoa só pode ter uma relação ativa principal dentro da rede por vez.

---

## meetings

Reuniões dos GRs.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| group_id | uuid | FK → groups |
| scheduled_at | timestamptz | Data/hora prevista |
| status | text | `scheduled` \| `realized` \| `cancelled` |
| report_status | text | `pending` \| `submitted_on_time` \| `submitted_late` \| `reopened` |
| due_at | timestamptz | Prazo de 48h no fuso America/Sao_Paulo |
| submitted_at | timestamptz | Opcional |
| submitted_by | uuid | FK → profiles (opcional) |
| reopened_at | timestamptz | Opcional |
| reopened_by | uuid | FK → profiles (opcional) |
| reopen_reason | text | Opcional |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## attendance_records

Registros de presença por reunião.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| meeting_id | uuid | FK → meetings |
| person_id | uuid | FK → people |
| relationship_id | uuid | FK → group_relationships |
| attendance_status | text | `present` \| `absent` \| `justified` |
| is_visitor_record | boolean | True para visitantes |
| marked_by | uuid | FK → profiles |
| marked_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Constraints:**
- Um registro por pessoa por reunião
- Visitantes: apenas status `present`
- Ausência exige vínculo de participante ativo na data

---

## discipleship_assignments

Vínculos de discipulado.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| disciple_person_id | uuid | FK → people |
| discipler_person_id | uuid | FK → people |
| status | text | `active` \| `ended` |
| started_at | timestamptz | |
| ended_at | timestamptz | Opcional |
| end_reason | text | Opcional |
| created_by | uuid | FK → profiles |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Constraint:** apenas um vínculo ativo por pessoa discipulada.

---

## pastoral_cases

Casos de pastoreio.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| person_id | uuid | FK → people |
| group_id | uuid | FK → groups |
| trigger_type | text | `two_consecutive_absences` \| `manual` \| `visitor_followup` \| `other` |
| source_meeting_id | uuid | FK → meetings (opcional) |
| status | text | `pending` \| `in_progress` \| `resolved` \| `escalated_to_coordination` |
| responsible_person_id | uuid | FK → people (opcional) |
| responsible_user_id | uuid | FK → profiles (opcional) |
| opened_at | timestamptz | |
| escalated_at | timestamptz | Opcional |
| resolved_at | timestamptz | Opcional |
| resolution_outcome | text | Opcional |
| created_by | uuid | FK → profiles |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Resultados possíveis (`resolution_outcome`):**
- `intends_to_return`
- `absence_clarified`
- `temporary_absence`
- `no_contact_possible`
- `does_not_intend_to_continue`
- `returned_to_group`
- `escalated_to_coordination`
- `other_objective_result`

---

## pastoral_actions

Ações dentro de um caso de pastoreio.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| case_id | uuid | FK → pastoral_cases |
| person_id | uuid | FK → people |
| action_type | text | `message` \| `phone_call` \| `in_person_meeting` \| `conversation_in_other_context` |
| action_date | date | |
| responsible_person_id | uuid | FK → people (opcional) |
| responsible_user_id | uuid | FK → profiles (opcional) |
| short_note | text | Opcional, máx 300 chars |
| created_by | uuid | FK → profiles |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## temporary_absences

Afastamentos temporários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| person_id | uuid | FK → people |
| group_id | uuid | FK → groups |
| started_at | date | |
| expected_return_at | date | Opcional |
| reason_category | text | `travel` \| `work` \| `studies` \| `routine_change` \| `pastoral_decision` \| `other` |
| status | text | `active` \| `completed` \| `cancelled` |
| created_by | uuid | FK → profiles |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## training_programs

Catálogo de programas formativos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| code | text | Único: `CULTURA_EMAUS`, `MAKARIOS_1`, `MAKARIOS_2`, `MAKARIOS_3` |
| name | text | Nome exibido |
| program_type | text | `cultura` \| `makarios` |
| sequence_order | int | Ordem de exibição |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## training_records

Registros declarativos de formação por pessoa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| person_id | uuid | FK → people |
| training_program_id | uuid | FK → training_programs |
| status | text | Ver abaixo |
| declared_completion_date | date | Opcional |
| declared_at | timestamptz | |
| recorded_by | uuid | FK → profiles |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Status para Cultura Emaús: `unknown` \| `not_started` \| `in_progress` \| `completed`

Status para Makarios: `unknown` \| `not_started` \| `in_progress` \| `approved_completed`

**Constraint:** um registro por pessoa por programa (atualizar em vez de criar novo).

---

## ministry_areas

Catálogo de áreas de serviço.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| name | text | |
| description | text | Opcional |
| sort_order | int | |
| is_active | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Seed inicial: Áreas Executivas, Mídia, Louvor, Ekballo, Sobrenatural, Velos, Éleos, Libras.

---

## service_assignments

Vínculos de serviço em áreas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| person_id | uuid | FK → people |
| ministry_area_id | uuid | FK → ministry_areas |
| function_name | text | Opcional |
| status | text | `active` \| `paused` \| `ended` |
| is_leadership_role | boolean | |
| started_at | date | |
| ended_at | date | Opcional |
| created_by | uuid | FK → profiles |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## group_transfers

Histórico de transferências entre GRs.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| person_id | uuid | FK → people |
| from_group_id | uuid | FK → groups |
| to_group_id | uuid | FK → groups |
| effective_at | date | |
| discipler_decision | text | `keep` \| `end` \| `new_discipler` \| `decide_later` |
| previous_discipler_id | uuid | FK → people (opcional) |
| new_discipler_id | uuid | FK → people (opcional) |
| transferred_by | uuid | FK → profiles |
| created_at | timestamptz | |

---

## notifications

Notificações internas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK → profiles |
| type | text | Tipo da notificação |
| title | text | |
| message | text | |
| related_entity_type | text | Opcional |
| related_entity_id | uuid | Opcional |
| scheduled_at | timestamptz | Opcional |
| sent_at | timestamptz | Opcional |
| read_at | timestamptz | Opcional |
| created_at | timestamptz | |

Tipos: `report_pending`, `report_late`, `case_created`, `case_escalated`, `visitor_three_visits`, `absence_review`, `no_discipler`, `training_service_inconsistency`

---

## audit_logs

Log de auditoria para operações críticas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK → profiles |
| action | text | Ex: `transfer`, `reopen_report`, `change_role` |
| entity_type | text | Nome da tabela |
| entity_id | uuid | ID do registro |
| old_values | jsonb | Valores anteriores |
| new_values | jsonb | Novos valores |
| metadata | jsonb | Dados adicionais de contexto |
| created_at | timestamptz | |

Eventos obrigatoriamente auditados: transferência, reabertura de reunião, alteração de papel, alteração de vínculo de discipulado, alteração de formação, alteração de serviço, resolução de caso, desativação de pessoa, mudanças administrativas.
