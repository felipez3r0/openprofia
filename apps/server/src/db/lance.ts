import { connect, makeArrowTable } from 'vectordb';
import { VectorColumnOptions } from 'vectordb/dist/arrow.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { defaultConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { Connection, Table } from 'vectordb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Singleton da conexão LanceDB
 */
class LanceDBConnection {
  private static instance: Connection | null = null;

  static async get(): Promise<Connection> {
    if (!this.instance) {
      this.instance = await this.initialize();
    }
    return this.instance;
  }

  private static async initialize(): Promise<Connection> {
    // Garante que o diretório vectors existe
    const storagePath = path.resolve(
      __dirname,
      '../..',
      defaultConfig.STORAGE_PATH,
    );
    const vectorsPath = path.join(storagePath, 'vectors');

    if (!existsSync(vectorsPath)) {
      mkdirSync(vectorsPath, { recursive: true });
      logger.info({ path: vectorsPath }, 'Created vectors directory');
    }

    const db = await connect(vectorsPath);
    logger.info({ path: vectorsPath }, 'LanceDB connected');

    return db;
  }
}

/**
 * Obtém ou cria uma tabela de chunks para uma skill específica
 */
export async function getChunksTable(skillId: string): Promise<Table> {
  const db = await LanceDBConnection.get();
  const tableName = `chunks_${skillId.replace(/[^a-zA-Z0-9]/g, '_')}`;

  try {
    return await db.openTable(tableName);
  } catch {
    // Tabela não existe, criar uma vazia
    // LanceDB exige ao menos um registro para criar a tabela
    // Será populada quando o primeiro documento for processado
    logger.info({ tableName }, 'Chunks table will be created on first insert');
    throw new Error(`Table ${tableName} does not exist yet`);
  }
}

interface ChunkRecord {
  id: string;
  skillId: string;
  documentId: string;
  content: string;
  embedding: number[];
  metadata: string;
  createdAt: string;
}

/**
 * Converte dados de chunks para Arrow Table com schema correto (FixedSizeList<Float32>)
 */
export function makeChunksArrowTable(
  data: ChunkRecord[],
): ReturnType<typeof makeArrowTable> {
  return makeArrowTable(data, {
    vectorColumns: {
      embedding: new VectorColumnOptions(),
    },
  });
}

/**
 * Cria uma tabela de chunks para uma skill
 */
export async function createChunksTable(
  skillId: string,
  initialData: ChunkRecord[],
): Promise<Table> {
  const db = await LanceDBConnection.get();
  const tableName = `chunks_${skillId.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const arrowTable = makeChunksArrowTable(initialData);

  const table = await db.createTable(tableName, arrowTable);
  logger.info({ tableName, rows: initialData.length }, 'Created LanceDB table');

  return table;
}

/**
 * Deleta uma tabela de chunks de uma skill
 */
export async function deleteChunksTable(skillId: string): Promise<void> {
  const db = await LanceDBConnection.get();
  const tableName = `chunks_${skillId.replace(/[^a-zA-Z0-9]/g, '_')}`;

  try {
    await db.dropTable(tableName);
    logger.info({ tableName }, 'Dropped LanceDB table');
  } catch (error) {
    logger.warn({ tableName, error }, 'Failed to drop table (may not exist)');
  }
}

export { LanceDBConnection };
