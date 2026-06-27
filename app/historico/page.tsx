'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Transaction, Pessoa, TipoTransacao } from '@/lib/types'
import { formatCurrency, getNomeMes } from '@/lib/calculations'

export default function HistoricoPage() {
  const now = new Date()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroMes, setFiltroMes] = useState<number | ''>('')
  const [filtroAno, setFiltroAno] = useState<number>(now.getFullYear())
  const [filtroPessoa, setFiltroPessoa] = useState<Pessoa | ''>('')
  const [filtroTipo, setFiltroTipo] = useState<TipoTransacao | ''>('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
    setTransactions((data as Transaction[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta transacao?')) return
    setDeletingId(id)
    await supabase.from('transactions').delete().eq('id', id)
    await load()
    setDeletingId(null)
  }

  const filtered = transactions.filter((t) => {
    if (filtroMes !== '' && t.mes !== filtroMes) return false
    if (filtroAno && t.ano !== filtroAno) return false
    if (filtroPessoa && t.pessoa !== filtroPessoa) return false
    if (filtroTipo && t.tipo !== filtroTipo) return false
    return true
  })

  const meses = Array.from({ length: 12 }, (_, i) => i + 1)
  const anos = [2024, 2025, 2026]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Historico</h1>
        <Link href="/registrar"
          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          + Nova Transacao
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-3">
        <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value === '' ? '' : Number(e.target.value))}
          className="border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-400 outline-none">
          <option value="">Todos os meses</option>
          {meses.map((m) => <option key={m} value={m}>{getNomeMes(m)}</option>)}
        </select>
        <select value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))}
          className="border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-400 outline-none">
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filtroPessoa} onChange={(e) => setFiltroPessoa(e.target.value as Pessoa | '')}
          className="border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-400 outline-none">
          <option value="">Todas as pessoas</option>
          <option value="Gabi">Gabi</option>
          <option value="Rafa">Rafa</option>
        </select>
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as TipoTransacao | '')}
          className="border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-rose-400 outline-none">
          <option value="">Todos os tipos</option>
          <option value="casal">Casal</option>
          <option value="pessoal">Pessoal</option>
          <option value="entrada">Entrada</option>
          <option value="emprestimo">Emprestimo</option>
          <option value="parcelado">Parcelado</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow">
          {filtered.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Nenhuma transacao encontrada.</p>
          ) : (
            <ul className="divide-y">
              {filtered.map((t) => (
                <li key={t.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800">{t.descricao}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.pessoa} · {t.tipo} · {getNomeMes(t.mes)}/{t.ano} · {t.forma_pagamento}
                      {t.categoria ? ` · ${t.categoria}` : ''}
                      {t.tipo === 'parcelado' ? ` · ${t.parcelas}x` : ''}
                      {t.tipo === 'emprestimo' && t.para_pessoa ? ` para ${t.para_pessoa}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`font-semibold text-sm ${t.tipo === 'entrada' ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(t.valor_total)}
                    </span>
                    <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id}
                      className="text-gray-400 hover:text-red-500 transition-colors text-xs disabled:opacity-50">
                      {deletingId === t.id ? '...' : 'X'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">{filtered.length} transacao(oes) encontrada(s)</p>
    </div>
  )
}
