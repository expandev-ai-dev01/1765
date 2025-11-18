import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMovimentacaoCreate } from '../../hooks';
import { TipoAcao, TIPO_ACAO_LABELS } from '../../types';
import type { MovimentacaoFormProps, MovimentacaoFormData } from './types';

const movimentacaoSchema = z
  .object({
    idProduto: z.number().int().positive({ message: 'Produto é obrigatório' }),
    tipoAcao: z.number().int().min(0).max(4, { message: 'Tipo de ação inválido' }),
    quantidade: z.number({ message: 'Quantidade é obrigatória' }),
    descricao: z.string().max(500, { message: 'Máximo 500 caracteres' }).optional(),
    referenciaOrigem: z.string().max(100, { message: 'Máximo 100 caracteres' }).optional(),
    motivoSaida: z.string().max(100, { message: 'Máximo 100 caracteres' }).optional(),
  })
  .refine(
    (data) => {
      if (data.tipoAcao === TipoAcao.ENTRADA && !data.referenciaOrigem) {
        return false;
      }
      return true;
    },
    {
      message: 'Referência de origem é obrigatória para entradas',
      path: ['referenciaOrigem'],
    }
  )
  .refine(
    (data) => {
      if (data.tipoAcao === TipoAcao.SAIDA && !data.motivoSaida) {
        return false;
      }
      return true;
    },
    {
      message: 'Motivo da saída é obrigatório',
      path: ['motivoSaida'],
    }
  );

/**
 * @component MovimentacaoForm
 * @summary Form for creating stock movements
 * @domain movimentacao
 * @type domain-component
 * @category form
 */
export const MovimentacaoForm = (props: MovimentacaoFormProps) => {
  const { onSuccess, onCancel } = props;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MovimentacaoFormData>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: {
      idProduto: 0,
      tipoAcao: 0,
      quantidade: 0,
      descricao: '',
      referenciaOrigem: '',
      motivoSaida: '',
    },
  });

  const tipoAcao = watch('tipoAcao');

  const { create, isCreating } = useMovimentacaoCreate({
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      alert(`Erro ao criar movimentação: ${error.message}`);
    },
  });

  const onSubmit: SubmitHandler<MovimentacaoFormData> = async (data) => {
    try {
      await create(data);
    } catch (error: unknown) {
      console.error('Erro ao criar movimentação:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ID do Produto *</label>
        <input
          type="number"
          {...register('idProduto', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.idProduto && (
          <p className="text-sm text-red-600 mt-1">{errors.idProduto.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ação *</label>
        <select
          {...register('tipoAcao', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione...</option>
          {Object.entries(TIPO_ACAO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {errors.tipoAcao && <p className="text-sm text-red-600 mt-1">{errors.tipoAcao.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
        <input
          type="number"
          step="0.01"
          {...register('quantidade', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.quantidade && (
          <p className="text-sm text-red-600 mt-1">{errors.quantidade.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          {...register('descricao')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.descricao && (
          <p className="text-sm text-red-600 mt-1">{errors.descricao.message}</p>
        )}
      </div>

      {Number(tipoAcao) === TipoAcao.ENTRADA && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Referência de Origem *
          </label>
          <input
            type="text"
            {...register('referenciaOrigem')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.referenciaOrigem && (
            <p className="text-sm text-red-600 mt-1">{errors.referenciaOrigem.message}</p>
          )}
        </div>
      )}

      {Number(tipoAcao) === TipoAcao.SAIDA && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Saída *</label>
          <input
            type="text"
            {...register('motivoSaida')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.motivoSaida && (
            <p className="text-sm text-red-600 mt-1">{errors.motivoSaida.message}</p>
          )}
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isCreating}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? 'Registrando...' : 'Registrar Movimentação'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};
