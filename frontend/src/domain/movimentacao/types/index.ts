export interface Movimentacao {
  idMovimentacao: number;
  timestamp: string;
  tipoAcao: number;
  idProduto: number;
  quantidade: number;
  quantidadeAnterior: number | null;
  quantidadeNova: number | null;
  idUsuario: number;
  descricao: string | null;
  referenciaOrigem: string | null;
  motivoSaida: string | null;
  estornado: boolean;
  idMovimentacaoEstorno: number | null;
}

export interface CreateMovimentacaoDto {
  idProduto: number;
  tipoAcao: number;
  quantidade: number;
  descricao?: string;
  referenciaOrigem?: string;
  motivoSaida?: string;
}

export interface MovimentacaoListParams {
  idProduto?: number;
  tipoAcao?: number;
  idUsuario?: number;
  dataInicio?: string;
  dataFim?: string;
  limite?: number;
}

export interface EstornarMovimentacaoDto {
  id: number;
  motivoEstorno: string;
}

export enum TipoAcao {
  ADICAO_PRODUTO = 0,
  ALTERACAO_QUANTIDADE = 1,
  ENTRADA = 2,
  SAIDA = 3,
  EXCLUSAO = 4,
}

export const TIPO_ACAO_LABELS: Record<TipoAcao, string> = {
  [TipoAcao.ADICAO_PRODUTO]: 'Adição de Produto',
  [TipoAcao.ALTERACAO_QUANTIDADE]: 'Alteração de Quantidade',
  [TipoAcao.ENTRADA]: 'Entrada',
  [TipoAcao.SAIDA]: 'Saída',
  [TipoAcao.EXCLUSAO]: 'Exclusão',
};
