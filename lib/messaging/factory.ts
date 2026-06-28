import type { MessagingProvider } from './provider'
import { MockWhatsAppProvider } from './providers/mock'
import { MetaWhatsAppProvider } from './providers/meta-whatsapp'

export function createMessagingProvider(): MessagingProvider {
  const providerName = process.env.WHATSAPP_PROVIDER ?? 'mock'

  if (providerName === 'meta') {
    return new MetaWhatsAppProvider()
  }

  return new MockWhatsAppProvider()
}
