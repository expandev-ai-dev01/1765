/**
 * @summary
 * Stock status business logic
 * Handles current stock status queries
 *
 * @module services/estoque/estoqueRules
 */

import { dbRequest, ExpectedReturn } from '@/utils/database';
import { EstoqueAtualGetParams, EstoqueAtualResult } from './estoqueTypes';

/**
 * @summary
 * Calculates current stock status for a product
 *
 * @function estoqueAtualGet
 * @module estoque
 *
 * @param {EstoqueAtualGetParams} params - Query parameters
 * @param {number} params.idAccount - Account identifier
 * @param {number} params.idProduto - Product identifier
 *
 * @returns {Promise<EstoqueAtualResult>} Current stock status
 *
 * @throws {ValidationError} When parameters fail validation
 * @throws {DatabaseError} When database operation fails
 */
export async function estoqueAtualGet(params: EstoqueAtualGetParams): Promise<EstoqueAtualResult> {
  const result = await dbRequest(
    '[functional].[spEstoqueAtualGet]',
    {
      idAccount: params.idAccount,
      idProduto: params.idProduto,
    },
    ExpectedReturn.Single
  );

  return result;
}
