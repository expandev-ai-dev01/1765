/**
 * @summary
 * Type definitions for stock status operations
 *
 * @module services/estoque/estoqueTypes
 */

/**
 * @interface EstoqueAtualGetParams
 * @description Parameters for retrieving current stock status
 *
 * @property {number} idAccount - Account identifier
 * @property {number} idProduto - Product identifier
 */
export interface EstoqueAtualGetParams {
  idAccount: number;
  idProduto: number;
}

/**
 * @interface EstoqueAtualResult
 * @description Current stock status information
 *
 * @property {number} idProduto - Product identifier
 * @property {number} quantidadeAtual - Current stock quantity
 * @property {Date | null} ultimaMovimentacao - Last movement timestamp
 * @property {number} status - Stock status (0-3)
 * @property {number} nivelMinimo - Minimum stock level
 */
export interface EstoqueAtualResult {
  idProduto: number;
  quantidadeAtual: number;
  ultimaMovimentacao: Date | null;
  status: number;
  nivelMinimo: number;
}
