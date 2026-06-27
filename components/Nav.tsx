'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const path = usePathname()
  const links = [
    { href: '/', label: 'Inicio' },
    { href: '/registrar', label: 'Registrar' },
    { href: '/historico', label: 'Historico' },
  ]

  return (
    <nav className="bg-rose-600 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
        <span className="font-bold text-xl mr-4">FinCouple</span>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm font-medium transition-colors ${
              path === l.href
                ? 'text-white underline'
                : 'hover:text-rose-200'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
