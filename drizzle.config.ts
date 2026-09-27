import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

// drizzle-kit runs outside Next.js, so it does not get .env.local for free.
config({ path: ".env.local" })

const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!migrationUrl) {
  throw new Error(
    "DATABASE_URL_UNPOOLED (or DATABASE_URL) is not set in .env.local"
  )
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  // Migrations must not go through PgBouncer, so this is the direct URL.
  dbCredentials: {
    url: migrationUrl,
  },
  // Must match the `casing` passed to drizzle() in lib/db/index.ts.
  casing: "snake_case",
  verbose: true,
  strict: true,
})
