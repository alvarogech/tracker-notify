import type { SendMessageParams, MessageResult } from './types'

export interface MessagingProvider {
  sendMessage(params: SendMessageParams): Promise<MessageResult>
}
