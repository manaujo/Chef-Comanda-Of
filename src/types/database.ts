export type UserType = 'administrador' | 'garcom' | 'caixa' | 'estoque' | 'cozinha';
export type MesaStatus = 'livre' | 'ocupada' | 'reservada' | 'manutencao' | 'aguardando_pagamento';
export type ComandaStatus = 'aberta' | 'fechada' | 'cancelada' | 'em_preparo' | 'pronta';
export type ItemStatus = 'pendente' | 'recebido' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado' | 'enviado' | 'preparando';
export type AssinaturaStatus = 'ativa' | 'vencida' | 'cancelada' | 'suspensa';
export type AssinaturaTipo = 'mensal' | 'anual';
export type UnidadeMedida = 'kg' | 'g' | 'l' | 'ml' | 'un' | 'cx' | 'pct';
export type TipoAcao = 'criacao' | 'edicao' | 'exclusao' | 'cancelamento' | 'login' | 'logout';
export type CategoriaProduto = 'prato' | 'entrada' | 'bebida' | 'sobremesa';

export interface Profile {
  id: string;
  email: string;
  nome_completo: string;
  nome_restaurante: string;
  cpf: string;
  telefone: string;
  tipo: UserType;
  ativo: boolean;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  created_at: string;
  updated_at: string;
}

export interface Assinatura {
  id: string;
  user_id: string;
  status: AssinaturaStatus;
  tipo: AssinaturaTipo;
  valor: number;
  data_inicio: string;
  data_fim: string;
  data_pagamento?: string;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria_id?: string;
  categoria?: Categoria;
  categoria_produto: CategoriaProduto;
  foto?: string;
  foto_url?: string;
  ativo: boolean;
  tempo_preparo: number;
  created_at: string;
  updated_at: string;
}

export interface Insumo {
  id: string;
  nome: string;
  unidade: UnidadeMedida;
  preco_unitario: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  fornecedor?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProdutoInsumo {
  id: string;
  produto_id: string;
  insumo_id: string;
  quantidade_usada: number;
  produto?: Produto;
  insumo?: Insumo;
  created_at: string;
}

export interface Mesa {
  id: string;
  numero: number;
  nome?: string;
  capacidade: number;
  status: MesaStatus;
  qr_code?: string;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comanda {
  id: string;
  numero: number;
  mesa_id?: string;
  garcom_id?: string;
  garcom_funcionario_id?: string;
  status: ComandaStatus;
  observacoes?: string;
  data_abertura: string;
  data_fechamento?: string;
  valor_total: number;
  mesa?: Mesa;
  garcom?: {
    id: string;
    nome: string;
    cpf: string;
    tipo: UserType;
    ativo: boolean;
  };
  garcom_funcionario?: {
    id: string;
    nome: string;
    tipo: string;
    ativo: boolean;
  };
  itens?: ComandaItem[];
  created_at: string;
  updated_at: string;
}

export interface ComandaItem {
  id: string;
  comanda_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  status: ItemStatus;
  observacoes?: string;
  cancelado_por?: string;
  motivo_cancelamento?: string;
  produto?: Produto;
  created_at: string;
  updated_at: string;
}

export interface Turno {
  id: string;
  operador_id: string;
  operador_funcionario_id?: string;
  data_abertura: string;
  data_fechamento?: string;
  valor_inicial: number;
  valor_fechamento?: number;
  observacoes?: string;
  ativo: boolean;
  operador?: Profile;
  operador_funcionario?: {
    id: string;
    nome: string;
    tipo: string;
    ativo: boolean;
  };
  created_at: string;
}

export interface Venda {
  id: string;
  comanda_id: string;
  turno_id?: string;
  operador_id: string;
  valor_total: number;
  valor_desconto: number;
  valor_final: number;
  forma_pagamento: string;
  data_venda: string;
  comanda?: Comanda;
  turno?: Turno;
  operador?: Profile;
  created_at: string;
}

export interface Log {
  id: string;
  usuario_id?: string;
  tipo_acao: TipoAcao;
  tabela_afetada?: string;
  registro_id?: string;
  descricao: string;
  dados_anteriores?: any;
  dados_novos?: any;
  ip_address?: string;
  user_agent?: string;
  usuario?: Profile;
  created_at: string;
}