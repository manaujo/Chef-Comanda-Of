import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos do banco de dados
export interface Empresa {
  id: string
  nome: string
  user_id: string
  created_at: string
}

export interface Mesa {
  id: string
  numero: number
  status: 'livre' | 'ocupada' | 'aguardando_pagamento'
  empresa_id: string
  created_at: string
}

export interface Funcionario {
  id: string
  nome: string
  funcao: 'garcom' | 'cozinheiro' | 'caixa'
  empresa_id: string
  created_at: string
}

export interface Produto {
  id: string
  nome: string
  preco: number
  categoria: string
  empresa_id: string
  ativo: boolean
  created_at: string
}

export interface Comanda {
  id: string
  mesa_id: string
  funcionario_id: string
  status: 'aberta' | 'enviada' | 'finalizada'
  total: number
  empresa_id: string
  created_at: string
}

export interface ComandaItem {
  id: string
  comanda_id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  observacoes?: string
  status: 'pendente' | 'preparando' | 'pronto'
  created_at: string
}

export interface Venda {
  id: string
  comanda_id: string
  total: number
  forma_pagamento: 'dinheiro' | 'cartao' | 'pix'
  empresa_id: string
  created_at: string
}

export interface Estoque {
  id: string
  nome: string
  quantidade: number
  minimo: number
  unidade: string
  empresa_id: string
  created_at: string
}