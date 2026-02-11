import pdfParse from 'pdf-parse';
import { readFileSync } from 'node:fs';
import { logger } from '../utils/logger.js';
import { ProcessingError } from '../utils/errors.js';

/**
 * Resultado da extração de texto
 */
export interface ExtractedText {
  text: string;
  pages: number;
  metadata?: {
    title?: string;
    author?: string;
    [key: string]: unknown;
  };
}

/**
 * Extrai texto de um arquivo PDF
 * Processa em chunks de páginas para evitar picos de CPU
 */
export async function extractTextFromPDF(
  filePath: string,
): Promise<ExtractedText> {
  try {
    const dataBuffer = readFileSync(filePath);
    const data = await pdfParse(dataBuffer, {
      max: 0, // Sem limite de páginas
    });

    logger.info(
      { filePath, pages: data.numpages, textLength: data.text.length },
      'PDF text extracted',
    );

    return {
      text: data.text,
      pages: data.numpages,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
      },
    };
  } catch (error) {
    logger.error({ error, filePath }, 'Failed to extract PDF text');
    throw new ProcessingError(`Failed to extract text from PDF: ${error}`);
  }
}

/**
 * TODO: Implementar extração de outros formatos (DOCX, TXT, etc.)
 */
export async function extractText(
  filePath: string,
  mimeType?: string,
): Promise<ExtractedText> {
  // Por enquanto, apenas PDF
  if (mimeType === 'application/pdf' || filePath.endsWith('.pdf')) {
    return extractTextFromPDF(filePath);
  }

  // Texto puro
  if (
    mimeType === 'text/plain' ||
    filePath.endsWith('.txt') ||
    filePath.endsWith('.md')
  ) {
    const text = readFileSync(filePath, 'utf-8');
    return {
      text,
      pages: 1,
      metadata: {},
    };
  }

  throw new ProcessingError(`Unsupported file type: ${mimeType || 'unknown'}`);
}
