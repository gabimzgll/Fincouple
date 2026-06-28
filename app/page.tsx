'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Transaction, Acerto, CATEGORIAS_CASAL, CATEGORIAS_PESSOAL } from '@/lib/types'
import {
  calcularBalancoProporcional,
  calcularSaldoCasal,
  calcularGastosCasalPorCategoria,
  calcularGastosPessoaisPorCategoria,
  calcularRendaExtra,
  formatCurrency,
  getNomeMes,
} from '@/lib/calculations'

// Paleta usada nos gráficos (sem dependência externa)
const PALETTE = [
  '#fb7185', '#fbbf24', '#a78bfa', '#34d399', '#38bdf8', '#fb923c',
  '#f472b6', '#2dd4bf', '#818cf8', '#a3e635', '#e879f9', '#22d3ee',
  '#f87171', '#c084fc', '#4ade80', '#60a5fa', '#facc15', '#2563eb',
  '#16a34a', '#db2777', '#ea580c', '#7c3aed', '#0d9488', '#65a30d',
  '#dc2626', '#0891b2', '#9333ea', '#ca8a04',
]

// Mapa fixo categoria -> cor, para a mesma categoria ter a mesma cor nos 3 gráficos
const ALL_CATEGORIAS = Array.from(new Set([...CATEGORIAS_PESSOAL, ...CATEGORIAS_CASAL, 'sem categoria']))
function colorForCategory(cat: string): string {
  const idx = ALL_CATEGORIAS.indexOf(cat)
  if (idx === -1) return '#cbd5e1'
  return PALETTE[idx % PALETTE.length]
}

// ---- Helpers de comparação mês a mês ----
function variacao(atual: number, anterior: number): { pct: number | null; subiu: boolean } {
  if (anterior === 0) return { pct: atual === 0 ? 0 : null, subiu: atual > 0 }
  const pct = ((atual - anterior) / anterior) * 100
  return { pct, subiu: pct >= 0 }
}

function Delta({ atual, anterior, gastoEhRuim = false }: { atual: number; anterior: number; gastoEhRuim?: boolean }) {
  const { pct, subiu } = variacao(atual, anterior)
  if (pct === null) return <span className="text-[11px] text-gray-400">novo</span>
  if (pct === 0) return <span className="text-[11px] text-gray-400">igual ao mês anterior</span>
  // Para gastos, subir é ruim (vermelho). Para sobra/entradas, subir é bom (verde).
  const bom = gastoEhRuim ? !subiu : subiu
  const cor = bom ? 'text-green-600' : 'text-red-500'
  const seta = subiu ? '▲' : '▼'
  return (
    <span className={`text-[11px] font-medium ${cor}`}>
      {seta} {Math.abs(pct).toFixed(0)}% vs. mês anterior
    </span>
  )
}

// ---- Card de KPI no topo ----
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

// ---- Gráfico de pizza (rosca) em CSS puro, cores fixas por categoria ----
function PieCard({ title, data, border }: { title: string; data: Record<string, number>; border: string }) {
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
      <h2 className="text-base font-semibold text-gray-700 mb-3">{title}</h2>
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

  // Mês selecionado
  const gabiBalanco = calcularBalancoProporcional(transactions, 'Gabi', mes, ano)
  const rafaBalanco = calcularBalancoProporcional(transactions, 'Rafa', mes, ano)
  const saldoCasal = calcularSaldoCasal(transactions, acertos, mes, ano)
  const casalPorCategoria = calcularGastosCasalPorCategoria(transactions, mes, ano)
  const gabiPessoalPorCategoria = calcularGastosPessoaisPorCategoria(transactions, 'Gabi', mes, ano)
  const rafaPessoalPorCategoria = calcularGastosPessoaisPorCategoria(transactions, 'Rafa', mes, ano)
  const rendaExtra = calcularRendaExtra(transactions, mes, ano)

  // Mês anterior (para comparação)
  const prevMes = mes === 1 ? 12 : mes - 1
  const prevAno = mes === 1 ? ano - 1 : ano
  const gabiPrev = calcularBalancoProporcional(transactions, 'Gabi', prevMes, prevAno)
  const rafaPrev = calcularBalancoProporcional(transactions, 'Rafa', prevMes, prevAno)
  const rendaExtraPrev = calcularRendaExtra(transactions, prevMes, prevAno)

  // Totais do casal (somando as duas pessoas)
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

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <>
          {/* KPIs do mês com comparação */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Entrou no mês" valor={entradasTotal} anterior={entradasPrev} cor="text-green-600" />
            <KpiCard label="Saiu no mês" valor={saidasTotal} anterior={saidasPrev} cor="text-red-500" gastoEhRuim />
            <KpiCard label="Sobrou" valor={sobraTotal} anterior={sobraPrev} cor={sobraTotal >= 0 ? 'text-green-600' : 'text-red-500'} />
            <KpiCard label="Renda extra" valor={rendaExtra} anterior={rendaExtraPrev} cor="text-emerald-600" />
          </div>

          {/* Balanços individuais (proporcional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow p-5 border border-rose-100">
              <h2 className="text-lg font-semibold text-rose-600 mb-3">Balanço da Gabi</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Entradas</span>
                  <span className="text-green-600 font-medium">{formatCurrency(gabiBalanco.entradas)}</span>
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
                  <span className="text-red-500 font-medium">{formatCurrency(gabiBalanco.saidas)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold items-center">
                  <span>Sobra</span>
                  <div className="text-right">
                    <span className={gabiBalanco.sobra >= 0 ? 'text-green-600' : 'text-red-500'}>
                      {formatCurrency(gabiBalanco.sobra)}
                    </span>
                    <div><Delta atual={gabiBalanco.sobra} anterior={gabiPrev.sobra} /></div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center bg-rose-50 rounded-lg px-3 py-2">
                  <span className="text-gray-600">💳 Fatura do cartão</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(gabiBalanco.fatura_cartao)}</span>
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
                  <span className="text-red-500 font-medium">{formatCurrency(rafaBalanco.saidas)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold items-center">
                  <span>Sobra</span>
                  <div className="text-right">
                    <span className={rafaBalanco.sobra >= 0 ? 'text-green-600' : 'text-red-500'}>
                      {formatCurrency(rafaBalanco.sobra)}
                    </span>
                    <div><Delta atual={rafaBalanco.sobra} anterior={rafaPrev.sobra} /></div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center bg-blue-50 rounded-lg px-3 py-2">
                  <span className="text-gray-600">💳 Fatura do cartão</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(rafaBalanco.fatura_cartao)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Saldo do casal */}
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

          {/* Gráficos de pizza por categoria (cores fixas por categoria) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PieCard title="Gabi — gastos pessoais" data={gabiPessoalPorCategoria} border="border-rose-100" />
            <PieCard title="Rafa — gastos pessoais" data={rafaPessoalPorCategoria} border="border-violet-100" />
            <PieCard title="Casal — gastos compartilhados" data={casalPorCategoria} border="border-amber-100" />
          </div>

          {/* Ações */}
          <div className="flex gap-3 flex-wrap">
            <Link href="/registrar" className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors">
              + Registrar Transação
            </Link>
            <Link href="/registrar?tipo=acerto" className="bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 px-5 py-2.5 rounded-xl font-medium transition-colors">
              Registrar Acerto
            </Link>
            <Link href={`/balanco/${mes}/${ano}`} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-medium transition-colors">
              Ver Balanço Completo
            </Link>
          </div>

          {/* Transações recentes */}
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
                      <p className="font-medium text-gray-800 truncate">
                        {t.descricao}
                        {t.tipo === 'parcelado' && t.parcelas ? (
                          <span className="ml-2 text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full align-middle">
                            {t.parcelas}x
                          </span>
                        ) : null}
                      </p>
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
