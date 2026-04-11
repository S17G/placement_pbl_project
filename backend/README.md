# PlaceMate Backend

Scalable Express + MongoDB backend scaffold for the PlaceMate campus placement platform.

## Folder Structure

- src/config: environment and database configuration
- src/controllers: HTTP handlers grouped by domain
- src/middlewares: auth, validation, error handling
- src/models: Mongoose schemas
- src/routes: API routing, versioned under /api/v1
- src/services: business logic and data operations
- src/utils: shared helper classes/functions
- src/validators: request validation chains

## Quick Start

1. Copy `.env.example` to `.env`
2. Set your MongoDB URI and JWT secrets
3. Run:

```bash
npm install
npm run dev
```

Backend will run on `http://localhost:5000` by default.

## Health Check

- GET `/api/health`

## Base API Version

- `/api/v1`
