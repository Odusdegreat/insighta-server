# insighta-backend

A RESTful API backend for profile data management built with NestJS.

## Features

- Profile management with filtering, sorting, and pagination
- Natural language search query support
- Authentication module
- Environment variable validation with Zod
- Input validation with proper error handling

## API Endpoints

API endpoints are organized by modules under the standard NestJS structure.

### Auth Module
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token

### Profiles Module
- `GET /profiles` - List profiles with filtering, sorting, and pagination
- `GET /profiles/search` - Natural language search for profiles
- `GET /profiles/:id` - Get profile by ID
- `POST /profiles` - Create new profile
- `PUT /profiles/:id` - Update profile
- `DELETE /profiles/:id` - Delete profile

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
DATABASE_URL=your_database_url
JWT_SECRET=your_32_character_secret_key_minimum
NODE_ENV=development
```

Environment validation is handled by `src/env.ts` using Zod.

## Installation

```bash
npm install
```

## Running

```bash
npm run start:dev
```

Server runs on port 3000 by default (configurable via PORT env variable).

## Modules

- **Auth Module** - Authentication and authorization
- **Profiles Module** - Profile management with filtering, sorting, and pagination

## Scripts

```bash
npm run build        # Build the project
npm run start        # Start production server
npm run start:dev    # Start development server with hot reload
npm run test         # Run tests
npm run test:e2e     # Run end-to-end tests
npm run lint         # Run linter
```

## Project Structure

```
src/
├── env.ts              # Environment validation
├── app.module.ts       # Root module
├── main.ts             # Entry point
└── modules/
    ├── auth/           # Authentication module
    └── profiles/       # Profiles module
```