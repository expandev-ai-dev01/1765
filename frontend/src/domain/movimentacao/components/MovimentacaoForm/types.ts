import type { CreateMovimentacaoDto } from '../../types';

export interface MovimentacaoFormProps {
  onSuccess?: (data: { idMovimentacao: number }) => void;
  onCancel?: () => void;
}

export type MovimentacaoFormData = CreateMovimentacaoDto;
