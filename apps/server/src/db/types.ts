/**
 * Row types para queries do better-sqlite3.
 * Representam os dados brutos retornados pelas tabelas do SQLite.
 */

export interface SkillRow {
  id: string;
  name: string;
  version: string;
  manifest: string; // JSON stringificado de ISkillManifest
  path: string;
  has_knowledge: number; // 0 ou 1
  installed_at: string;
}

export interface JobRow {
  id: string;
  skill_id: string;
  file_path: string;
  file_name: string;
  status: string;
  error: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface SettingsRow {
  key: string;
  value: string;
}

export interface QueueStatsRow {
  status: string;
  count: number;
}
