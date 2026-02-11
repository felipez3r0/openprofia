import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { defaultConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Singleton da conexão SQLite
 */
class DatabaseConnection {
  private static instance: Database.Database | null = null;

  static get(): Database.Database {
    if (!this.instance) {
      this.instance = this.initialize();
    }
    return this.instance;
  }

  private static initialize(): Database.Database {
    // Garante que o diretório storage existe
    const storagePath = path.resolve(
      __dirname,
      '../../../..',
      defaultConfig.STORAGE_PATH,
    );
    if (!existsSync(storagePath)) {
      mkdirSync(storagePath, { recursive: true });
      logger.info({ path: storagePath }, 'Created storage directory');
    }

    const dbPath = path.join(storagePath, 'openprofia.db');
    const db = new Database(dbPath);

    // Configurações de performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');

    logger.info({ path: dbPath }, 'SQLite database connected');

    // Executa migrations
    this.runMigrations(db);

    return db;
  }

  private static runMigrations(db: Database.Database): void {
    const migrationsPath = path.join(__dirname, 'migrations');
    const migrationFiles = ['001_init.sql'];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsPath, file);
      if (existsSync(filePath)) {
        const sql = readFileSync(filePath, 'utf-8');
        db.exec(sql);
        logger.info({ migration: file }, 'Migration executed');
      }
    }
  }

  static close(): void {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
      logger.info('Database connection closed');
    }
  }
}

export const db = DatabaseConnection.get();
export default db;
