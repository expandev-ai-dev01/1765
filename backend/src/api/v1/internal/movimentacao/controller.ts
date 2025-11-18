/**
 * @summary
 * Stock movement controller
 * Handles all stock movement operations
 *
 * @module api/v1/internal/movimentacao/controller
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  CrudController,
  errorResponse,
  StatusGeneralError,
  successResponse,
} from '@/middleware/crud';
import {
  movimentacaoCreate,
  movimentacaoList,
  movimentacaoGet,
  movimentacaoEstornar,
} from '@/services/movimentacao';

const securable = 'MOVIMENTACAO';

const createSchema = z.object({
  idProduto: z.coerce.number().int().positive(),
  tipoAcao: z.coerce.number().int().min(0).max(4),
  quantidade: z.coerce.number(),
  descricao: z.string().max(500).nullable().optional(),
  referenciaOrigem: z.string().max(100).nullable().optional(),
  motivoSaida: z.string().max(100).nullable().optional(),
});

const listSchema = z.object({
  idProduto: z.coerce.number().int().positive().nullable().optional(),
  tipoAcao: z.coerce.number().int().min(0).max(4).nullable().optional(),
  idUsuario: z.coerce.number().int().positive().nullable().optional(),
  dataInicio: z.string().nullable().optional(),
  dataFim: z.string().nullable().optional(),
  limite: z.coerce.number().int().min(1).max(1000).optional().default(100),
});

const getSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const estornarSchema = z.object({
  id: z.coerce.number().int().positive(),
  motivoEstorno: z.string().min(10).max(500),
});

/**
 * @api {post} /api/v1/internal/movimentacao Create Movement
 * @apiName CreateMovimentacao
 * @apiGroup Movimentacao
 * @apiVersion 1.0.0
 *
 * @apiDescription Creates a new stock movement record
 *
 * @apiParam {Number} idProduto Product identifier
 * @apiParam {Number} tipoAcao Movement type (0-4)
 * @apiParam {Number} quantidade Quantity moved
 * @apiParam {String} [descricao] Movement description
 * @apiParam {String} [referenciaOrigem] Entry reference (required for ENTRADA)
 * @apiParam {String} [motivoSaida] Exit reason (required for SAIDA)
 *
 * @apiSuccess {Number} idMovimentacao Created movement identifier
 *
 * @apiError {String} ValidationError Invalid parameters provided
 * @apiError {String} UnauthorizedError User lacks permission
 * @apiError {String} ServerError Internal server error
 */
export async function postHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  const operation = new CrudController([{ securable, permission: 'CREATE' }]);

  const [validated, error] = await operation.create(req, createSchema);

  if (!validated) {
    return next(error);
  }

  try {
    const data = await movimentacaoCreate({
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

/**
 * @api {get} /api/v1/internal/movimentacao List Movements
 * @apiName ListMovimentacao
 * @apiGroup Movimentacao
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieves stock movement history with optional filtering
 *
 * @apiParam {Number} [idProduto] Filter by product
 * @apiParam {Number} [tipoAcao] Filter by movement type
 * @apiParam {Number} [idUsuario] Filter by user
 * @apiParam {String} [dataInicio] Start date filter
 * @apiParam {String} [dataFim] End date filter
 * @apiParam {Number} [limite=100] Result limit (max 1000)
 *
 * @apiSuccess {Array} movements List of movements
 *
 * @apiError {String} ValidationError Invalid parameters provided
 * @apiError {String} UnauthorizedError User lacks permission
 * @apiError {String} ServerError Internal server error
 */
export async function listHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  const operation = new CrudController([{ securable, permission: 'READ' }]);

  const [validated, error] = await operation.read(req, listSchema);

  if (!validated) {
    return next(error);
  }

  try {
    const data = await movimentacaoList({
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

/**
 * @api {get} /api/v1/internal/movimentacao/:id Get Movement
 * @apiName GetMovimentacao
 * @apiGroup Movimentacao
 * @apiVersion 1.0.0
 *
 * @apiDescription Retrieves detailed information about a specific movement
 *
 * @apiParam {Number} id Movement identifier
 *
 * @apiSuccess {Object} movement Movement details
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
    const data = await movimentacaoGet({
      ...validated.credential,
      idMovimentacao: validated.params.id,
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

/**
 * @api {post} /api/v1/internal/movimentacao/:id/estornar Reverse Movement
 * @apiName EstornarMovimentacao
 * @apiGroup Movimentacao
 * @apiVersion 1.0.0
 *
 * @apiDescription Reverses a stock movement by creating a counter-movement
 *
 * @apiParam {Number} id Original movement identifier
 * @apiParam {String} motivoEstorno Reversal justification (min 10 chars)
 *
 * @apiSuccess {Number} idMovimentacaoEstorno Created reversal movement identifier
 *
 * @apiError {String} ValidationError Invalid parameters provided
 * @apiError {String} UnauthorizedError User lacks permission
 * @apiError {String} ServerError Internal server error
 */
export async function estornarHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const operation = new CrudController([{ securable, permission: 'DELETE' }]);

  const [validated, error] = await operation.delete(req, estornarSchema);

  if (!validated) {
    return next(error);
  }

  try {
    const data = await movimentacaoEstornar({
      ...validated.credential,
      idMovimentacaoOriginal: validated.params.id,
      motivoEstorno: validated.params.motivoEstorno,
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
