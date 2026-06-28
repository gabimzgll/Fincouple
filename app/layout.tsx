import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FinCouple',
  description: 'Controle financeiro do casal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <nav className="bg-gray-900 text-white shadow-md">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <Link href="/" className="text-xl font-bold tracking-tight">FinCouple</Link>
            <div className="flex gap-4 text-sm font-medium">
              <Link href="/" className="hover:text-gray-300 transition-colors">Inicio</Link>
              <Link href="/registrar" className="hover:text-gray-300 transition-colors">Registrar</Link>
              <Link href="/historico" className="hover:text-gray-300 transition-colors">Historico</Link>
              <Link href="/planejamento" className="hover:text-gray-300 transition-colors">Planejamento</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
