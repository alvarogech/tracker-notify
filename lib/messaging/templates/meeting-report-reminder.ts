import type { TemplateComponent } from '../types'

interface ReminderTemplateParams {
  leaderName: string
  groupName: string
  reportUrl: string
}

export function buildReportReminderTemplate(params: ReminderTemplateParams): {
  templateName: string
  language: string
  components: TemplateComponent[]
} {
  const templateName = process.env.WHATSAPP_TEMPLATE_REMINDER_NAME ?? 'report_reminder'
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? 'pt_BR'

  return {
    templateName,
    language,
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: params.leaderName },
          { type: 'text', text: params.groupName },
        ],
      },
      {
        type: 'button',
        parameters: [{ type: 'url', text: params.reportUrl }],
      },
    ],
  }
}
