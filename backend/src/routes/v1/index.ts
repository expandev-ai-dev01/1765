/**
 * @summary
 * API Version 1 router
 * Organizes external and internal route groups
 *
 * @module routes/v1
 */

import { Router } from 'express';
import externalRoutes from './externalRoutes';
import internalRoutes from './internalRoutes';

const router = Router();

router.use('/external', externalRoutes);
router.use('/internal', internalRoutes);

export default router;
