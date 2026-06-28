import type { MessagingProvider } from '../provider'
import type { SendMessageParams, MessageResult } from '../types'

const META_API_URL = 'https://graph.facebook.com/v19.0'

export class MetaWhatsAppProvider implements MessagingProvider {
  private readonly accessToken: string
  private readonly phoneNumberId: string

  constructor() {
    const token = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!token || !phoneId) {
      throw new Error(
        'WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID são obrigatórios para o MetaWhatsAppProvider'
      )
    }

    this.accessToken = token
    this.phoneNumberId = phoneId
  }

  async sendMessage(params: SendMessageParams): Promise<MessageResult> {
    const url = `${META_API_URL}/${this.phoneNumberId}/messages`

    const body = {
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.language },
        ...(params.components?.length ? { components: params.components } : {}),
      },
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = (await response.json()) as {
        messages?: Array<{ id: string }>
        error?: { message: string; code: number }
      }

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error?.message ?? `HTTP ${response.status}`,
        }
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      }
    }
  }
}
