import { DatabaseSync } from "node:sqlite";

export type SqlDatabase = DatabaseSync;

export function openSqlite(file: string): SqlDatabase {
  const database = new DatabaseSync(file, {
    enableForeignKeyConstraints: true,
  });
  database.exec("PRAGMA journal_mode = WAL");
  return database;
}

/** node:sqlite rows have a null prototype; Next.js cannot send those to Client Components. */
export function plainRow<T>(row: T): T {
  if (row == null || typeof row !== "object") return row;
  return { ...row };
}

export function plainRows<T>(rows: T[]): T[] {
  return rows.map((row) => plainRow(row));
}

export function runTransaction<T>(database: SqlDatabase, fn: () => T): T {
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch {
      // The original error is the one that matters.
    }
    throw error;
  }
}
