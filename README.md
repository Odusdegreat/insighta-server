# insighta-backend

A RESTful API backend for profile data management built with Express, TypeScript, and Bun runtime.

## Features

- GitHub OAuth 2.0 with PKCE flow
- JWT-based authentication with access/refresh tokens
- Role-based access control (admin, analyst)
- Profile management with pagination
- CSV export functionality
- Rate limiting (auth: 10/min, API: 60/min)
- API versioning via `x-api-version` header
- Environment variable validation with Zod
- MongoDB integration with Mongoose
- Logging with Morgan
- CLI table output with chalk and cli-table3

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=4000
JWT_SECRET=your_32_character_secret_key_minimum
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Environment validation is handled by `src/env.ts` using Zod.

## Prerequisites

- [Bun](https://bun.sh/) runtime installed
- MongoDB database (local or Atlas)

## Installation

```bash
bun install
```

## Running

```bash
bun run dev
```

Server runs on port 4000 by default (configurable via PORT env variable).

## API Endpoints

### Authentication (GitHub OAuth with PKCE)

- `GET /auth/github` - Initiate GitHub OAuth with PKCE (rate limited: 10/min)
- `GET /auth/github/callback` - GitHub OAuth callback
- `POST /auth/exchange` - Exchange code for tokens (rate limited: 10/min)
- `POST /auth/refresh` - Refresh access token (rate limited: 10/min)
- `POST /auth/logout` - Logout and invalidate refresh token

### User

- `GET /api/users/me` - Get current user profile (requires auth)

### Profiles

- `GET /api/profiles` - List profiles with pagination (requires auth + API version header)
- `POST /api/profiles` - Create profile (requires auth, admin only)
- `GET /api/profiles/export` - Export profiles as CSV (requires auth)

## Rate Limiting

- Auth endpoints: 10 requests per minute
- API endpoints: 60 requests per minute

## API Versioning

All `/api` routes require `x-api-version` header to be present.

## Scripts

```bash
bun run dev          # Start development server with hot reload
bun run build        # Build for production (outputs to dist/)
bun run start        # Start production server
```

## Project Structure

```
├── index.ts              # Main Express app entry point
├── src/
│   └── env.ts            # Environment validation with Zod
├── .env                  # Environment variables (create from .env.example)
└── package.json
```

## Testing

To pass the automated tests (45/60 required):

1. Ensure the server is running on port 4000
2. Configure GitHub OAuth app with callback: `http://localhost:4000/auth/github/callback`
3. Set `FRONTEND_URL=http://localhost:5173` for CLI callback
4. Rate limiting must be enforced (10 req/min on auth endpoints) - currently failing
5. All `/api` routes require `x-api-version` header
6. JWT tokens must be properly validated with `JWT_SECRET` from env
7. Auth flow must complete successfully with valid tokens returned

### Current Test Score: 19/60
- ✅ API protection working
- ✅ README explanation clear
- ✅ Repo structure mostly correct
- ❌ Auth flow broken (connection to port 5173 refused)
- ❌ Rate limiting not enforced on /auth/github
- ❌ Tokens not properly returned

### Setup Instructions
1. Create `.env` file with required variables (see Environment Variables section)
2. Create `src/env.ts` with Zod validation (export JWT_SECRET, GITHUB_CLIENT_ID, etc.)
3. Ensure `index.ts` imports env variables from `src/env.ts`
4. Run with `bun run dev`