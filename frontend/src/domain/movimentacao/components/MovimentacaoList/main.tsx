import { format } from 'date-fns';
import { useMovimentacaoList } from '../../hooks';
import { TIPO_ACAO_LABELS } from '../../types';
import { LoadingSpinner } from '@/core/components/LoadingSpinner';
import { ErrorMessage } from '@/core/components/ErrorMessage';
import type { MovimentacaoListProps } from './types';

/**
 * @component MovimentacaoList
 * @summary List of stock movements with filtering
 * @domain movimentacao
 * @type domain-component
 * @category display
 */
export const MovimentacaoList = (props: MovimentacaoListProps) => {
  const { filters, onEstornar } = props;

  const { movimentacoes, isLoading, error, refetch } = useMovimentacaoList({ filters });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Erro ao carregar movimentações"
        message={error.message}
        onRetry={refetch}
      />
    );
  }

  if (movimentacoes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhuma movimentação encontrada</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data/Hora
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Produto
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantidade
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descrição
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {movimentacoes.map((mov) => (
            <tr key={mov.idMovimentacao} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">
                {format(new Date(mov.timestamp), 'dd/MM/yyyy HH:mm')}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {TIPO_ACAO_LABELS[mov.tipoAcao as keyof typeof TIPO_ACAO_LABELS]}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">#{mov.idProduto}</td>
              <td className="px-4 py-3 text-sm text-right">
                <span className={mov.quantidade >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {mov.quantidade >= 0 ? '+' : ''}
                  {mov.quantidade}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{mov.descricao || '-'}</td>
              <td className="px-4 py-3 text-sm text-center">
                {mov.estornado ? (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Estornado
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Ativo
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-center">
                {!mov.estornado && onEstornar && (
                  <button
                    onClick={() => onEstornar(mov.idMovimentacao)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Estornar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
