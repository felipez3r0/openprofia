/**
 * Chunk de documento para indexação vetorial
 */
export interface IDocumentChunk {
  id: string;
  skillId: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: {
    source: string;
    page?: number;
    chunkIndex: number;
    totalChunks: number;
    [key: string]: unknown;
  };
  createdAt: string;
}

/**
 * Resultado de busca semântica
 */
export interface ISearchResult {
  chunk: IDocumentChunk;
  score: number;
  distance: number;
}

/**
 * Parâmetros de busca RAG
 */
export interface ISearchParams {
  skillId: string;
  query: string;
  limit?: number;
  threshold?: number;
}
