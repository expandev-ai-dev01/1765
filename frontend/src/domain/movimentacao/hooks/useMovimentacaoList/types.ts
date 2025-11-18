import type { Movimentacao, MovimentacaoListParams } from '../../types';

export interface UseMovimentacaoListOptions {
  filters?: MovimentacaoListParams;
  enabled?: boolean;
}

export interface UseMovimentacaoListReturn {
  movimentacoes: Movimentacao[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
