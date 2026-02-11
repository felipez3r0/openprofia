import { defaultConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Chunk de texto
 */
export interface TextChunk {
  content: string;
  index: number;
  metadata: {
    startChar: number;
    endChar: number;
  };
}

/**
 * Divide texto em chunks com overlap
 *
 * NOTA: Esta é uma implementação simplificada baseada em caracteres.
 * Em produção, considere usar um tokenizer real (tiktoken, GPT-3-encoder, etc.)
 * para garantir chunks de tamanho consistente em tokens.
 */
export function chunkText(text: string): TextChunk[] {
  const chunkSize = defaultConfig.CHUNK_SIZE;
  const overlap = defaultConfig.CHUNK_OVERLAP;

  // Remove espaços em branco excessivos
  const cleanText = text.replace(/\s+/g, ' ').trim();

  if (cleanText.length === 0) {
    logger.warn('Empty text provided to chunker');
    return [];
  }

  const chunks: TextChunk[] = [];
  let startChar = 0;
  let index = 0;

  while (startChar < cleanText.length) {
    const endChar = Math.min(startChar + chunkSize, cleanText.length);
    let chunkEnd = endChar;

    // Tenta quebrar em um limite de sentença ou palavra
    if (endChar < cleanText.length) {
      // Procura por ponto final, quebra de linha ou espaço
      const sentenceEnd = cleanText.lastIndexOf('.', endChar);
      const lineEnd = cleanText.lastIndexOf('\n', endChar);
      const wordEnd = cleanText.lastIndexOf(' ', endChar);

      const breakPoint = Math.max(sentenceEnd, lineEnd, wordEnd);
      if (breakPoint > startChar) {
        chunkEnd = breakPoint + 1;
      }
    }

    const content = cleanText.slice(startChar, chunkEnd).trim();

    if (content.length > 0) {
      chunks.push({
        content,
        index,
        metadata: {
          startChar,
          endChar: chunkEnd,
        },
      });
      index++;
    }

    // Move para o próximo chunk com overlap
    startChar = chunkEnd - overlap;

    // Evita loop infinito
    if (startChar <= chunks[chunks.length - 1]?.metadata.startChar) {
      startChar = chunkEnd;
    }
  }

  logger.info(
    {
      totalChunks: chunks.length,
      chunkSize,
      overlap,
      textLength: cleanText.length,
    },
    'Text chunked',
  );

  return chunks;
}

/**
 * Estima o número de tokens em um texto (aproximação grosseira)
 * Em média, 1 token ≈ 4 caracteres em inglês/português
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
