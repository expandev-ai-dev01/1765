# StockBox - Sistema de Controle de Estoque

Sistema para controlar itens no estoque: entradas, saídas e quantidade atual.

## Tecnologias

- React 19.2.0
- TypeScript 5.6.3
- Vite 5.4.11
- TailwindCSS 3.4.14
- React Router DOM 7.9.3
- TanStack Query 5.90.2
- Axios 1.12.2
- Zustand 5.0.8
- React Hook Form 7.63.0
- Zod 4.1.11

## Instalação

```bash
npm install
```

## Configuração

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Configure as variáveis de ambiente no arquivo `.env`:
```
VITE_API_URL=http://localhost:3000
VITE_API_VERSION=v1
VITE_API_TIMEOUT=30000
```

## Desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## Estrutura do Projeto

```
src/
├── app/                    # Configuração da aplicação
│   ├── App.tsx            # Componente raiz
│   ├── providers.tsx      # Provedores globais
│   └── router.tsx         # Configuração de rotas
├── assets/                # Recursos estáticos
│   └── styles/           # Estilos globais
├── core/                  # Componentes e lógica compartilhada
│   ├── components/       # Componentes genéricos
│   └── lib/              # Bibliotecas e configurações
├── domain/               # Módulos de domínio
└── pages/                # Páginas da aplicação
    └── layouts/          # Layouts compartilhados
```

## Arquitetura

O projeto segue uma arquitetura baseada em domínios:

- **app/**: Configuração e inicialização da aplicação
- **core/**: Componentes e lógica reutilizáveis
- **domain/**: Módulos de negócio organizados por domínio
- **pages/**: Componentes de página para roteamento

## API

O frontend se comunica com o backend através de dois clientes HTTP:

- **publicClient**: Para endpoints públicos (`/api/v1/external`)
- **authenticatedClient**: Para endpoints autenticados (`/api/v1/internal`)

## Licença

MIT