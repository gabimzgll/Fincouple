'use client'
import { BalancoIndividual } from '@/lib/types'
import { formatCurrency, getNomeMes } from '@/lib/calculations'

interface Props {
  balanco: BalancoIndividual
  mes: number
  ano: number
}

export default function BalancoCard({ balanco, mes, ano }: Props) {
  const nome = balanco.pessoa
  const color = balanco.pessoa === 'Gabi' ? 'rose' : 'violet'

  return (
    <div className={`bg-white rounded-2xl p-4 border border-${color}-100 shadow-sm`}>
      <h2 className={`font-bold text-${color}-600 text-lg mb-3`}>
        {nome} — {getNomeMes(mes)} {ano}
      </h2>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Entradas</span>
          <span className="font-semibold text-green-600">{formatCurrency(balanco.entradas)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Saidas</span>
          <span className="font-semibold text-red-500">{formatCurrency(balanco.saidas)}</span>
        </div>
        {Object.entries(balanco.saidas_por_metodo).map(([forma, valor]) => (
          <div key={forma} className="flex justify-between pl-4 text-xs text-gray-400">
            <span>{forma}</span>
            <span>{formatCurrency(valor)}</span>
          </div>
        ))}
        {balanco.entradas > 0 && (
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="text-gray-600 font-medium">Sobra</span>
            <span className={`font-bold ${balanco.sobra >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {formatCurrency(balanco.sobra)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
