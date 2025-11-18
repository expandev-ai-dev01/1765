import type { EstornarMovimentacaoDto } from '../../types';

export interface UseMovimentacaoEstornarOptions {
  onSuccess?: (data: { idMovimentacaoEstorno: number }) => void;
  onError?: (error: Error) => void;
}

export interface UseMovimentacaoEstornarReturn {
  estornar: (data: EstornarMovimentacaoDto) => Promise<{ idMovimentacaoEstorno: number }>;
  isEstornando: boolean;
  error: Error | null;
}
