import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');

declare global {
  var _db: Database.Database | undefined;
}

const db = globalThis._db || new Database(dbPath);

// Activar WAL mode y foreign keys para alto rendimiento y concurrencia en LAN
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

if (process.env.NODE_ENV !== 'production') {
  globalThis._db = db;
}

export default db;

