import type { MessagingProvider } from '../provider'
import type { SendMessageParams, MessageResult } from '../types'

/**
 * Mascara um número de telefone E.164 mantendo apenas DDI/DDD e os últimos
 * dois dígitos — suficiente para diferenciar mensagens em log de
 * desenvolvimento sem expor o contato completo (CLAUDE.md seção 6).
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length <= 6) return '***'
  return `${phone.slice(0, 4)}${'*'.repeat(phone.length - 6)}${phone.slice(-2)}`
}

export class MockWhatsAppProvider implements MessagingProvider {
  async sendMessage(params: SendMessageParams): Promise<MessageResult> {
    const messageId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    console.log('[MockWhatsApp] Mensagem enviada (simulação):')
    console.log(`  Para:     ${maskPhoneNumber(params.to)}`)
    console.log(`  Template: ${params.templateName} (${params.language})`)
    if (params.components?.length) {
      for (const component of params.components) {
        console.log(`  ${component.type}: ${component.parameters.length} parâmetro(s)`)
      }
    }
    console.log(`  ID:       ${messageId}`)

    return { success: true, messageId }
  }
}
