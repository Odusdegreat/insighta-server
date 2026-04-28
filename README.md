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
└── package.json
```