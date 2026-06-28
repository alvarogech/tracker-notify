-- Fase A: campos e tabela para notificações WhatsApp
-- Depende de: profiles, groups, meetings (criadas na Fase 1)

-- ============================================================
-- profiles: dados de contato WhatsApp e consentimento
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS whatsapp_phone             text,
  ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at          timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_out_at         timestamptz;

COMMENT ON COLUMN profiles.whatsapp_phone IS 'Número no formato E.164: +5562912345678';
COMMENT ON COLUMN profiles.whatsapp_notifications_enabled IS 'Consentimento explícito — padrão false';

-- ============================================================
-- groups: horário de término habitual e fuso
-- ============================================================
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS scheduled_end_time time,
  ADD COLUMN IF NOT EXISTS timezone           text NOT NULL DEFAULT 'America/Sao_Paulo';

COMMENT ON COLUMN groups.scheduled_end_time IS 'Horário habitual de término das reuniões do GR';

-- ============================================================
-- meetings: horário de término desta reunião + deadline do lembrete
-- ============================================================
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS scheduled_end_at          timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_reminder_due_at  timestamptz
    GENERATED ALWAYS AS (scheduled_end_at + INTERVAL '1 hour') STORED;

COMMENT ON COLUMN meetings.scheduled_end_at IS 'Horário de término previsto desta reunião específica';
COMMENT ON COLUMN meetings.whatsapp_reminder_due_at IS 'scheduled_end_at + 1h — gerado automaticamente';

-- ============================================================
-- notifications: registro de cada notificação enviada ou tentada
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id          uuid        NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id             uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type   text        NOT NULL,
  channel             text        NOT NULL,
  status              text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  provider_message_id text,
  error_message       text,
  scheduled_for       timestamptz NOT NULL,
  sent_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),

  -- Garante no máximo 1 notificação por reunião/usuário/tipo/canal
  CONSTRAINT notifications_idempotency
    UNIQUE (meeting_id, user_id, notification_type, channel)
);

COMMENT ON TABLE notifications IS 'Registro de notificações automáticas (WhatsApp, futuramente outros canais)';
COMMENT ON CONSTRAINT notifications_idempotency ON notifications
  IS 'Idempotência: impede duplicatas por retry ou falha do job';

-- RLS: habilitado, negar por padrão
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Coordenadores e admins visualizam todas as notificações
CREATE POLICY "notifications_coordinator_read"
  ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('coordinator', 'admin')
    )
  );

-- Líder vê apenas notificações das próprias reuniões
CREATE POLICY "notifications_leader_read"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- Apenas service_role (jobs de servidor) insere/atualiza notificações
-- (sem policy de INSERT/UPDATE para roles de usuário — forçado via server-side)
