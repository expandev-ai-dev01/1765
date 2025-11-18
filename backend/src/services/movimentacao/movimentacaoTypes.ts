/**
 * @summary
 * Type definitions for stock movement operations
 *
 * @module services/movimentacao/movimentacaoTypes
 */

/**
 * @interface MovimentacaoCreateParams
 * @description Parameters for creating a stock movement
 *
 * @property {number} idAccount - Account identifier
 * @property {number} idUser - User identifier
 * @property {number} idProduto - Product identifier
 * @property {number} tipoAcao - Movement type (0-4)
 * @property {number} quantidade - Quantity moved
 * @property {string} [descricao] - Movement description
 * @property {string} [referenciaOrigem] - Entry reference
 * @property {string} [motivoSaida] - Exit reason
 */
export interface MovimentacaoCreateParams {
  idAccount: number;
  idUser: number;
  idProduto: number;
  tipoAcao: number;
  quantidade: number;
  descricao?: string;
  referenciaOrigem?: string;
  motivoSaida?: string;
}

/**
 * @interface MovimentacaoListParams
 * @description Parameters for listing stock movements
 *
 * @property {number} idAccount - Account identifier
 * @property {number} [idProduto] - Filter by product
 * @property {number} [tipoAcao] - Filter by movement type
 * @property {number} [idUsuario] - Filter by user
 * @property {string} [dataInicio] - Start date filter
 * @property {string} [dataFim] - End date filter
 * @property {number} [limite] - Result limit
 */
export interface MovimentacaoListParams {
  idAccount: number;
  idProduto?: number;
  tipoAcao?: number;
  idUsuario?: number;
  dataInicio?: string;
  dataFim?: string;
  limite?: number;
}

/**
 * @interface MovimentacaoGetParams
 * @description Parameters for retrieving a specific movement
 *
 * @property {number} idAccount - Account identifier
 * @property {number} idMovimentacao - Movement identifier
 */
export interface MovimentacaoGetParams {
  idAccount: number;
  idMovimentacao: number;
}

/**
 * @interface MovimentacaoEstornarParams
 * @description Parameters for reversing a movement
 *
 * @property {number} idAccount - Account identifier
 * @property {number} idUser - User performing reversal
 * @property {number} idMovimentacaoOriginal - Original movement identifier
 * @property {string} motivoEstorno - Reversal justification
 */
export interface MovimentacaoEstornarParams {
  idAccount: number;
  idUser: number;
  idMovimentacaoOriginal: number;
  motivoEstorno: string;
}

/**
 * @interface MovimentacaoCreateResult
 * @description Result of movement creation
 *
 * @property {number} idMovimentacao - Created movement identifier
 */
export interface MovimentacaoCreateResult {
  idMovimentacao: number;
}

/**
 * @interface MovimentacaoListResult
 * @description Movement list item
 *
 * @property {number} idMovimentacao - Movement identifier
 * @property {number} idProduto - Product identifier
 * @property {string} nomeProduto - Product name
 * @property {number} idUsuario - User identifier
 * @property {number} tipoAcao - Movement type
 * @property {number} quantidade - Quantity moved
 * @property {number} quantidadeAnterior - Previous quantity
 * @property {number} quantidadeNova - New quantity
 * @property {string | null} descricao - Movement description
 * @property {string | null} referenciaOrigem - Entry reference
 * @property {string | null} motivoSaida - Exit reason
 * @property {Date} timestamp - Movement timestamp
 * @property {boolean} estornada - Reversal flag
 * @property {number | null} idMovimentacaoEstorno - Reversal movement ID
 */
export interface MovimentacaoListResult {
  idMovimentacao: number;
  idProduto: number;
  nomeProduto: string;
  idUsuario: number;
  tipoAcao: number;
  quantidade: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
  descricao: string | null;
  referenciaOrigem: string | null;
  motivoSaida: string | null;
  timestamp: Date;
  estornada: boolean;
  idMovimentacaoEstorno: number | null;
}

/**
 * @interface MovimentacaoDetailResult
 * @description Detailed movement information
 *
 * @property {number} idMovimentacao - Movement identifier
 * @property {number} idProduto - Product identifier
 * @property {string} nomeProduto - Product name
 * @property {number} idUsuario - User identifier
 * @property {number} tipoAcao - Movement type
 * @property {number} quantidade - Quantity moved
 * @property {number} quantidadeAnterior - Previous quantity
 * @property {number} quantidadeNova - New quantity
 * @property {string | null} descricao - Movement description
 * @property {string | null} referenciaOrigem - Entry reference
 * @property {string | null} motivoSaida - Exit reason
 * @property {Date} timestamp - Movement timestamp
 * @property {boolean} estornada - Reversal flag
 * @property {number | null} idMovimentacaoEstorno - Reversal movement ID
 */
export interface MovimentacaoDetailResult {
  idMovimentacao: number;
  idProduto: number;
  nomeProduto: string;
  idUsuario: number;
  tipoAcao: number;
  quantidade: number;
  quantidadeAnterior: number;
  quantidadeNova: number;
  descricao: string | null;
  referenciaOrigem: string | null;
  motivoSaida: string | null;
  timestamp: Date;
  estornada: boolean;
  idMovimentacaoEstorno: number | null;
}

/**
 * @interface MovimentacaoEstornoResult
 * @description Result of movement reversal
 *
 * @property {number} idMovimentacaoEstorno - Created reversal movement identifier
 */
export interface MovimentacaoEstornoResult {
  idMovimentacaoEstorno: number;
}

/**
 * @enum MovimentacaoTipoAcao
 * @description Movement action types
 */
export enum MovimentacaoTipoAcao {
  ADICAO_PRODUTO = 0,
  ALTERACAO_QUANTIDADE = 1,
  ENTRADA = 2,
  SAIDA = 3,
  EXCLUSAO = 4,
}

/**
 * @enum EstoqueStatus
 * @description Stock status values
 */
export enum EstoqueStatus {
  DISPONIVEL = 0,
  BAIXO = 1,
  ESGOTADO = 2,
  EXCLUIDO = 3,
}
