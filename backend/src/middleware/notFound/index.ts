/**
 * @summary
 * 404 Not Found middleware
 * Handles requests to undefined routes
 *
 * @module middleware/notFound
 */

import { Request, Response } from 'express';

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.path,
      method: req.method,
    },
    timestamp: new Date().toISOString(),
  });
}
