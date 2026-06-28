import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildReportReminderTemplate } from '@/lib/messaging/templates/meeting-report-reminder'

describe('buildReportReminderTemplate', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('usa valores padrão quando env vars não estão definidas', () => {
    const result = buildReportReminderTemplate({
      leaderName: 'João',
      groupName: 'GR Norte',
      reportUrl: 'https://app.huios.com.br/relatorio/abc',
    })

    expect(result.templateName).toBe('report_reminder')
    expect(result.language).toBe('pt_BR')
  })

  it('usa env vars quando definidas', () => {
    vi.stubEnv('WHATSAPP_TEMPLATE_REMINDER_NAME', 'lembrete_relatorio')
    vi.stubEnv('WHATSAPP_TEMPLATE_LANGUAGE', 'pt_BR')

    const result = buildReportReminderTemplate({
      leaderName: 'Maria',
      groupName: 'GR Sul',
      reportUrl: 'https://app.huios.com.br/relatorio/xyz',
    })

    expect(result.templateName).toBe('lembrete_relatorio')
  })

  it('inclui nome do líder e grupo no body', () => {
    const result = buildReportReminderTemplate({
      leaderName: 'Pedro',
      groupName: 'GR Leste',
      reportUrl: 'https://app.huios.com.br/relatorio/456',
    })

    const body = result.components.find((c) => c.type === 'body')
    expect(body?.parameters.map((p) => p.text)).toEqual(['Pedro', 'GR Leste'])
  })

  it('inclui URL do relatório no button', () => {
    const url = 'https://app.huios.com.br/relatorio/789'
    const result = buildReportReminderTemplate({
      leaderName: 'Ana',
      groupName: 'GR Oeste',
      reportUrl: url,
    })

    const button = result.components.find((c) => c.type === 'button')
    expect(button?.parameters[0].text).toBe(url)
  })
})
