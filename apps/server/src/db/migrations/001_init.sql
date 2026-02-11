-- Tabela de Jobs (Fila de processamento)
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  error TEXT,
  progress INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT
);

-- Tabela de Skills instaladas
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  manifest TEXT NOT NULL, -- JSON do manifest completo
  path TEXT NOT NULL,
  has_knowledge INTEGER NOT NULL DEFAULT 0, -- Boolean (0/1)
  installed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_skill_id ON jobs(skill_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_skills_id ON skills(id);
