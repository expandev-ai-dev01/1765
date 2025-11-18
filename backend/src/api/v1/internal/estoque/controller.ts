/**
 * @summary
 * Stock status controller
 * Handles current stock status queries
 *
 * @module api/v1/internal/estoque/controller
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  CrudController,
  errorResponse,
  StatusGeneralError,
  successResponse,
} from '@/middleware/crud';
import { estoqueAtualGet } from '@/services/estoque';

const securable = 'ESTOQUE';

const getSchema = z.object({
  idProduto: z.coerce.number().int().positive(),
});

/**
 * @api {get} /api/v1/internal/estoque/:idProduto Get Current Stock
 * @apiName GetEstoqueAtual
 * @apiGroup Estoque
 * @apiVersion 1.0.0
 *
 * @apiDescription Calculates current stock status for a product
 *
 * @apiParam {Number} idProduto Product identifier
 *
 * @apiSuccess {Number} idProduto Product identifier
 * @apiSuccess {Number} quantidadeAtual Current stock quantity
 * @apiSuccess {DateTime} ultimaMovimentacao Last movement timestamp
 * @apiSuccess {Number} status Stock status (0-3)
 * @apiSuccess {Number} nivelMinimo Minimum stock level
 *
 * @apiError {String} ValidationError Invalid parameters provided
 * @apiError {String} UnauthorizedError User lacks permission
 * @apiError {String} ServerError Internal server error
 */
export async function getHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  const operation = new CrudController([{ securable, permission: 'READ' }]);

  const [validated, error] = await operation.read(req, getSchema);

  if (!validated) {
    return next(error);
  }

  try {
    const data = await estoqueAtualGet({
      ...validated.credential,
      ...validated.params,
    });

    res.json(successResponse(data));
  } catch (error: any) {
    if (error.number === 51000) {
      res.status(400).json(errorResponse(error.message));
    } else {
      next(StatusGeneralError);
    }
  }
}
