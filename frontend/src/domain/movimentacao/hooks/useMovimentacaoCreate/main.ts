import { useMutation, useQueryClient } from '@tanstack/react-query';
import { movimentacaoService } from '../../services';
import type { UseMovimentacaoCreateOptions, UseMovimentacaoCreateReturn } from './types';

/**
 * @hook useMovimentacaoCreate
 * @summary Hook for creating stock movements
 * @domain movimentacao
 * @type domain-hook
 * @category data
 */
export const useMovimentacaoCreate = (
  options: UseMovimentacaoCreateOptions = {}
): UseMovimentacaoCreateReturn => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: movimentacaoService.create,
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
    create: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
};
