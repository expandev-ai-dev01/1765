import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movimentacaoService } from '../../services';
import type { UseMovimentacaoEstornarOptions, UseMovimentacaoEstornarReturn } from './types';

/**
 * @hook useMovimentacaoEstornar
 * @summary Hook for reversing stock movements
 * @domain movimentacao
 * @type domain-hook
 * @category data
 */
export const useMovimentacaoEstornar = (
  options: UseMovimentacaoEstornarOptions = {}
): UseMovimentacaoEstornarReturn => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: movimentacaoService.estornar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
      options.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options.onError?.(error);
    },
  });

  return {
    estornar: mutation.mutateAsync,
    isEstornando: mutation.isPending,
    error: mutation.error,
  };
};
