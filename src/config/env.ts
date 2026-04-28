import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid env vars:', parsed.error.format());
  process.exit(1);
}

export const ENV = parsed.data;
export type Env = z.infer<typeof envSchema>;

export const JWT_SECRET = ENV.JWT_SECRET;
export const GITHUB_CLIENT_ID = ENV.GITHUB_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = ENV.GITHUB_CLIENT_SECRET;
export const FRONTEND_URL = ENV.FRONTEND_URL;
