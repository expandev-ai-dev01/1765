# StockBox Backend API

Backend API for StockBox - Inventory Management System

## Description

Sistema para controlar itens no estoque: entradas, saídas e quantidade atual

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MS SQL Server
- **Validation**: Zod

## Project Structure

```
backend/
├── src/
│   ├── api/                    # API controllers
│   │   └── v1/                 # API version 1
│   │       ├── external/       # Public endpoints
│   │       └── internal/       # Authenticated endpoints
│   ├── routes/                 # Route definitions
│   │   └── v1/                 # Version 1 routes
│   ├── middleware/             # Express middleware
│   ├── services/               # Business logic
│   ├── utils/                  # Utility functions
│   ├── config/                 # Configuration
│   ├── migrations/             # Database migration runner
│   └── server.ts               # Application entry point
├── database/                   # SQL files (if needed)
├── migrations/                 # Consolidated migrations (auto-generated)
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MS SQL Server instance
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` file with your database credentials:
```env
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=stockbox
DB_USER=sa
DB_PASSWORD=your_password
PROJECT_ID=1757
```

### Development

Run the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/v1`

### Build

Build for production:
```bash
npm run build
```

### Production

Start production server:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### API Version 1
- Base URL: `/api/v1`
- External routes: `/api/v1/external/*` (public access)
- Internal routes: `/api/v1/internal/*` (authenticated access)

## Database Migrations

The application automatically runs database migrations on startup using the Schema Isolation Mode:

- Each project gets its own schema (e.g., `project_1757`)
- Migrations recreate the schema from scratch on each deployment
- Other project schemas remain untouched
- Migration files are located in `backend/migrations/` (auto-generated)

### Manual Migration Execution

```bash
ts-node src/migrations/run-migrations.ts
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 3000 |
| DB_SERVER | Database server | localhost |
| DB_PORT | Database port | 1433 |
| DB_NAME | Database name | stockbox |
| DB_USER | Database user | sa |
| DB_PASSWORD | Database password | - |
| PROJECT_ID | Project identifier | 1757 |
| SKIP_MIGRATIONS | Skip migrations | false |

## Features

### Implemented
- ✅ Express server with TypeScript
- ✅ Database connection with schema isolation
- ✅ Automatic migration system
- ✅ API versioning (v1)
- ✅ Error handling middleware
- ✅ CORS configuration
- ✅ Request validation with Zod
- ✅ Health check endpoint

### Pending Implementation
- ⏳ Feature-specific endpoints
- ⏳ Business logic services
- ⏳ Database stored procedures

## License

ISC