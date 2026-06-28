export type NotificationChannel = 'whatsapp'
export type NotificationType = 'report_reminder'
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'skipped'

export interface TemplateComponent {
  type: 'header' | 'body' | 'button'
  parameters: TemplateParameter[]
}

export interface TemplateParameter {
  type: 'text' | 'url'
  text: string
}

export interface SendMessageParams {
  /** Número no formato E.164: +5562912345678 */
  to: string
  templateName: string
  language: string
  components?: TemplateComponent[]
}

export interface MessageResult {
  success: boolean
  messageId?: string
  error?: string
}
