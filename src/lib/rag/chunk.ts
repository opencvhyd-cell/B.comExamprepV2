import { getDocument, GlobalWorkerOptions, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

// Set up PDF.js worker with fallback
try {
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (error) {
  // Fallback for environments where import.meta.url is not available
  console.warn('Could not set PDF.js worker URL, using default:', error);
  GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export interface ChunkOptions {
  targetWords: number;
  overlap: number;
  minChunkSize: number;
  maxChunkSize: number;
}

export interface ProcessedChunk {
  id: string;
  text: string;
  pageStart: number;
  pageEnd: number;
  section?: string;
  wordCount: number;
  tokenCount: number;
}

export interface ProcessingProgress {
  stage: 'parsing' | 'chunking' | 'embedding';
  current: number;
  total: number;
  message: string;
}

export const DEFAULT_CHUNK_OPTIONS: ChunkOptions = {
  targetWords: 900,
  overlap: 150,
  minChunkSize: 50,  // Reduced from 300 to ensure we get chunks
  maxChunkSize: 1200
};

/**
 * Parse PDF file to extract text content page by page
 */
export async function parsePdfToPages(file: File): Promise<string[]> {
  try {
    console.log('🔧 PDF Parsing: Starting to parse file:', file.name, 'size:', file.size);
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf: PDFDocumentProxy = await getDocument({ data: arrayBuffer }).promise;
    
    console.log('🔧 PDF Parsing: PDF loaded, pages:', pdf.numPages);
    
    const pages: string[] = [];
    const totalPages = pdf.numPages;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page: PDFPageProxy = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      
      // Extract text from text items
      const textItems = content.items as TextItem[];
      console.log(`🔧 PDF Parsing: Page ${pageNum} has ${textItems.length} text items`);
      
      const pageText = textItems
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      console.log(`🔧 PDF Parsing: Page ${pageNum} text length:`, pageText.length);
      if (pageText.length > 0) {
        console.log(`🔧 PDF Parsing: Page ${pageNum} preview:`, pageText.substring(0, 100));
      }
      
      pages.push(pageText);
    }
    
    console.log('🔧 PDF Parsing: Total pages with text:', pages.filter(p => p.length > 0).length);
    return pages;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create chunks from parsed pages with intelligent splitting
 */
export function createChunks(
  pages: string[],
  options: ChunkOptions = DEFAULT_CHUNK_OPTIONS
): ProcessedChunk[] {
  console.log('🔧 Chunking: Starting with', pages.length, 'pages and options:', options);
  
  const chunks: ProcessedChunk[] = [];
  
  // Simple approach: create chunks from each page
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const pageText = pages[pageIndex];
    const pageNum = pageIndex + 1;
    
    if (!pageText.trim()) {
      console.log(`🔧 Chunking: Page ${pageNum} is empty, skipping`);
      continue;
    }
    
    console.log(`🔧 Chunking: Processing page ${pageNum} with ${pageText.length} characters`);
    
    // Split page into words
    const words = pageText.split(/\s+/).filter(word => word.length > 0);
    console.log(`🔧 Chunking: Page ${pageNum} has ${words.length} words`);
    
    if (words.length === 0) {
      console.log(`🔧 Chunking: Page ${pageNum} has no words, skipping`);
      continue;
    }
    
    // Create chunks from this page
    let currentChunk: string[] = [];
    let currentWordCount = 0;
    
    for (const word of words) {
      currentChunk.push(word);
      currentWordCount++;
      
      // If we've reached target size, create a chunk
      if (currentWordCount >= options.targetWords) {
        const chunkText = currentChunk.join(' ').trim();
        console.log(`🔧 Chunking: Creating chunk from page ${pageNum} with ${currentWordCount} words`);
        
        chunks.push({
          id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: chunkText,
          pageStart: pageNum,
          pageEnd: pageNum,
          wordCount: currentWordCount,
          tokenCount: Math.ceil(currentWordCount * 1.3)
        });
        
        // Reset for next chunk (with overlap)
        if (options.overlap > 0) {
          const overlapWords = currentChunk.slice(-options.overlap);
          currentChunk = overlapWords;
          currentWordCount = overlapWords.length;
        } else {
          currentChunk = [];
          currentWordCount = 0;
        }
      }
    }
    
    // Add remaining words as a chunk if they meet minimum size
    if (currentChunk.length > 0 && currentChunk.length >= options.minChunkSize) {
      const chunkText = currentChunk.join(' ').trim();
      console.log(`🔧 Chunking: Creating final chunk from page ${pageNum} with ${currentChunk.length} words`);
      
      chunks.push({
        id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: chunkText,
        pageStart: pageNum,
        pageEnd: pageNum,
        wordCount: currentChunk.length,
        tokenCount: Math.ceil(currentChunk.length * 1.3)
      });
    } else if (currentChunk.length > 0) {
      console.log(`🔧 Chunking: Final chunk from page ${pageNum} too small (${currentChunk.length} words), discarding`);
    }
  }
  
  console.log(`🔧 Chunking: Created ${chunks.length} total chunks`);
  return chunks;
}

/**
 * Detect if a page contains a section break (heading, chapter marker)
 */
function detectSectionBreak(pageText: string): boolean {
  const sectionPatterns = [
    /^\s*(chapter|section|unit|part)\s*\d+/i,
    /^\s*\d+\.\s*\d+/,
    /^\s*[A-Z][A-Z\s]{3,}/,
    /^\s*[IVX]+\./,
    /^\s*[A-Z]\s*\./
  ];
  
  const firstLines = pageText.split('\n').slice(0, 3);
  return firstLines.some(line => 
    sectionPatterns.some(pattern => pattern.test(line.trim()))
  );
}

/**
 * Estimate token count for a text (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 0.75 words for English text
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount * 1.3);
}

/**
 * Clean and normalize text for better chunking
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/[^\w\s\.\,\;\:\!\?\-\(\)]/g, '') // Remove special chars but keep punctuation
    .trim();
}

/**
 * Process PDF with progress tracking
 */
export async function processPdfWithProgress(
  file: File,
  options: ChunkOptions = DEFAULT_CHUNK_OPTIONS,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<ProcessedChunk[]> {
  
  console.log('🔧 PDF Processing: Starting with options:', options);
  
  // Stage 1: Parse PDF
  onProgress?.({
    stage: 'parsing',
    current: 0,
    total: 1,
    message: 'Parsing PDF pages...'
  });
  
  const pages = await parsePdfToPages(file);
  console.log('🔧 PDF Processing: Parsed pages:', pages.length);
  console.log('🔧 PDF Processing: First page preview:', pages[0]?.substring(0, 100));
  
  onProgress?.({
    stage: 'parsing',
    current: 1,
    total: 1,
    message: `Parsed ${pages.length} pages`
  });
  
  // Stage 2: Create chunks
  onProgress?.({
    stage: 'chunking',
    current: 0,
    total: 1,
    message: 'Creating text chunks...'
  });
  
  const chunks = createChunks(pages, options);
  console.log('🔧 PDF Processing: Created chunks:', chunks.length);
  if (chunks.length > 0) {
    console.log('🔧 PDF Processing: First chunk preview:', chunks[0].text.substring(0, 100));
  }
  
  onProgress?.({
    stage: 'chunking',
    current: 1,
    total: 1,
    message: `Created ${chunks.length} chunks`
  });
  
  return chunks;
}
