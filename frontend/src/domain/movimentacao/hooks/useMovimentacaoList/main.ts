import { useQuery } from '@tanstack/react-query';
import { movimentacaoService } from '../../services';
import type { UseMovimentacaoListOptions, UseMovimentacaoListReturn } from './types';

/**
 * @hook useMovimentacaoList
 * @summary Hook for listing stock movements
 * @domain movimentacao
 * @type domain-hook
 * @category data
 */
export const useMovimentacaoList = (
  options: UseMovimentacaoListOptions = {}
): UseMovimentacaoListReturn => {
  const { filters, enabled = true } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['movimentacoes', filters],
    queryFn: () => movimentacaoService.list(filters),
    enabled,
  });

  return {
    movimentacoes: data || [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
