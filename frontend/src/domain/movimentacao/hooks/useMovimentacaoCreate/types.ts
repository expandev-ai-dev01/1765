import type { CreateMovimentacaoDto } from '../../types';

export interface UseMovimentacaoCreateOptions {
  onSuccess?: (data: { idMovimentacao: number }) => void;
  onError?: (error: Error) => void;
}

export interface UseMovimentacaoCreateReturn {
  create: (data: CreateMovimentacaoDto) => Promise<{ idMovimentacao: number }>;
  isCreating: boolean;
  error: Error | null;
}
