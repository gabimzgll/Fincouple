export type Pessoa = 'Gabi' | 'Rafa'
export type TipoTransacao = 'casal' | 'pessoal' | 'entrada' | 'emprestimo'
export type FormaPagamento =
  | 'cartão de crédito'
  | 'cartão de débito'
  | 'pix'
  | 'boleto'
  | 'dinheiro'
  | 'vale-alimentação'
  | 'transferência'

export interface Transaction {
  id: string
  created_at: string
  mes: number
  ano: number
  tipo: TipoTransacao
  pessoa: Pessoa
  descricao: string
  valor_total: number
  forma_pagamento: string
  categoria?: string
  parcelas?: number
  mes_inicio?: number
  ano_inicio?: number
  para_pessoa?: Pessoa
}

// Alias
export type Transacao = Transaction

export interface Acerto {
  id: string
  created_at: string
  mes: number
  ano: number
  valor: number
  quem_pagou: Pessoa
  descricao: string
}

export interface BalancoIndividual {
  pessoa: Pessoa
  entradas: number
  saidas: number
  saidas_por_metodo: Record<string, number>
  saidas_por_categoria: Record<string, number>
  sobra: number
}

export interface SaldoCasal {
  total_casal: number
  gabi_pagou_casal: number
  rafa_pagou_casal: number
  gabi_deveria_pagar: number
  rafa_deveria_pagar: number
  emprestimos_gabi_para_rafa: number
  emprestimos_rafa_para_gabi: number
  acertos_mes: number
  saldo_final: number
  quem_deve: Pessoa | null
  quem_recebe: Pessoa | null
}

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

// Lista única de categorias para gastos (pessoais e do casal)
export const CATEGORIAS = [
  'roupas/calçados', 'academia', 'farmácia', 'date do casal', 'saúde',
  'educação', 'assinatura', 'uber', 'mercado', 'ifood', 'aluguel',
  'condomínio', 'água', 'luz', 'gás', 'internet', 'celular', 'fiança',
  'reparos', 'compras domésticas', 'theo', 'presente', 'viagem', 'lazer', 'outros'
]

// Categorias das entradas
export const CATEGORIAS_ENTRADA = [
  'salário', 'mesada', 'freela', 'venda', 'rendimento', 'reembolso', 'presente', 'outros'
]

// Quais categorias de entrada contam como "renda extra"
export const RENDA_EXTRA_CATS = ['freela', 'venda', 'rendimento']

export const FORMAS_PAGAMENTO: FormaPagamento[] = [
  'cartão de crédito', 'cartão de débito', 'pix', 'boleto',
  'dinheiro', 'vale-alimentação', 'transferência'
]
