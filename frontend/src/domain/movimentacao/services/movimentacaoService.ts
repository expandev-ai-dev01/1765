import { authenticatedClient } from '@/core/lib/api';
import type {
  Movimentacao,
  CreateMovimentacaoDto,
  MovimentacaoListParams,
  EstornarMovimentacaoDto,
} from '../types';

/**
 * @service movimentacaoService
 * @summary Service for stock movement operations
 * @domain movimentacao
 * @type rest-service
 * @apiContext internal
 */
export const movimentacaoService = {
  /**
   * @endpoint POST /api/v1/internal/movimentacao
   * @summary Creates a new stock movement
   */
  async create(data: CreateMovimentacaoDto): Promise<{ idMovimentacao: number }> {
    const response = await authenticatedClient.post('/movimentacao', data);
    return response.data.data;
  },

  /**
   * @endpoint GET /api/v1/internal/movimentacao
   * @summary Lists stock movements with optional filters
   */
  async list(params?: MovimentacaoListParams): Promise<Movimentacao[]> {
    const response = await authenticatedClient.get('/movimentacao', { params });
    return response.data.data;
  },

  /**
   * @endpoint GET /api/v1/internal/movimentacao/:id
   * @summary Gets a specific movement by ID
   */
  async getById(id: number): Promise<Movimentacao> {
    const response = await authenticatedClient.get(`/movimentacao/${id}`);
    return response.data.data;
  },

  /**
   * @endpoint POST /api/v1/internal/movimentacao/:id/estornar
   * @summary Reverses a stock movement
   */
  async estornar(data: EstornarMovimentacaoDto): Promise<{ idMovimentacaoEstorno: number }> {
    const response = await authenticatedClient.post(`/movimentacao/${data.id}/estornar`, {
      motivoEstorno: data.motivoEstorno,
    });
    return response.data.data;
  },
};
