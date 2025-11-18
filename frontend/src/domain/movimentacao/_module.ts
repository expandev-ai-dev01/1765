/**
 * @module movimentacao
 * @summary Stock movement management domain
 * @domain functional
 * @version 1.0.0
 */

export * from './components/MovimentacaoForm';
export * from './components/MovimentacaoList';
export * from './hooks/useMovimentacaoCreate';
export * from './hooks/useMovimentacaoList';
export * from './hooks/useMovimentacaoEstornar';
export * from './services/movimentacaoService';
export * from './types';

export const moduleMetadata = {
  name: 'movimentacao',
  domain: 'functional',
  version: '1.0.0',
  publicComponents: ['MovimentacaoForm', 'MovimentacaoList'],
  publicHooks: ['useMovimentacaoCreate', 'useMovimentacaoList', 'useMovimentacaoEstornar'],
  publicServices: ['movimentacaoService'],
  dependencies: {
    internal: ['@/core/components', '@/core/lib'],
    external: ['react', 'react-hook-form', 'zod', '@tanstack/react-query', 'axios', 'date-fns'],
    domains: [],
  },
  exports: {
    components: ['MovimentacaoForm', 'MovimentacaoList'],
    hooks: ['useMovimentacaoCreate', 'useMovimentacaoList', 'useMovimentacaoEstornar'],
    services: ['movimentacaoService'],
    types: [
      'Movimentacao',
      'CreateMovimentacaoDto',
      'MovimentacaoListParams',
      'EstornarMovimentacaoDto',
      'TipoAcao',
    ],
  },
} as const;
