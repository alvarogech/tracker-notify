import { describe, it, expect, vi, afterEach } from 'vitest'
import { MockWhatsAppProvider } from '@/lib/messaging/providers/mock'
import { createMessagingProvider } from '@/lib/messaging/factory'

describe('MockWhatsAppProvider', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('retorna sucesso com messageId ao enviar mensagem', async () => {
    const provider = new MockWhatsAppProvider()
    const result = await provider.sendMessage({
      to: '+5562912345678',
      templateName: 'report_reminder',
      language: 'pt_BR',
    })

    expect(result.success).toBe(true)
    expect(result.messageId).toMatch(/^mock_/)
    expect(result.error).toBeUndefined()
  })

  it('gera messageIds únicos em chamadas sucessivas', async () => {
    const provider = new MockWhatsAppProvider()
    const [a, b] = await Promise.all([
      provider.sendMessage({ to: '+5562900000001', templateName: 'report_reminder', language: 'pt_BR' }),
      provider.sendMessage({ to: '+5562900000002', templateName: 'report_reminder', language: 'pt_BR' }),
    ])

    expect(a.messageId).not.toBe(b.messageId)
  })

  it('inclui components no log sem lançar erro', async () => {
    const provider = new MockWhatsAppProvider()
    const result = await provider.sendMessage({
      to: '+5562912345678',
      templateName: 'report_reminder',
      language: 'pt_BR',
      components: [
        { type: 'body', parameters: [{ type: 'text', text: 'João' }, { type: 'text', text: 'GR Norte' }] },
        { type: 'button', parameters: [{ type: 'url', text: 'https://app.huios.com.br/relatorio/123' }] },
      ],
    })

    expect(result.success).toBe(true)
  })
})

describe('createMessagingProvider (factory)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('retorna MockWhatsAppProvider quando WHATSAPP_PROVIDER=mock', () => {
    vi.stubEnv('WHATSAPP_PROVIDER', 'mock')
    const provider = createMessagingProvider()
    expect(provider.constructor.name).toBe('MockWhatsAppProvider')
  })

  it('retorna MockWhatsAppProvider quando WHATSAPP_PROVIDER não está definido', () => {
    vi.stubEnv('WHATSAPP_PROVIDER', '')
    const provider = createMessagingProvider()
    expect(provider.constructor.name).toBe('MockWhatsAppProvider')
  })
})
