import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

// Use SQLite for development
const sqlite = new Database('qurtoba.db');
export const db = drizzle({ client: sqlite, schema });