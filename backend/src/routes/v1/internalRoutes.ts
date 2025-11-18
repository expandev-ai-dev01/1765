/**
 * @summary
 * Internal (authenticated) API routes configuration
 * Handles authenticated endpoints
 *
 * @module routes/v1/internalRoutes
 */

import { Router } from 'express';
import * as movimentacaoController from '@/api/v1/internal/movimentacao/controller';
import * as estoqueController from '@/api/v1/internal/estoque/controller';

const router = Router();

router.post('/movimentacao', movimentacaoController.postHandler);
router.get('/movimentacao', movimentacaoController.listHandler);
router.get('/movimentacao/:id', movimentacaoController.getHandler);
router.post('/movimentacao/:id/estornar', movimentacaoController.estornarHandler);

router.get('/estoque/:idProduto', estoqueController.getHandler);

export default router;
