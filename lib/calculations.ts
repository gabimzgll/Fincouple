import { Transaction, Acerto, BalancoIndividual, SaldoCasal, Pessoa, MESES } from './types'

export const GABI_PERCENTUAL = 0.626
export const RAFA_PERCENTUAL = 0.374

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function getNomeMes(mes: number): string {
  return MESES[mes - 1] || ''
}

export function getEffectiveTransactions(
  transacoes: Transaction[],
  mes: number,
  ano: number
): { transaction: Transaction; valor: number }[] {
  return transacoes
    .filter(t => aplicaNoMes(t, mes, ano))
    .map(t => ({
      transaction: t,
      valor: t.tipo === 'parcelado' && t.parcelas ? t.valor_total / t.parcelas : t.valor_total,
    }))
}

export function getInstallmentValueForMonth(t: Transaction, mes: number, ano: number): number | null {
  if (t.tipo !== 'parcelado' || !t.parcelas || !t.mes_inicio || !t.ano_inicio) return null
  for (let i = 0; i < t.parcelas; i++) {
    let m = t.mes_inicio + i
    let a = t.ano_inicio
    while (m > 12) { m -= 12; a++ }
    if (m === mes && a === ano) return t.valor_total / t.parcelas
  }
  return null
}

// Returns the effective value of a transaction in a given month
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function valorNoMes(t: Transaction, _mes: number, _ano: number): number {
  if (t.tipo === 'parcelado' && t.parcelas && t.mes_inicio && t.ano_inicio) {
    return t.valor_total / t.parcelas
  }
  return t.valor_total
}

// Checks if a transaction applies to a given month/year
export function aplicaNoMes(t: Transaction, mes: number, ano: number): boolean {
  if (t.tipo === 'parcelado' && t.parcelas && t.mes_inicio && t.ano_inicio) {
    for (let i = 0; i < t.parcelas; i++) {
      let m = t.mes_inicio + i
      let a = t.ano_inicio
      while (m > 12) { m -= 12; a++ }
      if (m === mes && a === ano) return true
    }
    return false
  }
  return t.mes === mes && t.ano === ano
}

export function transacoesDoMes(transacoes: Transaction[], mes: number, ano: number): Transaction[] {
  return transacoes.filter(t => aplicaNoMes(t, mes, ano))
}

export function calcularBalancoIndividual(
  transacoes: Transaction[],
  acertos: Acerto[],
  pessoa: Pessoa,
  mes: number,
  ano: number
): BalancoIndividual {
  const tx = transacoesDoMes(transacoes, mes, ano).filter(t => t.pessoa === pessoa)

  let entradas = 0
  let saidas = 0
  const saidas_por_metodo: Record<string, number> = {}
  const saidas_por_categoria: Record<string, number> = {}

  for (const t of tx) {
    const valor = valorNoMes(t, mes, ano)
    if (t.tipo === 'entrada') {
      entradas += valor
    } else {
      saidas += valor
      saidas_por_metodo[t.forma_pagamento] = (saidas_por_metodo[t.forma_pagamento] || 0) + valor
      const cat = t.categoria || 'sem categoria'
      saidas_por_categoria[cat] = (saidas_por_categoria[cat] || 0) + valor
    }
  }

  return { pessoa, entradas, saidas, saidas_por_metodo, saidas_por_categoria, sobra: entradas - saidas }
}

export function calcularGastosPessoaisPorCategoria(
  transacoes: Transaction[],
  pessoa: Pessoa,
  mes: number,
  ano: number
): Record<string, number> {
  const tx = transacoesDoMes(transacoes, mes, ano).filter(t => t.pessoa === pessoa && t.tipo === 'pessoal')
  const por_categoria: Record<string, number> = {}
  for (const t of tx) {
    const cat = t.categoria || 'sem categoria'
    por_categoria[cat] = (por_categoria[cat] || 0) + valorNoMes(t, mes, ano)
  }
  return por_categoria
}

export function calcularGastosCasalPorCategoria(
  transacoes: Transaction[],
  mes: number,
  ano: number
): Record<string, number> {
  const tx = transacoesDoMes(transacoes, mes, ano).filter(t => t.tipo === 'casal')
  const por_categoria: Record<string, number> = {}
  for (const t of tx) {
    const cat = t.categoria || 'sem categoria'
    por_categoria[cat] = (por_categoria[cat] || 0) + valorNoMes(t, mes, ano)
  }
  return por_categoria
}

// Balanço proporcional: custo real de cada pessoa = gastos pessoais
// (pessoal + parcelado) + a fatia que lhe cabe nos gastos do casal
// (Gabi 62,6% / Rafa 37,4%). Empréstimos não entram (são transferência,
// não consumo).
export interface BalancoProporcional {
  pessoa: Pessoa
  entradas: number
  gastos_pessoais: number
  parte_casal: number
  saidas: number
  sobra: number
}

export function calcularBalancoProporcional(
  transacoes: Transaction[],
  pessoa: Pessoa,
  mes: number,
  ano: number
): BalancoProporcional {
  const tx = transacoesDoMes(transacoes, mes, ano)
  let entradas = 0
  let gastos_pessoais = 0
  let total_casal = 0

  for (const t of tx) {
    const valor = valorNoMes(t, mes, ano)
    if (t.tipo === 'casal') {
      total_casal += valor
    } else if (t.pessoa === pessoa) {
      if (t.tipo === 'entrada') entradas += valor
      else if (t.tipo === 'pessoal' || t.tipo === 'parcelado') gastos_pessoais += valor
    }
  }

  const percent = pessoa === 'Gabi' ? GABI_PERCENTUAL : RAFA_PERCENTUAL
  const parte_casal = total_casal * percent
  const saidas = gastos_pessoais + parte_casal

  return { pessoa, entradas, gastos_pessoais, parte_casal, saidas, sobra: entradas - saidas }
}

export function calcularSaldoCasal(
  transacoes: Transaction[],
  acertos: Acerto[],
  mes: number,
  ano: number
): SaldoCasal {
  const tx = transacoesDoMes(transacoes, mes, ano)

  let gabiPagouCasal = 0
  let rafaPagouCasal = 0
  let emprestimosGabiParaRafa = 0
  let emprestimosRafaParaGabi = 0

  for (const t of tx) {
    const valor = valorNoMes(t, mes, ano)
    if (t.tipo === 'casal') {
      if (t.pessoa === 'Gabi') gabiPagouCasal += valor
      else rafaPagouCasal += valor
    } else if (t.tipo === 'emprestimo') {
      if (t.pessoa === 'Gabi' && t.para_pessoa === 'Rafa') emprestimosGabiParaRafa += valor
      if (t.pessoa === 'Rafa' && t.para_pessoa === 'Gabi') emprestimosRafaParaGabi += valor
    }
  }

  const totalCasal = gabiPagouCasal + rafaPagouCasal
  const gabiDeveria = totalCasal * GABI_PERCENTUAL
  const rafaDeveria = totalCasal * RAFA_PERCENTUAL

  // Positive = person overpaid → they're owed money
  const gabiSaldo = gabiPagouCasal - gabiDeveria

  // Net: positive = Rafa owes Gabi; negative = Gabi owes Rafa
  const netEmprestimos = emprestimosGabiParaRafa - emprestimosRafaParaGabi
  const netTotal = gabiSaldo + netEmprestimos

  const acertosMes = acertos
    .filter(a => a.mes === mes && a.ano === ano)
    .reduce((sum, a) => {
      if (a.quem_pagou === 'Rafa') return sum + a.valor
      return sum - a.valor
    }, 0)

  const saldoFinal = netTotal - acertosMes

  return {
    total_casal: totalCasal,
    gabi_pagou_casal: gabiPagouCasal,
    rafa_pagou_casal: rafaPagouCasal,
    gabi_deveria_pagar: gabiDeveria,
    rafa_deveria_pagar: rafaDeveria,
    emprestimos_gabi_para_rafa: emprestimosGabiParaRafa,
    emprestimos_rafa_para_gabi: emprestimosRafaParaGabi,
    acertos_mes: acertosMes,
    saldo_final: saldoFinal,
    quem_deve: saldoFinal > 0.005 ? 'Rafa' : saldoFinal < -0.005 ? 'Gabi' : null,
    quem_recebe: saldoFinal > 0.005 ? 'Gabi' : saldoFinal < -0.005 ? 'Rafa' : null,
  }
}
