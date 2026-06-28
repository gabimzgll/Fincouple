'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Pessoa, TipoTransacao, Transaction, MESES, CATEGORIAS, CATEGORIAS_ENTRADA, FORMAS_PAGAMENTO } from '@/lib/types'

function RegistrarForm() {
  const router = useRouter()
  const params = useSearchParams()
  const editId = params.get('id')
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
  const [parcelado, setParcelado] = useState(false)
  const [parcelas, setParcelas] = useState('2')
  const [valorEParcela, setValorEParcela] = useState(true)

  useEffect(() => {
    if (!editId) return
    async function load() {
      const { data } = await supabase.from('transactions').select('*').eq('id', editId).single()
      if (!data) return
      const t = data as Transaction
      setTipo(t.tipo)
      setPessoa(t.pessoa)
      if (t.para_pessoa) setParaPessoa(t.para_pessoa)
      setDescricao(t.descricao)
      setFormaPagamento(t.forma_pagamento)
      setCategoria(t.categoria || '')
      setMes(t.mes_inicio || t.mes)
      setAno(t.ano_inicio || t.ano)
      if (t.parcelas && t.parcelas >= 2) {
        setParcelado(true)
        setParcelas(String(t.parcelas))
        setValor((t.valor_total / t.parcelas).toFixed(2))
        setValorEParcela(true)
      } else {
        setValor(String(t.valor_total))
      }
    }
    load()
  }, [editId])

  const ehGasto = tipo === 'casal' || tipo === 'pessoal'
  const categorias = tipo === 'entrada' ? CATEGORIAS_ENTRADA : CATEGORIAS
  const anos = Array.from({ length: 4 }, (_, i) => hoje.getFullYear() - 2 + i)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const v = parseFloat(valor.replace(',', '.'))
    const nParcelas = parseInt(parcelas)
    const usaParcela = ehGasto && parcelado && nParcelas >= 2
    const valorTotal = usaParcela && valorEParcela ? v * nParcelas : v

    const row: Record<string, unknown> = {
      tipo,
      pessoa,
      descricao,
      valor_total: valorTotal,
      forma_pagamento: formaPagamento,
      mes,
      ano,
      categoria: tipo === 'emprestimo' ? null : (categoria || null),
      parcelas: usaParcela ? nParcelas : null,
      mes_inicio: usaParcela ? mes : null,
      ano_inicio: usaParcela ? ano : null,
      para_pessoa: tipo === 'emprestimo' ? paraPessoa : null,
    }

    const { error } = editId
      ? await supabase.from('transactions').update(row).eq('id', editId)
      : await supabase.from('transactions').insert(row)

    setSaving(false)
    if (!error) {
      setSucesso(true)
      setTimeout(() => router.push(editId ? '/historico' : '/'), 1000)
    } else {
      alert('Erro ao salvar: ' + error.message)
    }
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-800">{editId ? 'Editar transação' : 'Registrar transação'}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Tipo</label>
          <div className="grid grid-cols-4 gap-2">
            {([
              { v: 'casal', l: '👫 Casal' },
              { v: 'pessoal', l: '👤 Pessoal' },
              { v: 'entrada', l: '💵 Entrada' },
              { v: 'emprestimo', l: '🤝 Empréstimo' },
            ] as { v: TipoTransacao; l: string }[]).map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => { setTipo(v); setCategoria('') }}
                className={`py-2 px-1 rounded-xl text-xs font-semibold transition-colors ${
                  tipo === v ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              {tipo === 'entrada' ? 'Quem recebeu' : 'Quem pagou'}
            </label>
            <div className="flex gap-2">
              {(['Gabi', 'Rafa'] as Pessoa[]).map(p => (
                <button key={p} type="button" onClick={() => setPessoa(p)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    pessoa === p
                      ? p === 'Gabi' ? 'bg-purple-400 text-white' : 'bg-[#006437] text-white'
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
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              {ehGasto && parcelado ? 'Mês da 1ª parcela' : 'Mês de referência'}
            </label>
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

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Descrição</label>
            <input
              type="text" required value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Ex: Mercado, Aluguel, Salário..."
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              {ehGasto && parcelado && valorEParcela ? 'Valor de cada parcela (R$)' : 'Valor (R$)'}
            </label>
            <input
              type="number" required min="0.01" step="0.01" value={valor}
              onChange={e => setValor(e.target.value)} placeholder="0,00"
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          {ehGasto && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={parcelado} onChange={e => setParcelado(e.target.checked)} className="rounded" />
                Parcelado (aparece nos próximos meses)
              </label>
              {parcelado && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Número de parcelas</label>
                    <input type="number" min="2" max="48" value={parcelas}
                      onChange={e => setParcelas(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={valorEParcela} onChange={e => setValorEParcela(e.target.checked)} className="rounded" />
                    O valor informado é o de cada parcela (não o total)
                  </label>
                  {valor && (
                    <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                      {valorEParcela
                        ? `Parcela: R$ ${parseFloat(valor || '0').toFixed(2)} · Total: R$ ${(parseFloat(valor || '0') * parseInt(parcelas || '2')).toFixed(2)}`
                        : `Total: R$ ${parseFloat(valor || '0').toFixed(2)} · Parcela: R$ ${(parseFloat(valor || '0') / parseInt(parcelas || '2')).toFixed(2)}`
                      }
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Forma de pagamento</label>
            <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400">
              {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {tipo !== 'emprestimo' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400">
                <option value="">— sem categoria —</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 rounded-2xl bg-gray-900 text-white font-bold text-base hover:bg-black transition-colors disabled:opacity-60">
          {saving ? 'Salvando...' : editId ? 'Salvar alterações' : 'Registrar transação'}
        </button>
      </form>

      {sucesso && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl">
            ✅ Salvo!
          </div>
        </div>
      )}
    </div>
  )
}

export default function Registrar() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">Carregando...</div>}>
      <RegistrarForm />
    </Suspense>
  )
}
