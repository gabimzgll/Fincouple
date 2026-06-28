export type Pessoa = 'Gabi' | 'Rafa'
export type TipoTransacao = 'casal' | 'pessoal' | 'entrada' | 'emprestimo' | 'parcelado'
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

export const CATEGORIAS_CASAL = [
  'aluguel', 'condomínio', 'água', 'luz', 'gás', 'internet',
  'mercado', 'produtos de limpeza', 'higiene', 'remédios',
  'streaming', 'móveis', 'eletrodomésticos', 'reparos', 'compras domésticas', 'outros'
]

export const CATEGORIAS_PESSOAL = [
  'roupas', 'calçados', 'academia', 'cosméticos', 'lazer',
  'médico/dentista', 'curso', 'assinatura', 'transporte', 'alimentação', 'outros'
]

export const FORMAS_PAGAMENTO: FormaPagamento[] = [
  'cartão de crédito', 'cartão de débito', 'pix', 'boleto',
  'dinheiro', 'vale-alimentação', 'transferência'
]
