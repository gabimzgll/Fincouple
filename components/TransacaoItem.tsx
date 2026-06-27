'use client'
import { Transaction } from '@/lib/types'
import { formatCurrency, getInstallmentValueForMonth } from '@/lib/calculations'

interface Props {
  transacao: Transaction
  mes: number
  ano: number
  onDelete: (id: string) => void
}

const tipoLabel: Record<string, string> = {
  casal: 'Casal',
  pessoal: 'Pessoal',
  entrada: 'Entrada',
  emprestimo: 'Emprestimo',
  parcelado: 'Parcelado',
}

export default function TransacaoItem({ transacao: t, mes, ano, onDelete }: Props) {
  const valor = t.tipo === 'parcelado'
    ? (getInstallmentValueForMonth(t, mes, ano) ?? t.valor_total)
    : t.valor_total

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{t.descricao}</p>
        <p className="text-xs text-gray-400">
          {tipoLabel[t.tipo]} · {t.pessoa} · {t.forma_pagamento}
          {t.categoria && ` · ${t.categoria}`}
          {t.tipo === 'parcelado' && t.parcelas && ` · ${t.parcelas}x`}
          {t.tipo === 'emprestimo' && t.para_pessoa && ` para ${t.para_pessoa}`}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${t.tipo === 'entrada' ? 'text-green-600' : 'text-gray-800'}`}>
          {t.tipo === 'entrada' ? '+' : ''}{formatCurrency(valor)}
        </p>
        {t.tipo === 'parcelado' && t.parcelas && (
          <p className="text-xs text-gray-400">{formatCurrency(t.valor_total)} total</p>
        )}
      </div>
      <button
        onClick={() => onDelete(t.id)}
        className="text-gray-300 hover:text-red-400 text-sm pl-1"
        title="Excluir"
      >X</button>
    </div>
  )
}
