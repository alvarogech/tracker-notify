import type { MessagingProvider } from '../provider'
import type { SendMessageParams, MessageResult } from '../types'

export class MockWhatsAppProvider implements MessagingProvider {
  async sendMessage(params: SendMessageParams): Promise<MessageResult> {
    const messageId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    console.log('[MockWhatsApp] Mensagem enviada (simulação):')
    console.log(`  Para:     ${params.to}`)
    console.log(`  Template: ${params.templateName} (${params.language})`)
    if (params.components?.length) {
      for (const component of params.components) {
        for (const param of component.parameters) {
          console.log(`  ${component.type}: ${param.text}`)
        }
      }
    }
    console.log(`  ID:       ${messageId}`)

    return { success: true, messageId }
  }
}
