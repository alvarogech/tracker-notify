# Integração WhatsApp — Pastoreio HUIOS

## Objetivo

Enviar um lembrete automático ao líder do GR via WhatsApp caso o relatório da reunião não tenha sido enviado **1 hora após o horário de término** da reunião.

A mensagem inclui um link direto para o formulário de relatório.

---

## Regras do Lembrete

- **Quando disparar:** 1 hora após `scheduled_end_at` da reunião
- **Condição:** relatório ainda não enviado (`report_submitted_at IS NULL`)
- **Destinatário:** líder do GR que registrou a reunião
- **Canal:** WhatsApp (número cadastrado em `profiles.whatsapp_phone`)
- **Consentimento obrigatório:** `profiles.whatsapp_notifications_enabled = true` (padrão: `false`)
- **Idempotência:** apenas 1 notificação por `(meeting_id, user_id, notification_type, channel)`
- **Reunião cancelada:** não dispara notificação

---

## Arquitetura

### Abstração de Provedor

```
lib/messaging/
├── types.ts                          ← tipos compartilhados
├── provider.ts                       ← interface MessagingProvider
├── factory.ts                        ← seleciona provedor por env var
├── providers/
│   ├── mock.ts                       ← logs no terminal (desenvolvimento)
│   └── meta-whatsapp.ts              ← Meta WhatsApp Cloud API (produção)
└── templates/
    └── meeting-report-reminder.ts    ← template do lembrete
```

### Interface MessagingProvider

```typescript
interface MessagingProvider {
  sendMessage(params: SendMessageParams): Promise<MessageResult>
}

interface SendMessageParams {
  to: string           // número E.164: +5562912345678
  templateName: string
  language: string
  components?: TemplateComponent[]
}

interface MessageResult {
  success: boolean
  messageId?: string
  error?: string
}
```

### Seleção de Provedor

Controlada pela variável de ambiente `WHATSAPP_PROVIDER`:
- `mock` → `MockWhatsAppProvider` (padrão em desenvolvimento)
- `meta` → `MetaWhatsAppCloudProvider` (produção)

---

## Variáveis de Ambiente

Todas as variáveis são **secretas** — nunca usar prefixo `NEXT_PUBLIC_`.
O envio acontece exclusivamente no servidor (Server Action ou Route Handler).

```env
WHATSAPP_PROVIDER=mock                    # mock | meta
WHATSAPP_ACCESS_TOKEN=...                 # Meta API token
WHATSAPP_PHONE_NUMBER_ID=...             # ID do número no Meta
WHATSAPP_BUSINESS_ACCOUNT_ID=...         # ID da conta Meta Business
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...        # Token de verificação do webhook
WHATSAPP_TEMPLATE_REMINDER_NAME=report_reminder
WHATSAPP_TEMPLATE_LANGUAGE=pt_BR
```

---

## Modelo de Dados (Fase A)

### Tabela `notifications`

```sql
CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      uuid NOT NULL REFERENCES meetings(id),
  user_id         uuid NOT NULL REFERENCES profiles(id),
  notification_type text NOT NULL,  -- 'report_reminder'
  channel         text NOT NULL,    -- 'whatsapp'
  status          text NOT NULL,    -- 'pending' | 'sent' | 'failed' | 'skipped'
  provider_message_id text,
  error_message   text,
  scheduled_for   timestamptz NOT NULL,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_idempotency
    UNIQUE (meeting_id, user_id, notification_type, channel)
);
```

### Campos adicionais em tabelas existentes

**`profiles`:**
- `whatsapp_phone text` — formato E.164 (+5562912345678)
- `whatsapp_notifications_enabled boolean DEFAULT false`
- `whatsapp_opt_in_at timestamptz`
- `whatsapp_opt_out_at timestamptz`

**`groups`:**
- `scheduled_end_time time` — horário habitual de término
- `timezone text DEFAULT 'America/Sao_Paulo'`

**`meetings`:**
- `scheduled_end_at timestamptz` — término previsto desta reunião específica
- `whatsapp_reminder_due_at timestamptz` — `scheduled_end_at + 1 hour`

---

## Consentimento (Opt-in / Opt-out)

- Padrão: `whatsapp_notifications_enabled = false` (sem mensagem sem consentimento)
- O líder ativa nas configurações do perfil
- Opt-out imediato: qualquer mensagem resposta "PARAR" aciona webhook → desativa
- `whatsapp_opt_in_at` e `whatsapp_opt_out_at` são auditados

---

## Fases de Implementação

| Fase | Escopo                                                          | Status   |
|------|-----------------------------------------------------------------|----------|
| A    | Migrations: campos WhatsApp em profiles/groups/meetings + tabela notifications | Pendente |
| B    | MessagingProvider interface + MockProvider + MetaProvider       | Pendente |
| C    | Job/scheduler: verificação a cada 5 minutos, disparo do lembrete | Pendente |
| D    | Integração real com Meta WhatsApp Cloud API                     | Pendente |
| E    | Webhook: receber status de entrega + opt-out por resposta       | Pendente |
| F    | Interface: opt-in/opt-out no perfil do líder                    | Pendente |
| G    | Identidade visual: template aprovado no Meta Business Manager   | Pendente |

---

## Critérios de Aceite

1. Lembrete só enviado se `whatsapp_notifications_enabled = true`
2. Lembrete só enviado se relatório ainda não foi submetido
3. Não envia lembrete para reunião cancelada
4. Máximo 1 notificação por reunião por tipo por canal (idempotência)
5. `WHATSAPP_ACCESS_TOKEN` nunca exposto ao browser
6. MockProvider não faz chamadas de rede reais
7. Webhook de opt-out desativa notificações imediatamente
8. Todos os erros de envio registrados na tabela `notifications`
9. Fuso horário: America/Sao_Paulo em todas as comparações de horário
10. Link direto no template aponta para `/relatorio/[meeting_id]`

---

## Segurança

- **NUNCA** expor `WHATSAPP_ACCESS_TOKEN` ao cliente
- Validar `WHATSAPP_WEBHOOK_VERIFY_TOKEN` em toda requisição do webhook Meta
- Webhook protegido por verificação de assinatura HMAC-SHA256
- Número de telefone armazenado em formato E.164; validado com Zod antes de salvar
- Logs de envio não incluem conteúdo da mensagem ou dados pessoais além do `user_id`
