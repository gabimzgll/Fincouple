'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIAS, Limite, Meta } from '@/lib/types'
import { formatCurrency } from '@/lib/calculations'

export default function PlanejamentoPage() {
  const [limites, setLimites] = useState<Record<string, string>>({})
  const [metas, setMetas] = useState<Meta[]>([])
  const [loading, setLoading] = useState(true)
  const [salvandoLimites, setSalvandoLimites] = useState(false)
  const [okLimites, setOkLimites] = useState(false)

  const [titulo, setTitulo] = useState('')
  const [valorAlvo, setValorAlvo] = useState('')
  const [valorAtual, setValorAtual] = useState('')
  const [prazo, setPrazo] = useState('')

  async function load() {
    setLoading(true)
    const [{ data: lim }, { data: mts }] = await Promise.all([
      supabase.from('limites').select('*'),
      supabase.from('metas').select('*').order('created_at', { ascending: true }),
    ])
    const map: Record<string, string> = {}
    ;((lim as Limite[]) || []).forEach(l => { map[l.categoria] = String(l.valor) })
    setLimites(map)
    setMetas((mts as Meta[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function salvarLimites() {
    setSalvandoLimites(true)
    const rows = Object.entries(limites)
      .map(([categoria, v]) => ({ categoria, valor: parseFloat((v || '').replace(',', '.')) }))
      .filter(r => r.valor && r.valor > 0)
    await supabase.from('limites').delete().neq('categoria', '___')
    if (rows.length) await supabase.from('limites').insert(rows)
    setSalvandoLimites(false)
    setOkLimites(true)
    setTimeout(() => setOkLimites(false), 1500)
  }

  async function addMeta(e: React.FormEvent) {
    e.preventDefault()
    const row = {
      titulo,
      valor_alvo: parseFloat(valorAlvo.replace(',', '.')) || 0,
      valor_atual: parseFloat((valorAtual || '0').replace(',', '.')) || 0,
      prazo: prazo || null,
    }
    const { error } = await supabase.from('metas').insert(row)
    if (!error) {
      setTitulo(''); setValorAlvo(''); setValorAtual(''); setPrazo('')
      load()
    } else {
      alert('Erro ao salvar meta: ' + error.message)
    }
  }

  async function atualizarMetaAtual(id: string, novo: string) {
    const valor = parseFloat((novo || '0').replace(',', '.')) || 0
    setMetas(ms => ms.map(m => m.id === id ? { ...m, valor_atual: valor } : m))
    await supabase.from('metas').update({ valor_atual: valor }).eq('id', id)
  }

  async function deleteMeta(id: string) {
    if (!confirm('Excluir esta meta?')) return
    await supabase.from('metas').delete().eq('id', id)
    load()
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Carregando...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Planejamento</h1>

      <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-amber-600">Limites por categoria</h2>
          <button onClick={salvarLimites} disabled={salvandoLimites}
            className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
            {salvandoLimites ? 'Salvando...' : okLimites ? '✅ Salvo' : 'Salvar limites'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Defina um teto mensal por categoria (deixe em branco as que não quer acompanhar).</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {CATEGORIAS.map(cat => (
            <div key={cat} className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-600 capitalize">{cat}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">R$</span>
                <input
                  type="number" min="0" step="0.01" placeholder="—"
                  value={limites[cat] ?? ''}
                  onChange={e => setLimites(l => ({ ...l, [cat]: e.target.value }))}
                  className="w-24 py-1.5 px-2 rounded-lg border border-gray-200 text-sm text-right focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
        <h2 className="text-lg font-semibold text-amber-600 mb-4">Metas e objetivos</h2>

        {metas.length === 0 ? (
          <p className="text-gray-400 text-sm mb-4">Nenhuma meta ainda. Adicione abaixo 👇</p>
        ) : (
          <ul className="space-y-4 mb-6">
            {metas.map(m => {
              const pct = m.valor_alvo > 0 ? Math.min(100, (m.valor_atual / m.valor_alvo) * 100) : 0
              const concluida = m.valor_atual >= m.valor_alvo && m.valor_alvo > 0
              return (
                <li key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-800">
                      {m.titulo}
                      {m.prazo ? <span className="text-xs text-gray-400 ml-2">· {m.prazo}</span> : null}
                    </span>
                    <button onClick={() => deleteMeta(m.id)} className="text-gray-300 hover:text-red-500 text-xs">excluir</button>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${concluida ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span>Guardado: R$</span>
                      <input
                        type="number" min="0" step="0.01"
                        defaultValue={m.valor_atual}
                        onBlur={e => atualizarMetaAtual(m.id, e.target.value)}
                        className="w-24 py-1 px-2 rounded-lg border border-gray-200 text-right focus:outline-none focus:border-gray-400"
                      />
                    </span>
                    <span>de {formatCurrency(m.valor_alvo)} · {pct.toFixed(0)}%{concluida ? ' 🎉' : ''}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <form onSubmit={addMeta} className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-sm font-semibold text-gray-600">Nova meta</p>
          <input type="text" required value={titulo} onChange={e => setTitulo(e.target.value)}
            placeholder="Ex: Reserva de emergência, Viagem Europa..."
            className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-gray-500 mb-1">Valor alvo (R$)</label>
              <input type="number" required min="0.01" step="0.01" value={valorAlvo} onChange={e => setValorAlvo(e.target.value)}
                placeholder="0,00" className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-gray-500 mb-1">Já guardado (R$)</label>
              <input type="number" min="0" step="0.01" value={valorAtual} onChange={e => setValorAtual(e.target.value)}
                placeholder="0,00" className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs text-gray-500 mb-1">Prazo (opcional)</label>
              <input type="text" value={prazo} onChange={e => setPrazo(e.target.value)}
                placeholder="Ex: Dez/2026" className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
            </div>
          </div>
          <button type="submit"
            className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
            + Adicionar meta
          </button>
        </form>
      </div>
    </div>
  )
}
