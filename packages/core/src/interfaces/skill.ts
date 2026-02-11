/**
 * Manifesto de uma Skill (declarativo)
 */
export interface ISkillManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  capabilities: string[];
  tools?: string[];
  modelPreferences?: {
    chat?: string;
    embedding?: string;
  };
}

/**
 * Skill completa (manifest + metadados de instalação)
 */
export interface ISkill {
  id: string;
  manifest: ISkillManifest;
  installedAt: string;
  path: string;
  hasKnowledge: boolean;
}

/**
 * Request de criação/upload de Skill
 */
export interface ICreateSkillRequest {
  file: Buffer;
  filename: string;
}

/**
 * Response de criação de Skill
 */
export interface ICreateSkillResponse {
  skillId: string;
  name: string;
  version: string;
  missingModels?: string[];
}

/**
 * Resultado da verificação de modelos de uma Skill
 */
export interface IModelCheckResult {
  available: string[];
  missing: string[];
}

/**
 * Progresso de download de modelo Ollama
 */
export interface IModelPullProgress {
  model: string;
  status: string;
  completed: number;
  total: number;
  percent: number;
  done: boolean;
}
