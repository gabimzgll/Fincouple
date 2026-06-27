'use client'
import { SaldoCasal } from '@/lib/types'
import { formatCurrency, getNomeMes } from '@/lib/calculations'

interface Props {
  saldo: SaldoCasal
  mes: number
  ano: number
  onAcerto: () => void
}

export default function SaldoCard({ saldo, mes, ano, onAcerto }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm">
      <h2 className="font-bold text-amber-600 text-lg mb-3">
        Saldo do Casal — {getNomeMes(mes)} {ano}
      </h2>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Total despesas do casal</span>
          <span className="font-semibold">{formatCurrency(saldo.total_casal)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 pl-4">
          <span>Gabi pagou</span>
          <span>{formatCurrency(saldo.gabi_pagou_casal)} (devia {formatCurrency(saldo.gabi_deveria_pagar)})</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400 pl-4">
          <span>Rafa pagou</span>
          <span>{formatCurrency(saldo.rafa_pagou_casal)} (devia {formatCurrency(saldo.rafa_deveria_pagar)})</span>
        </div>
        {saldo.emprestimos_gabi_para_rafa > 0 && (
          <div className="flex justify-between text-xs text-gray-400 pl-4">
            <span>Emprestimo Gabi para Rafa</span>
            <span>{formatCurrency(saldo.emprestimos_gabi_para_rafa)}</span>
          </div>
        )}
        {saldo.emprestimos_rafa_para_gabi > 0 && (
          <div className="flex justify-between text-xs text-gray-400 pl-4">
            <span>Emprestimo Rafa para Gabi</span>
            <span>{formatCurrency(saldo.emprestimos_rafa_para_gabi)}</span>
          </div>
        )}
      </div>

      <div className={`mt-4 p-3 rounded-xl text-center font-bold ${
        saldo.quem_deve === null
          ? 'bg-green-50 text-green-600'
          : 'bg-amber-50 text-amber-700'
      }`}>
        {saldo.quem_deve === null
          ? 'Estao quites!'
          : `${saldo.quem_deve} deve ${formatCurrency(Math.abs(saldo.saldo_final))} para ${saldo.quem_recebe}`
        }
      </div>

      {saldo.quem_deve !== null && (
        <button
          onClick={onAcerto}
          className="w-full mt-3 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors"
        >
          Registrar acerto de {formatCurrency(Math.abs(saldo.saldo_final))}
        </button>
      )}
    </div>
  )
}
