'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Pessoa, TipoTransacao, MESES, CATEGORIAS_CASAL, CATEGORIAS_PESSOAL, FORMAS_PAGAMENTO } from '@/lib/types'

export default function Registrar() {
  const router = useRouter()
  const hoje = new Date()
  const [saving, setSaving] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const [tipo, setTipo] = useState<TipoTransacao>('casal')
  const [pessoa, setPessoa] = useState<Pessoa>('Gabi')
  const [paraPessoa, setParaPessoa] = useState<Pessoa>('Rafa')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('cartão de crédito')
  const [categoria, setCategoria] = useState('')
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [parcelas, setParcelas] = useState('2')
  const [valorEParcela, setValorEParcela] = useState(false)

  const categorias = tipo === 'casal' ? CATEGORIAS_CASAL : CATEGORIAS_PESSOAL
  const anos = Array.from({ length: 3 }, (_, i) => hoje.getFullYear() - 1 + i)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const v = parseFloat(valor.replace(',', '.'))
    const nParcelas = parseInt(parcelas)
    const valorTotal = tipo === 'parcelado' && valorEParcela ? v * nParcelas : v

    const row: Record<string, unknown> = {
      tipo,
      pessoa,
      descricao,
      valor_total: valorTotal,
      forma_pagamento: formaPagamento,
      mes,
      ano,
    }

    if (categoria) row.categoria = categoria
    if (tipo === 'parcelado') {
      row.parcelas = nParcelas
      row.mes_inicio = mes
      row.ano_inicio = ano
    }
    if (tipo === 'emprestimo') {
      row.para_pessoa = paraPessoa
    }

    const { error } = await supabase.from('transactions').insert(row)

    setSaving(false)
    if (!error) {
      setSucesso(true)
      setTimeout(() => router.push('/'), 1200)
    } else {
      alert('Erro ao salvar: ' + error.message)
    }
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-800">Registrar transação</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm">
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: 'casal', l: '👫 Casal' },
              { v: 'pessoal', l: '👤 Pessoal' },
              { v: 'entrada', l: '💵 Entrada' },
              { v: 'emprestimo', l: '🤝 Empréstimo' },
              { v: 'parcelado', l: '💳 Parcelado' },
            ] as { v: TipoTransacao; l: string }[]).map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => setTipo(v)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-colors ${
                  tipo === v ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Pessoa + Mês */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Quem pagou</label>
            <div className="flex gap-2">
              {(['Gabi', 'Rafa'] as Pessoa[]).map(p => (
                <button key={p} type="button" onClick={() => setPessoa(p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    pessoa === p
                      ? p === 'Gabi' ? 'bg-rose-500 text-white' : 'bg-violet-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >{p}</button>
              ))}
            </div>
          </div>

          {tipo === 'emprestimo' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Para quem</label>
              <div className="flex gap-2">
                {(['Gabi', 'Rafa'] as Pessoa[]).map(p => (
                  <button key={p} type="button" onClick={() => setParaPessoa(p)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      paraPessoa === p ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >{p}</button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Mês de referência</label>
            <div className="flex gap-2">
              <select value={mes} onChange={e => setMes(+e.target.value)}
                className="flex-1 py-2 px-3 rounded-xl border border-gray-200 text-sm">
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={ano} onChange={e => setAno(+e.target.value)}
                className="py-2 px-3 rounded-xl border border-gray-200 text-sm">
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Detalhes */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Descrição</label>
            <input
              type="text" required value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Mercado, Aluguel, Netflix..."
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              {tipo === 'parcelado' && valorEParcela ? 'Valor de cada parcela (R$)' : 'Valor (R$)'}
            </label>
            <input
              type="number" required min="0.01" step="0.01" value={valor}
              onChange={e => setValor(e.target.value)} placeholder="0,00"
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300"
            />
          </div>

          {tipo === 'parcelado' && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Número de parcelas</label>
                <input type="number" min="2" max="48" value={parcelas}
                  onChange={e => setParcelas(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={valorEParcela} onChange={e => setValorEParcela(e.target.checked)} className="rounded" />
                O valor informado é o de cada parcela (não o total)
              </label>
              {valor && (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                  {valorEParcela
                    ? `Parcela: R$ ${parseFloat(valor).toFixed(2)} · Total: R$ ${(parseFloat(valor) * parseInt(parcelas || '2')).toFixed(2)}`
                    : `Total: R$ ${parseFloat(valor).toFixed(2)} · Parcela: R$ ${(parseFloat(valor) / parseInt(parcelas || '2')).toFixed(2)}`
                  }
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Forma de pagamento</label>
            <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300">
              {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {(['casal', 'pessoal', 'parcelado'] as TipoTransacao[]).includes(tipo) && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-300">
                <option value="">— sem categoria —</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 rounded-2xl bg-rose-500 text-white font-bold text-base hover:bg-rose-600 transition-colors disabled:opacity-60">
          {saving ? 'Salvando...' : 'Registrar transação'}
        </button>
      </form>

      {sucesso && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl">
            ✅ Registrado!
          </div>
        </div>
      )}
    </div>
  )
}
