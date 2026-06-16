import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.ts";

// Retrieve Neon database connection details
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL is not configured. Database queries will fail without it.");
}

// Support lazy or mock-safe connection string during compilation
const client = neon(databaseUrl || "postgres://placeholder-user:placeholder-password@placeholder-host/placeholder-db");

// Initialize Drizzle ORM client using HTTP connection
export const db = drizzle(client, { schema });
export * as schema from "./schema.ts";
