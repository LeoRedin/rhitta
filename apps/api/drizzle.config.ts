import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/*/infra/schema.ts',
  out: './src/lib/drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/rhitta',
  },
  verbose: true,
  strict: true,
})
