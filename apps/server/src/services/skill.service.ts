import type { ISkill, ISkillManifest } from '@openprofia/core';
import AdmZip from 'adm-zip';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  existsSync,
  mkdirSync,
  rmSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { defaultConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';
import db from '../db/connection.js';
import { deleteChunksTable } from '../db/lance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service de gerenciamento de Skills
 */
export class SkillService {
  private skillsPath: string;

  constructor() {
    this.skillsPath = path.resolve(
      __dirname,
      '../..',
      defaultConfig.SKILLS_PATH,
    );
    this.ensureSkillsDirectory();
  }

  /**
   * Lista todas as skills instaladas
   */
  listSkills(): ISkill[] {
    const stmt = db.prepare('SELECT * FROM skills ORDER BY installed_at DESC');
    const rows = stmt.all();

    return rows.map((row: any) => ({
      id: row.id,
      manifest: JSON.parse(row.manifest),
      installedAt: row.installed_at,
      path: row.path,
      hasKnowledge: Boolean(row.has_knowledge),
    }));
  }

  /**
   * Obtém uma skill por ID
   */
  getSkill(skillId: string): ISkill | null {
    const stmt = db.prepare('SELECT * FROM skills WHERE id = ?');
    const row = stmt.get(skillId);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      manifest: JSON.parse(row.manifest),
      installedAt: row.installed_at,
      path: row.path,
      hasKnowledge: Boolean(row.has_knowledge),
    };
  }

  /**
   * Instala uma nova skill a partir de um arquivo .zip
   */
  async installSkill(zipBuffer: Buffer, filename: string): Promise<ISkill> {
    const tempDir = path.join(this.skillsPath, '.temp', Date.now().toString());

    try {
      // Extrai zip para diretório temporário
      mkdirSync(tempDir, { recursive: true });
      const zip = new AdmZip(zipBuffer);
      zip.extractAllTo(tempDir, true);

      // Valida o manifest
      const manifestPath = path.join(tempDir, 'manifest.json');
      if (!existsSync(manifestPath)) {
        throw new ValidationError('manifest.json not found in skill package');
      }

      const manifest: ISkillManifest = JSON.parse(
        require('fs').readFileSync(manifestPath, 'utf-8'),
      );

      // Valida campos obrigatórios
      this.validateManifest(manifest);

      // Valida segurança: nenhum arquivo executável
      this.validateNoExecutables(tempDir);

      // Verifica se já existe
      if (this.getSkill(manifest.id)) {
        throw new ConflictError(`Skill ${manifest.id} is already installed`);
      }

      // Move para diretório final
      const finalPath = path.join(this.skillsPath, manifest.id);
      if (existsSync(finalPath)) {
        rmSync(finalPath, { recursive: true });
      }
      require('fs').renameSync(tempDir, finalPath);

      // Verifica se tem diretório knowledge
      const hasKnowledge = existsSync(path.join(finalPath, 'knowledge'));

      // Registra no banco
      const stmt = db.prepare(`
        INSERT INTO skills (id, name, version, manifest, path, has_knowledge, installed_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      stmt.run(
        manifest.id,
        manifest.name,
        manifest.version,
        JSON.stringify(manifest),
        finalPath,
        hasKnowledge ? 1 : 0,
      );

      logger.info(
        { skillId: manifest.id, name: manifest.name },
        'Skill installed',
      );

      return {
        id: manifest.id,
        manifest,
        installedAt: new Date().toISOString(),
        path: finalPath,
        hasKnowledge,
      };
    } catch (error) {
      // Limpa diretório temporário em caso de erro
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true });
      }
      throw error;
    }
  }

  /**
   * Remove uma skill
   */
  async uninstallSkill(skillId: string): Promise<void> {
    const skill = this.getSkill(skillId);
    if (!skill) {
      throw new NotFoundError('Skill', skillId);
    }

    // Remove do banco
    const stmt = db.prepare('DELETE FROM skills WHERE id = ?');
    stmt.run(skillId);

    // Remove diretório
    if (existsSync(skill.path)) {
      rmSync(skill.path, { recursive: true });
    }

    // Remove tabela de vetores do LanceDB
    try {
      await deleteChunksTable(skillId);
    } catch (error) {
      logger.warn(
        { skillId, error },
        'Failed to delete chunks table (may not exist)',
      );
    }

    logger.info({ skillId }, 'Skill uninstalled');
  }

  /**
   * Valida o manifest da skill
   */
  private validateManifest(manifest: any): void {
    const required = ['id', 'name', 'version', 'description', 'capabilities'];

    for (const field of required) {
      if (!manifest[field]) {
        throw new ValidationError(
          `manifest.json is missing required field: ${field}`,
        );
      }
    }

    // Valida formato do ID (alfanumérico, hífens, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(manifest.id)) {
      throw new ValidationError(
        'Skill ID must contain only alphanumeric characters, hyphens, and underscores',
      );
    }

    // Valida que capabilities é um array
    if (!Array.isArray(manifest.capabilities)) {
      throw new ValidationError('capabilities must be an array');
    }
  }

  /**
   * Valida que não há arquivos executáveis na skill
   * REGRA DE SEGURANÇA: Skills não podem conter código executável
   */
  private validateNoExecutables(dir: string): void {
    const forbiddenExtensions = [
      '.js',
      '.sh',
      '.bin',
      '.exe',
      '.bat',
      '.cmd',
      '.py',
      '.rb',
    ];

    const walkDir = (currentPath: string) => {
      const files = readdirSync(currentPath);

      for (const file of files) {
        const filePath = path.join(currentPath, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (forbiddenExtensions.includes(ext)) {
            throw new ValidationError(
              `Skill package contains forbidden executable file: ${file}. Skills must be purely declarative (JSON + Markdown + knowledge files only).`,
            );
          }
        }
      }
    };

    walkDir(dir);
  }

  /**
   * Registra no banco skills que existem no disco mas ainda não foram registradas.
   * Usado no startup para garantir que skills built-in estejam sempre disponíveis.
   */
  seedDefaultSkills(): void {
    if (!existsSync(this.skillsPath)) return;

    const entries = readdirSync(this.skillsPath);

    for (const entry of entries) {
      if (entry.startsWith('.')) continue;

      const skillDir = path.join(this.skillsPath, entry);
      if (!statSync(skillDir).isDirectory()) continue;

      const manifestPath = path.join(skillDir, 'manifest.json');
      if (!existsSync(manifestPath)) continue;

      try {
        const manifest: ISkillManifest = JSON.parse(
          readFileSync(manifestPath, 'utf-8'),
        );

        // Pula se já registrada no banco
        if (this.getSkill(manifest.id)) continue;

        const hasKnowledge = existsSync(path.join(skillDir, 'knowledge'));

        const stmt = db.prepare(`
          INSERT OR IGNORE INTO skills (id, name, version, manifest, path, has_knowledge, installed_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `);

        stmt.run(
          manifest.id,
          manifest.name,
          manifest.version,
          JSON.stringify(manifest),
          skillDir,
          hasKnowledge ? 1 : 0,
        );

        logger.info(
          { skillId: manifest.id, name: manifest.name },
          'Default skill seeded',
        );
      } catch (error) {
        logger.warn({ entry, error }, 'Failed to seed skill from disk');
      }
    }
  }

  /**
   * Garante que o diretório de skills existe
   */
  private ensureSkillsDirectory(): void {
    if (!existsSync(this.skillsPath)) {
      mkdirSync(this.skillsPath, { recursive: true });
      logger.info({ path: this.skillsPath }, 'Created skills directory');
    }
  }
}

// Exporta instância singleton
export const skillService = new SkillService();
