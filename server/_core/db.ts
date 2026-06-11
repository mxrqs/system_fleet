import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../../drizzle/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Please configure it in your .env file."
  );
}

// Create a connection pool
const poolConnection = mysql.createPool({
  connectionLimit: 10,
  uri: connectionString,
});

// Create Drizzle instance
export const db = drizzle(poolConnection, {
  schema,
  mode: "default",
});

// Export types for use in routers
export type Database = typeof db;
