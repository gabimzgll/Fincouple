'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Transaction, Acerto, Limite, CATEGORIAS } from '@/lib/types'
import {
  calcularBalancoProporcional,
  calcularSaldoCasal,
  calcularGastosCasalPorCategoria,
  calcularGastosPessoaisPorCategoria,
  calcularGastosPorCategoria,
  calcularRendaExtra,
  formatCurrency,
  getNomeMes,
} from '@/lib/calculations'

const COR_GABI = 'text-purple-400'
const COR_RAFA = 'text-[#006437]'
const COR_CASAL = 'text-amber-600'

const COR_ENTRADA = 'text-blue-700'
const COR_SAIDA = 'text-orange-600'
const COR_EXTRA = 'text-sky-500'
const corSaldo = (v: number) => (v >= 0 ? 'text-green-600' : 'text-red-500')

const PALETTE = [
  '#a5b4fc', '#fca5a5', '#fcd34d', '#6ee7b7', '#93c5fd', '#f9a8d4',
  '#c4b5fd', '#5eead4', '#fdba74', '#bef264', '#d8b4fe', '#7dd3fc',
  '#86efac', '#f0abfc', '#fda4af', '#67e8f9', '#fde68a', '#a7f3d0',
  '#bfdbfe', '#ddd6fe', '#fbcfe8', '#c7d2fe', '#99f6e4', '#d9f99d',
  '#e9d5ff', '#bae6fd',
]

const ALL_CATEGORIAS = Array.from(new Set([...CATEGORIAS, 'sem categoria']))
function colorForCategory(cat: string): string {
  const idx = ALL_CATEGORIAS.indexOf(cat)
  if (idx === -1) return '#cbd5e1'
  return PALETTE[idx % PALETTE.length]
}

function variacao(atual: number, anterior: number): { pct: number | null; subiu: boolean } {
  if (anterior === 0) return { pct: atual === 0 ? 0 : null, subiu: atual > 0 }
  const pct = ((atual - anterior) / anterior) * 100
  return { pct, subiu: pct >= 0 }
}

function Delta({ atual, anterior, gastoEhRuim = false }: { atual: number; anterior: number; gastoEhRuim?: boolean }) {
  const { pct, subiu } = variacao(atual, anterior)
  if (pct === null) return <span className="text-[11px] text-gray-400">novo</span>
  if (pct === 0) return <span className="text-[11px] text-gray-400">igual ao mês anterior</span>
  const bom = gastoEhRuim ? !subiu : subiu
  const cor = bom ? 'text-green-600' : 'text-red-500'
  const seta = subiu ? '▲' : '▼'
  return (
    <span className={`text-[11px] font-medium ${cor}`}>
      {seta} {Math.abs(pct).toFixed(0)}% vs. mês anterior
    </span>
  )
}

function KpiCard({
  label, valor, anterior, cor, gastoEhRuim = false,
}: { label: string; valor: number; anterior: number; cor: string; gastoEhRuim?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 border border-gray-100">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${cor}`}>{formatCurrency(valor)}</p>
      <Delta atual={valor} anterior={anterior} gastoEhRuim={gastoEhRuim} />
    </div>
  )
}

function PieCard({ title, titleColor, data, border }: { title: string; titleColor: string; data: Record<string, number>; border: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0)

  let acc = 0
  const stops = entries.map(([cat, val]) => {
    const start = (acc / total) * 360
    acc += val
    const end = (acc / total) * 360
    return `${colorForCategory(cat)} ${start}deg ${end}deg`
  })

  return (
    <div className={`bg-white rounded-2xl shadow p-5 border ${border}`}>
      <h2 className={`text-base font-semibold mb-3 ${titleColor}`}>{title}</h2>
      {total === 0 ? (
        <p className="text-gray-400 text-xs">Sem gastos neste mês</p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative" style={{ width: 130, height: 130 }}>
            <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${stops.join(', ')})` }} />
            <div className="absolute inset-[20px] bg-white rounded-full flex flex-col items-center justify-center">
              <span className="text-[10px] text-gray-400">total</span>
              <span className="text-sm font-bold text-gray-800">{formatCurrency(total)}</span>
            </div>
          </div>
          <ul className="space-y-1 text-xs w-full">
            {entries.map(([cat, val]) => (
              <li key={cat} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorForCategory(cat) }} />
                <span className="text-gray-600 capitalize truncate">{cat}</span>
                <span className="text-gray-400 ml-auto whitespace-nowrap">{formatCurrency(val)} · {((val / total) * 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [acertos, setAcertos] = useState<Acerto[]>([])
  const [limites, setLimites] = useState<Limite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: txs }, { data: acs }, { data: lim }] = await Promise.all([
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('acertos').select('*'),
        supabase.from('limites').select('*'),
      ])
      setTransactions((txs as Transaction[]) || [])
      setAcertos((acs as Acerto[]) || [])
      setLimites((lim as Limite[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const gabiBalanco = calcularBalancoProporcional(transactions, 'Gabi', mes, ano)
  const rafaBalanco = calcularBalancoProporcional(transactions, 'Rafa', mes, ano)
  const saldoCasal = calcularSaldoCasal(transactions, acertos, mes, ano)
  const casalPorCategoria = calcularGastosCasalPorCategoria(transactions, mes, ano)
  const gabiPessoalPorCategoria = calcularGastosPessoaisPorCategoria(transactions, 'Gabi', mes, ano)
  const rafaPessoalPorCategoria = calcularGastosPessoaisPorCategoria(transactions, 'Rafa', mes, ano)
  const rendaExtra = calcularRendaExtra(transactions, mes, ano)
  const gastosPorCategoria = calcularGastosPorCategoria(transactions, mes, ano)
  const limitesComGasto = limites
    .map(l => ({ categoria: l.categoria, limite: l.valor, gasto: gastosPorCategoria[l.categoria] || 0 }))
    .sort((a, b) => (b.gasto / b.limite) - (a.gasto / a.limite))

  const prevMes = mes === 1 ? 12 : mes - 1
  const prevAno = mes === 1 ? ano - 1 : ano
  const gabiPrev = calcularBalancoProporcional(transactions, 'Gabi', prevMes, prevAno)
  const rafaPrev = calcularBalancoProporcional(transactions, 'Rafa', prevMes, prevAno)
  const rendaExtraPrev = calcularRendaExtra(transactions, prevMes, prevAno)

  const entradasTotal = gabiBalanco.entradas + rafaBalanco.entradas
  const saidasTotal = gabiBalanco.saidas + rafaBalanco.saidas
  const sobraTotal = entradasTotal - saidasTotal

  const entradasPrev = gabiPrev.entradas + rafaPrev.entradas
  const saidasPrev = gabiPrev.saidas + rafaPrev.saidas
  const sobraPrev = entradasPrev - saidasPrev

  const recentTransactions = transactions.slice(0, 10)
  const meses = Array.from({ length: 12 }, (_, i) => i + 1)
  const anos = [2024, 2025, 2026]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm">{getNomeMes(mes)} de {ano}</p>
        </div>
        <div className="flex gap-2">
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
          >
            {meses.map((m) => (
              <option key={m} value={m}>{getNomeMes(m)}</option>
            ))}
          </select>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 outline-none"
          >
            {anos.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Entrou no mês" valor={entradasTotal} anterior={entradasPrev} cor={COR_ENTRADA} />
            <KpiCard label="Saiu no mês" valor={saidasTotal} anterior={saidasPrev} cor={COR_SAIDA} gastoEhRuim />
            <KpiCard label="Saldo" valor={sobraTotal} anterior={sobraPrev} cor={corSaldo(sobraTotal)} />
            <KpiCard label="Renda extra" valor={rendaExtra} anterior={rendaExtraPrev} cor={COR_EXTRA} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow p-5 border border-purple-100">
              <h2 className={`text-lg font-semibold mb-3 ${COR_GABI}`}>Balanço da Gabi</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Entradas</span>
                  <span className={`font-medium ${COR_ENTRADA}`}>{formatCurrency(gabiBalanco.entradas)}</span>
                </div>
                <div className="flex justify-between pl-4 text-gray-400">
                  <span>Gastos pessoais</span>
                  <span>{formatCurrency(gabiBalanco.gastos_pessoais)}</span>
                </div>
                <div className="flex justify-between pl-4 text-gray-400">
                  <span>Parte do casal (62,6%)</span>
                  <span>{formatCurrency(gabiBalanco.parte_casal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Saídas (total)</span>
                  <span className={`font-medium ${COR_SAIDA}`}>{formatCurrency(gabiBalanco.saidas)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold items-center">
                  <span>Saldo</span>
                  <div className="text-right">
                    <span className={corSaldo(gabiBalanco.sobra)}>{formatCurrency(gabiBalanco.sobra)}</span>
                    <div><Delta atual={gabiBalanco.sobra} anterior={gabiPrev.sobra} /></div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center bg-purple-50 rounded-lg px-3 py-2">
                  <span className="text-gray-600">💳 Fatura do cartão</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(gabiBalanco.fatura_cartao)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-5 border border-green-100">
              <h2 className={`text-lg font-semibold mb-3 ${COR_RAFA}`}>Balanço do Rafa</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Entradas</span>
                  <span className={`font-medium ${COR_ENTRADA}`}>{formatCurrency(rafaBalanco.entradas)}</span>
                </div>
                <div className="flex justify-between pl-4 text-gray-400">
                  <span>Gastos pessoais</span>
                  <span>{formatCurrency(rafaBalanco.gastos_pessoais)}</span>
                </div>
                <div className="flex justify-between pl-4 text-gray-400">
                  <span>Parte do casal (37,4%)</span>
                  <span>{formatCurrency(rafaBalanco.parte_casal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Saídas (total)</span>
                  <span className={`font-medium ${COR_SAIDA}`}>{formatCurrency(rafaBalanco.saidas)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold items-center">
                  <span>Saldo</span>
                  <div className="text-right">
                    <span className={corSaldo(rafaBalanco.sobra)}>{formatCurrency(rafaBalanco.sobra)}</span>
                    <div><Delta atual={rafaBalanco.sobra} anterior={rafaPrev.sobra} /></div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center bg-green-50 rounded-lg px-3 py-2">
                  <span className="text-gray-600">💳 Fatura do cartão</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(rafaBalanco.fatura_cartao)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PieCard title="Gabi — gastos pessoais" titleColor={COR_GABI} data={gabiPessoalPorCategoria} border="border-purple-100" />
            <PieCard title="Rafa — gastos pessoais" titleColor={COR_RAFA} data={rafaPessoalPorCategoria} border="border-green-100" />
            <PieCard title="Casal — gastos compartilhados" titleColor={COR_CASAL} data={casalPorCategoria} border="border-amber-100" />
          </div>

          {limitesComGasto.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
              <h2 className="text-lg font-semibold text-amber-600 mb-4">Limites do mês</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {limitesComGasto.map(({ categoria, limite, gasto }) => {
                  const pct = limite > 0 ? (gasto / limite) * 100 : 0
                  const estourou = gasto > limite
                  const barra = estourou ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-green-500'
                  return (
                    <div key={categoria}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-600 capitalize">{categoria}</span>
                        <span className={estourou ? 'text-red-500 font-medium' : 'text-gray-500'}>
                          {formatCurrency(gasto)} / {formatCurrency(limite)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${barra}`} style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      {estourou && (
                        <p className="text-[11px] text-red-500 mt-0.5">estourou {formatCurrency(gasto - limite)}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
            <h2 className={`text-lg font-semibold mb-4 ${COR_CASAL}`}>Saldo do Casal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-1.5 text-gray-500">Total despesas do casal</td>
                    <td className="py-1.5 text-right font-medium">{formatCurrency(saldoCasal.total_casal)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-gray-500">Gabi pagou</td>
                    <td className="py-1.5 text-right">{formatCurrency(saldoCasal.gabi_pagou_casal)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-gray-500">Rafa pagou</td>
                    <td className="py-1.5 text-right">{formatCurrency(saldoCasal.rafa_pagou_casal)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-gray-500">Gabi deveria pagar (62,6%)</td>
                    <td className="py-1.5 text-right">{formatCurrency(saldoCasal.gabi_deveria_pagar)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-gray-500">Rafa deveria pagar (37,4%)</td>
                    <td className="py-1.5 text-right">{formatCurrency(saldoCasal.rafa_deveria_pagar)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex flex-col justify-center gap-2 text-sm">
                {saldoCasal.emprestimos_gabi_para_rafa > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Empréstimo Gabi → Rafa</span>
                    <span>{formatCurrency(saldoCasal.emprestimos_gabi_para_rafa)}</span>
                  </div>
                )}
                {saldoCasal.emprestimos_rafa_para_gabi > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Empréstimo Rafa → Gabi</span>
                    <span>{formatCurrency(saldoCasal.emprestimos_rafa_para_gabi)}</span>
                  </div>
                )}
                {saldoCasal.acertos_mes !== 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Acertos realizados</span>
                    <span>{formatCurrency(Math.abs(saldoCasal.acertos_mes))}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 text-gray-600">
                  {saldoCasal.quem_deve ? (
                    <>
                      Para fechar o mês,{' '}
                      <span className="font-semibold text-gray-800">{saldoCasal.quem_deve}</span> acerta{' '}
                      <span className="font-semibold text-gray-800">{formatCurrency(Math.abs(saldoCasal.saldo_final))}</span>{' '}
                      com {saldoCasal.quem_recebe}.
                    </>
                  ) : (
                    <span className="text-green-600 font-medium">Contas equilibradas 🙂</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link href="/registrar" className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
              + Registrar Transação
            </Link>
            <Link href={`/balanco/${mes}/${ano}`} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-medium transition-colors">
              Ver Balanço Completo
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">Transações Recentes</h2>
              <Link href="/historico" className="text-gray-600 text-sm hover:underline">Ver todas</Link>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Nenhuma transação registrada ainda.</p>
            ) : (
              <ul className="divide-y">
                {recentTransactions.map((t) => (
                  <li key={t.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {t.descricao}
                        {t.parcelas && t.parcelas >= 2 ? (
                          <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full align-middle">
                            {t.parcelas}x
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-gray-400">
                        {t.pessoa} · {t.tipo} · {getNomeMes(t.mes)}/{t.ano}
                      </p>
                    </div>
                    <span className={`font-semibold text-sm whitespace-nowrap ${t.tipo === 'entrada' ? COR_ENTRADA : COR_SAIDA}`}>
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
