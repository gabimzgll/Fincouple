'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Transaction, Acerto } from '@/lib/types'
import {
  calcularBalancoIndividual,
  calcularSaldoCasal,
  calcularGastosCasalPorCategoria,
  formatCurrency,
  getNomeMes,
} from '@/lib/calculations'

export default function HomePage() {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [acertos, setAcertos] = useState<Acerto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: txs }, { data: acs }] = await Promise.all([
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
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
  const casalPorCategoria = calcularGastosCasalPorCategoria(transactions, mes, ano)

  const recentTransactions = transactions.slice(0, 10)

  const meses = Array.from({ length: 12 }, (_, i) => i + 1)
  const anos = [2024, 2025, 2026]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-400 outline-none"
          >
            {meses.map((m) => (
              <option key={m} value={m}>{getNomeMes(m)}</option>
            ))}
          </select>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-400 outline-none"
          >
            {anos.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-gray-500 text-sm">{getNomeMes(mes)} de {ano}</p>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow p-5 border border-rose-100">
              <h2 className="text-lg font-semibold text-rose-600 mb-3">Balanço da Gabi</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Entradas</span>
                  <span className="text-green-600 font-medium">{formatCurrency(gabiBalanco.entradas)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Saídas</span>
                  <span className="text-red-500 font-medium">{formatCurrency(gabiBalanco.saidas)}</span>
                </div>
                {Object.entries(gabiBalanco.saidas_por_metodo).map(([metodo, valor]) => (
                  <div key={metodo} className="flex justify-between pl-4 text-gray-400">
                    <span>{metodo}</span>
                    <span>{formatCurrency(valor)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Sobra</span>
                  <span className={gabiBalanco.sobra >= 0 ? 'text-green-600' : 'text-red-500'}>
                    {formatCurrency(gabiBalanco.sobra)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-5 border border-blue-100">
              <h2 className="text-lg font-semibold text-blue-600 mb-3">Balanço do Rafa</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Entradas</span>
                  <span className="text-green-600 font-medium">{formatCurrency(rafaBalanco.entradas)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Saídas</span>
                  <span className="text-red-500 font-medium">{formatCurrency(rafaBalanco.saidas)}</span>
                </div>
                {Object.entries(rafaBalanco.saidas_por_metodo).map(([metodo, valor]) => (
                  <div key={metodo} className="flex justify-between pl-4 text-gray-400">
                    <span>{metodo}</span>
                    <span>{formatCurrency(valor)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Sobra</span>
                  <span className={rafaBalanco.sobra >= 0 ? 'text-green-600' : 'text-red-500'}>
                    {formatCurrency(rafaBalanco.sobra)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-5 border border-rose-200">
            <h2 className="text-lg font-semibold text-rose-700 mb-4">Saldo do Casal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total despesas casal</span>
                  <span className="font-medium">{formatCurrency(saldoCasal.total_casal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gabi pagou</span>
                  <span>{formatCurrency(saldoCasal.gabi_pagou_casal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rafa pagou</span>
                  <span>{formatCurrency(saldoCasal.rafa_pagou_casal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gabi deveria pagar (62,6%)</span>
                  <span>{formatCurrency(saldoCasal.gabi_deveria_pagar)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rafa deveria pagar (37,4%)</span>
                  <span>{formatCurrency(saldoCasal.rafa_deveria_pagar)}</span>
                </div>
              </div>
              <div className="space-y-2">
                {saldoCasal.emprestimos_gabi_para_rafa > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Empréstimo Gabi para Rafa</span>
                    <span>{formatCurrency(saldoCasal.emprestimos_gabi_para_rafa)}</span>
                  </div>
                )}
                {saldoCasal.emprestimos_rafa_para_gabi > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Empréstimo Rafa para Gabi</span>
                    <span>{formatCurrency(saldoCasal.emprestimos_rafa_para_gabi)}</span>
                  </div>
                )}
                {saldoCasal.acertos_mes !== 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Acertos realizados</span>
                    <span className="text-green-600">{formatCurrency(Math.abs(saldoCasal.acertos_mes))}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  {saldoCasal.quem_deve ? (
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-gray-600 text-xs mb-1">Resultado</p>
                      <p className="font-bold text-lg text-amber-700">
                        {saldoCasal.quem_deve} deve {formatCurrency(Math.abs(saldoCasal.saldo_final))} para {saldoCasal.quem_recebe}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <p className="font-bold text-green-700">Estão quites!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow p-5 border border-rose-100">
              <h2 className="text-base font-semibold text-rose-600 mb-3">Gabi — por categoria</h2>
              {Object.keys(gabiBalanco.saidas_por_categoria).length === 0 ? (
                <p className="text-gray-400 text-xs">Nenhum gasto pessoal</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {Object.entries(gabiBalanco.saidas_por_categoria)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, val]) => (
                      <li key={cat} className="flex justify-between">
                        <span className="text-gray-500 capitalize">{cat}</span>
                        <span className="font-medium text-gray-800">{formatCurrency(val)}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-5 border border-violet-100">
              <h2 className="text-base font-semibold text-violet-600 mb-3">Rafa — por categoria</h2>
              {Object.keys(rafaBalanco.saidas_por_categoria).length === 0 ? (
                <p className="text-gray-400 text-xs">Nenhum gasto pessoal</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {Object.entries(rafaBalanco.saidas_por_categoria)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, val]) => (
                      <li key={cat} className="flex justify-between">
                        <span className="text-gray-500 capitalize">{cat}</span>
                        <span className="font-medium text-gray-800">{formatCurrency(val)}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-5 border border-amber-100">
              <h2 className="text-base font-semibold text-amber-600 mb-3">Casal — por categoria</h2>
              {Object.keys(casalPorCategoria).length === 0 ? (
                <p className="text-gray-400 text-xs">Nenhum gasto do casal</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {Object.entries(casalPorCategoria)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, val]) => (
                      <li key={cat} className="flex justify-between">
                        <span className="text-gray-500 capitalize">{cat}</span>
                        <span className="font-medium text-gray-800">{formatCurrency(val)}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link
              href="/registrar"
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
            >
              + Registrar Transação
            </Link>
            <Link
              href="/registrar?tipo=acerto"
              className="bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 px-5 py-2.5 rounded-xl font-medium transition-colors"
            >
              Registrar Acerto
            </Link>
            <Link
              href={`/balanco/${mes}/${ano}`}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-medium transition-colors"
            >
              Ver Balanço Completo
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Transações Recentes</h2>
              <Link href="/historico" className="text-rose-600 text-sm hover:underline">Ver todas</Link>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Nenhuma transação registrada ainda.</p>
            ) : (
              <ul className="divide-y">
                {recentTransactions.map((t) => (
                  <li key={t.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{t.descricao}</p>
                      <p className="text-xs text-gray-400">
                        {t.pessoa} · {t.tipo} · {getNomeMes(t.mes)}/{t.ano}
                      </p>
                    </div>
                    <span className={`font-semibold text-sm whitespace-nowrap ${t.tipo === 'entrada' ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(t.valor_total)}
                    </span>
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
