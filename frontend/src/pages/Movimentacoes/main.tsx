import { useState } from 'react';
import { MovimentacaoForm, MovimentacaoList } from '@/domain/movimentacao/components';
import { useMovimentacaoEstornar } from '@/domain/movimentacao/hooks';
import type { MovimentacaoListParams } from '@/domain/movimentacao/types';

/**
 * @page MovimentacoesPage
 * @summary Stock movements management page
 * @domain movimentacao
 * @type management-page
 * @category movimentacao-management
 */
export const MovimentacoesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<MovimentacaoListParams>({});
  const [estornoId, setEstornoId] = useState<number | null>(null);
  const [motivoEstorno, setMotivoEstorno] = useState('');

  const { estornar, isEstornando } = useMovimentacaoEstornar({
    onSuccess: () => {
      alert('Movimentação estornada com sucesso!');
      setEstornoId(null);
      setMotivoEstorno('');
    },
    onError: (error: Error) => {
      alert(`Erro ao estornar: ${error.message}`);
    },
  });

  const handleEstornar = (id: number) => {
    setEstornoId(id);
  };

  const confirmEstorno = async () => {
    if (!estornoId || !motivoEstorno) return;

    try {
      await estornar({ id: estornoId, motivoEstorno });
    } catch (error: unknown) {
      console.error('Erro ao estornar:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Movimentações de Estoque</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancelar' : 'Nova Movimentação'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Registrar Movimentação</h2>
          <MovimentacaoForm
            onSuccess={() => {
              setShowForm(false);
              alert('Movimentação registrada com sucesso!');
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Histórico de Movimentações</h2>
        <MovimentacaoList filters={filters} onEstornar={handleEstornar} />
      </div>

      {estornoId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Estornar Movimentação</h3>
            <p className="text-gray-600 mb-4">
              Informe o motivo do estorno (mínimo 10 caracteres):
            </p>
            <textarea
              value={motivoEstorno}
              onChange={(e) => setMotivoEstorno(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Motivo do estorno..."
            />
            <div className="flex gap-4">
              <button
                onClick={confirmEstorno}
                disabled={isEstornando || motivoEstorno.length < 10}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isEstornando ? 'Estornando...' : 'Confirmar Estorno'}
              </button>
              <button
                onClick={() => {
                  setEstornoId(null);
                  setMotivoEstorno('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovimentacoesPage;
