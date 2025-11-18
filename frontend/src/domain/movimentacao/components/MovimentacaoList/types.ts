import type { MovimentacaoListParams } from '../../types';

export interface MovimentacaoListProps {
  filters?: MovimentacaoListParams;
  onEstornar?: (id: number) => void;
}
