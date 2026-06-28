import type { Metadata, Viewport } from 'next'
import { Outfit, Inter } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-brand',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Pastoreio HUIOS',
    template: '%s — Pastoreio HUIOS',
  },
  description:
    'Ferramenta interna de apoio ao pastoreio, discipulado e formação da rede HUIOS — Igreja Emaús.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/brand/app-icon-192.png',
  },
  appleWebApp: {
    title: 'Pastoreio',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#0A6B47',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  )
}
