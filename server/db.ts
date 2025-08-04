import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

// Use SQLite for development - do not import schema to avoid PostgreSQL type conflicts
const sqlite = new Database('qurtoba.db');
export const db = drizzle({ client: sqlite });