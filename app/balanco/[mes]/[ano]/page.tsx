'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Transaction, Acerto } from '@/lib/types'
import {
  calcularBalancoIndividual,
  calcularSaldoCasal,
  getEffectiveTransactions,
  formatCurrency,
  getNomeMes,
} from '@/lib/calculations'

export default function BalancoPage() {
  const params = useParams()
  const mes = Number(params.mes)
  const ano = Number(params.ano)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [acertos, setAcertos] = useState<Acerto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: txs }, { data: acs }] = await Promise.all([
        supabase.from('transactions').select('*'),
        supabase.from('acertos').select('*'),
      ])
      setTransactions((txs as Transaction[]) || [])
      setAcertos((acs as Acerto[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const gabiBalanco = calcularBalancoIndividual(transactions, acertos, 'Gabi', mes, ano)
  const rafaBalanco = calcularBalancoIndividual(transactions, acertos, 'Rafa', mes, ano)
  const saldoCasal = calcularSaldoCasal(transactions, acertos, mes, ano)
  const effective = getEffectiveTransactions(transactions, mes, ano)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-gray-500 hover:text-gray-800">Voltar</Link>
        <h1 className="text-2xl font-bold text-gray-800">Balanco: {getNomeMes(mes)} {ano}</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow p-5 border border-purple-100">
              <h2 className="text-lg font-semibold text-purple-400 mb-3">Gabi</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Entradas</span><span className="text-green-600">{formatCurrency(gabiBalanco.entradas)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Saidas</span><span className="text-red-500">{formatCurrency(gabiBalanco.saidas)}</span></div>
                {Object.entries(gabiBalanco.saidas_por_categoria).map(([m, v]) => (
                  <div key={m} className="flex justify-between pl-4 text-gray-400"><span className="capitalize">{m}</span><span>{formatCurrency(v)}</span></div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Sobra</span>
                  <span className={gabiBalanco.sobra >= 0 ? 'text-green-600' : 'text-red-500'}>{formatCurrency(gabiBalanco.sobra)}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow p-5 border border-green-100">
              <h2 className="text-lg font-semibold text-[#006437] mb-3">Rafa</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Entradas</span><span className="text-green-600">{formatCurrency(rafaBalanco.entradas)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Saidas</span><span className="text-red-500">{formatCurrency(rafaBalanco.saidas)}</span></div>
                {Object.entries(rafaBalanco.saidas_por_categoria).map(([m, v]) => (
                  <div key={m} className="flex justify-between pl-4 text-gray-400"><span className="capitalize">{m}</span><span>{formatCurrency(v)}</span></div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Sobra</span>
                  <span className={rafaBalanco.sobra >= 0 ? 'text-green-600' : 'text-red-500'}>{formatCurrency(rafaBalanco.sobra)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
            <h2 className="text-lg font-semibold text-amber-600 mb-4">Saldo do Casal</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total casal</span><span>{formatCurrency(saldoCasal.total_casal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Gabi pagou</span><span>{formatCurrency(saldoCasal.gabi_pagou_casal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Rafa pagou</span><span>{formatCurrency(saldoCasal.rafa_pagou_casal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Gabi deveria (62,6%)</span><span>{formatCurrency(saldoCasal.gabi_deveria_pagar)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Rafa deveria (37,4%)</span><span>{formatCurrency(saldoCasal.rafa_deveria_pagar)}</span></div>
              {saldoCasal.emprestimos_gabi_para_rafa > 0 && <div className="flex justify-between"><span className="text-gray-500">Emprestimo Gabi para Rafa</span><span>{formatCurrency(saldoCasal.emprestimos_gabi_para_rafa)}</span></div>}
              {saldoCasal.emprestimos_rafa_para_gabi > 0 && <div className="flex justify-between"><span className="text-gray-500">Emprestimo Rafa para Gabi</span><span>{formatCurrency(saldoCasal.emprestimos_rafa_para_gabi)}</span></div>}
              <div className="border-t pt-2 text-gray-600">
                {saldoCasal.quem_deve ? (
                  <p className="text-center">{saldoCasal.quem_deve} acerta {formatCurrency(Math.abs(saldoCasal.saldo_final))} com {saldoCasal.quem_recebe}</p>
                ) : (
                  <p className="font-medium text-green-700 text-center">Quites!</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Todas as Transacoes do Mes</h2>
            {effective.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Nenhuma transacao neste mes.</p>
            ) : (
              <ul className="divide-y">
                {effective.map(({ transaction: t, valor }) => (
                  <li key={`${t.id}-${valor}`} className="py-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800">{t.descricao}</p>
                      <p className="text-xs text-gray-400">{t.pessoa} · {t.tipo} · {t.forma_pagamento}{t.categoria ? ` · ${t.categoria}` : ''}</p>
                      {t.parcelas && t.parcelas >= 2 && <p className="text-xs text-purple-400">Parcelado em {t.parcelas}x</p>}
                    </div>
                    <span className={`font-semibold text-sm whitespace-nowrap ${t.tipo === 'entrada' ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(valor)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
