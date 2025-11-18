/**
 * @summary
 * Stock movement business logic
 * Handles all movement operations through stored procedures
 *
 * @module services/movimentacao/movimentacaoRules
 */

import { dbRequest, ExpectedReturn } from '@/utils/database';
import {
  MovimentacaoCreateParams,
  MovimentacaoListParams,
  MovimentacaoGetParams,
  MovimentacaoEstornarParams,
  MovimentacaoCreateResult,
  MovimentacaoListResult,
  MovimentacaoDetailResult,
  MovimentacaoEstornoResult,
} from './movimentacaoTypes';

/**
 * @summary
 * Creates a new stock movement
 *
 * @function movimentacaoCreate
 * @module movimentacao
 *
 * @param {MovimentacaoCreateParams} params - Movement creation parameters
 * @param {number} params.idAccount - Account identifier
 * @param {number} params.idUser - User identifier
 * @param {number} params.idProduto - Product identifier
 * @param {number} params.tipoAcao - Movement type (0-4)
 * @param {number} params.quantidade - Quantity moved
 * @param {string} [params.descricao] - Movement description
 * @param {string} [params.referenciaOrigem] - Entry reference
 * @param {string} [params.motivoSaida] - Exit reason
 *
 * @returns {Promise<MovimentacaoCreateResult>} Created movement identifier
 *
 * @throws {ValidationError} When parameters fail validation
 * @throws {BusinessRuleError} When business rules are violated
 * @throws {DatabaseError} When database operation fails
 */
export async function movimentacaoCreate(
  params: MovimentacaoCreateParams
): Promise<MovimentacaoCreateResult> {
  const result = await dbRequest(
    '[functional].[spMovimentacaoCreate]',
    {
      idAccount: params.idAccount,
      idUsuario: params.idUser,
      idProduto: params.idProduto,
      tipoAcao: params.tipoAcao,
      quantidade: params.quantidade,
      descricao: params.descricao || null,
      referenciaOrigem: params.referenciaOrigem || null,
      motivoSaida: params.motivoSaida || null,
    },
    ExpectedReturn.Single
  );

  return result;
}

/**
 * @summary
 * Retrieves stock movement history with optional filtering
 *
 * @function movimentacaoList
 * @module movimentacao
 *
 * @param {MovimentacaoListParams} params - List parameters
 * @param {number} params.idAccount - Account identifier
 * @param {number} [params.idProduto] - Filter by product
 * @param {number} [params.tipoAcao] - Filter by movement type
 * @param {number} [params.idUsuario] - Filter by user
 * @param {string} [params.dataInicio] - Start date filter
 * @param {string} [params.dataFim] - End date filter
 * @param {number} [params.limite] - Result limit
 *
 * @returns {Promise<MovimentacaoListResult[]>} List of movements
 *
 * @throws {ValidationError} When parameters fail validation
 * @throws {DatabaseError} When database operation fails
 */
export async function movimentacaoList(
  params: MovimentacaoListParams
): Promise<MovimentacaoListResult[]> {
  const result = await dbRequest(
    '[functional].[spMovimentacaoList]',
    {
      idAccount: params.idAccount,
      idProduto: params.idProduto || null,
      tipoAcao: params.tipoAcao || null,
      idUsuario: params.idUsuario || null,
      dataInicio: params.dataInicio || null,
      dataFim: params.dataFim || null,
      limite: params.limite || 100,
    },
    ExpectedReturn.Multi
  );

  return result;
}

/**
 * @summary
 * Retrieves detailed information about a specific movement
 *
 * @function movimentacaoGet
 * @module movimentacao
 *
 * @param {MovimentacaoGetParams} params - Get parameters
 * @param {number} params.idAccount - Account identifier
 * @param {number} params.idMovimentacao - Movement identifier
 *
 * @returns {Promise<MovimentacaoDetailResult>} Movement details
 *
 * @throws {ValidationError} When parameters fail validation
 * @throws {DatabaseError} When database operation fails
 */
export async function movimentacaoGet(
  params: MovimentacaoGetParams
): Promise<MovimentacaoDetailResult> {
  const result = await dbRequest(
    '[functional].[spMovimentacaoGet]',
    {
      idAccount: params.idAccount,
      idMovimentacao: params.idMovimentacao,
    },
    ExpectedReturn.Single
  );

  return result;
}

/**
 * @summary
 * Reverses a stock movement by creating a counter-movement
 *
 * @function movimentacaoEstornar
 * @module movimentacao
 *
 * @param {MovimentacaoEstornarParams} params - Reversal parameters
 * @param {number} params.idAccount - Account identifier
 * @param {number} params.idUser - User performing reversal
 * @param {number} params.idMovimentacaoOriginal - Original movement identifier
 * @param {string} params.motivoEstorno - Reversal justification
 *
 * @returns {Promise<MovimentacaoEstornoResult>} Created reversal movement identifier
 *
 * @throws {ValidationError} When parameters fail validation
 * @throws {BusinessRuleError} When business rules are violated
 * @throws {DatabaseError} When database operation fails
 */
export async function movimentacaoEstornar(
  params: MovimentacaoEstornarParams
): Promise<MovimentacaoEstornoResult> {
  const result = await dbRequest(
    '[functional].[spMovimentacaoEstornar]',
    {
      idAccount: params.idAccount,
      idUsuario: params.idUser,
      idMovimentacaoOriginal: params.idMovimentacaoOriginal,
      motivoEstorno: params.motivoEstorno,
    },
    ExpectedReturn.Single
  );

  return result;
}
