import type { ISettingsMap, SettingsKey } from '@openprofia/core';
import db from '../db/connection.js';
import { defaultConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { SettingsRow } from '../db/types.js';

const DEFAULTS: Required<ISettingsMap> = {
  ollama_base_url: defaultConfig.OLLAMA_BASE_URL,
  ollama_chat_model: defaultConfig.OLLAMA_CHAT_MODEL,
  ollama_embedding_model: defaultConfig.OLLAMA_EMBEDDING_MODEL,
};

/**
 * Service para gerenciar configurações persistidas no SQLite.
 * Mantém cache em memória para evitar queries em cada request.
 */
export class SettingsService {
  private cache: Map<string, string> = new Map();

  constructor() {
    this.loadFromDb();
  }

  private loadFromDb(): void {
    const rows = db
      .prepare('SELECT key, value FROM settings')
      .all() as SettingsRow[];
    for (const row of rows) {
      this.cache.set(row.key, row.value);
    }
    logger.info({ count: rows.length }, 'Settings loaded from database');
  }

  get(key: SettingsKey): string {
    return this.cache.get(key) ?? DEFAULTS[key];
  }

  set(key: SettingsKey, value: string): void {
    db.prepare(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ).run(key, value);
    this.cache.set(key, value);
    logger.info({ key }, 'Setting updated');
  }

  getAll(): Required<ISettingsMap> {
    return {
      ollama_base_url: this.get('ollama_base_url'),
      ollama_chat_model: this.get('ollama_chat_model'),
      ollama_embedding_model: this.get('ollama_embedding_model'),
    };
  }

  update(settings: Partial<ISettingsMap>): void {
    const validKeys = Object.keys(DEFAULTS) as SettingsKey[];
    for (const [key, value] of Object.entries(settings)) {
      if (
        validKeys.includes(key as SettingsKey) &&
        typeof value === 'string' &&
        value.trim() !== ''
      ) {
        this.set(key as SettingsKey, value.trim());
      }
    }
  }
}

export const settingsService = new SettingsService();
