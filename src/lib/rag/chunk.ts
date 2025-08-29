import { getDocument, GlobalWorkerOptions, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

// Initialize PDF.js worker with a simple, reliable approach
try {
  // Use a reliable CDN source that works with Vite
  GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.54/build/pdf.worker.min.mjs';
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ PDF.js worker set to CDN source');
  }
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Could not set worker source:', error);
  }
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
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 PDF Parsing: Starting to parse file:', file.name, 'size:', file.size);
    }
    
    // Ensure worker is available before processing
    // The worker is now initialized globally, so this function doesn't need to do anything
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('🔧 PDF Parsing: Worker validated, proceeding with processing');
    // }
    
    const arrayBuffer = await file.arrayBuffer();
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 PDF Parsing: File converted to ArrayBuffer, size:', arrayBuffer.byteLength);
    }
    
    // Check if the file is actually a PDF
    const uint8Array = new Uint8Array(arrayBuffer);
    if (uint8Array.length < 4 || 
        uint8Array[0] !== 0x25 || // %
        uint8Array[1] !== 0x50 || // P
        uint8Array[2] !== 0x44 || // D
        uint8Array[3] !== 0x46) { // F
      throw new Error('File does not appear to be a valid PDF (missing PDF header)');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 PDF Parsing: File header validated as PDF');
    }
    
    // Add more detailed PDF.js options for better compatibility
    const pdfOptions = {
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      standardFontDataUrl: undefined,
      cMapUrl: undefined,
      cMapPacked: false,
      disableFontFace: false,
      disableRange: false,
      disableStream: false,
      disableAutoFetch: false,
      maxImageSize: -1,
      pdfBug: false
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 PDF Parsing: Loading PDF with options:', pdfOptions);
    }
    
    const pdf = await getDocument(pdfOptions).promise;
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 PDF Parsing: PDF loaded successfully, pages:', pdf.numPages);
    }
    
    const pages: string[] = [];
    const totalPages = pdf.numPages;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔧 PDF Parsing: Processing page ${pageNum}/${totalPages}`);
        }
        
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        if (textContent && textContent.items && textContent.items.length > 0) {
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .trim();
          
          if (pageText) {
            pages.push(pageText);
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔧 PDF Parsing: Page ${pageNum} text extracted, length: ${pageText.length}`);
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔧 PDF Parsing: Page ${pageNum} has no text content`);
            }
            pages.push(''); // Empty page
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔧 PDF Parsing: Page ${pageNum} has no text content items`);
          }
          pages.push(''); // Empty page
        }
      } catch (pageError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ PDF Parsing: Error processing page ${pageNum}:`, pageError);
        }
        pages.push(''); // Empty page on error
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 PDF Parsing: Completed successfully. Extracted ${pages.length} pages with text.`);
    }
    
    return pages;
    
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ PDF Parsing: Failed to parse PDF:', error);
    }
    
    // Try alternative parsing method
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 PDF Parsing: Attempting alternative parsing method...');
    }
    
    try {
      const alternativeResult = await parsePdfAlternative(file);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ PDF Parsing: Alternative method succeeded');
      }
      return alternativeResult;
    } catch (alternativeError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ PDF Parsing: Alternative method also failed:', alternativeError);
      }
      throw new Error(`Failed to parse PDF: ${error.message}. Alternative method also failed: ${alternativeError.message}`);
    }
  }
}

/**
 * Alternative PDF parsing method using different approach
 */
async function parsePdfAlternative(file: File): Promise<string[]> {
  try {
    console.log('🔧 Alternative PDF Parsing: Starting...');
    
    // Ensure worker is available for alternative method too
    // The worker is now initialized globally, so this function doesn't need to do anything
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('🔧 Alternative PDF Parsing: Worker validated, proceeding with processing');
    // }
    
    const arrayBuffer = await file.arrayBuffer();
    
    // Try with different PDF.js options
    const pdf = await getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    }).promise;
    
    console.log('🔧 Alternative PDF Parsing: PDF loaded, pages:', pdf.numPages);
    
    const pages: string[] = [];
    const totalPages = pdf.numPages;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        
        const textItems = content.items as TextItem[];
        const pageText = textItems
          .map(item => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        pages.push(pageText);
      } catch (pageError) {
        console.warn(`⚠️ Alternative PDF Parsing: Error on page ${pageNum}:`, pageError);
        pages.push('');
      }
    }
    
    const pagesWithText = pages.filter(p => p.length > 0).length;
    if (pagesWithText === 0) {
      throw new Error('Alternative method also failed to extract text');
    }
    
    console.log('✅ Alternative PDF Parsing: Successfully processed');
    return pages;
    
  } catch (error) {
    console.error('❌ Alternative PDF Parsing failed:', error);
    throw error;
  }
}

/**
 * Create chunks from parsed pages with intelligent splitting
 */
export function createChunks(
  pages: string[],
  options: ChunkOptions = DEFAULT_CHUNK_OPTIONS
): ProcessedChunk[] {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Chunking: Starting with', pages.length, 'pages and options:', options);
  }
  
  const chunks: ProcessedChunk[] = [];
  
  // Simple approach: create chunks from each page
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const pageText = pages[pageIndex];
    const pageNum = pageIndex + 1;
    
    if (!pageText.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Chunking: Page ${pageNum} is empty, skipping`);
      }
      continue;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Chunking: Processing page ${pageNum} with ${pageText.length} characters`);
    }
    
    // Split page into words
    const words = pageText.split(/\s+/).filter(word => word.length > 0);
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Chunking: Page ${pageNum} has ${words.length} words`);
    }
    
    if (words.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Chunking: Page ${pageNum} has no words, skipping`);
      }
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
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔧 Chunking: Creating chunk from page ${pageNum} with ${currentWordCount} words`);
        }
        
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
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Chunking: Creating final chunk from page ${pageNum} with ${currentChunk.length} words`);
      }
      
      chunks.push({
        id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: chunkText,
        pageStart: pageNum,
        pageEnd: pageNum,
        wordCount: currentChunk.length,
        tokenCount: Math.ceil(currentChunk.length * 1.3)
      });
    } else if (currentChunk.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Chunking: Final chunk from page ${pageNum} too small (${currentChunk.length} words), discarding`);
      }
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 Chunking: Created ${chunks.length} total chunks`);
  }
  return chunks;
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
    .replace(/[^\w\s.,;:!?\-()]/g, '') // Remove special chars but keep punctuation
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
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 PDF Processing: Starting with options:', options);
  }
  
  // Stage 1: Parse PDF
  onProgress?.({
    stage: 'parsing',
    current: 0,
    total: 1,
    message: 'Parsing PDF pages...'
  });
  
  const pages = await parsePdfToPages(file);
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 PDF Processing: Parsed pages:', pages.length);
    console.log('🔧 PDF Processing: First page preview:', pages[0]?.substring(0, 100));
  }
  
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
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 PDF Processing: Created chunks:', chunks.length);
    if (chunks.length > 0) {
      console.log('🔧 PDF Processing: First chunk preview:', chunks[0].text.substring(0, 100));
    }
  }
  
  onProgress?.({
    stage: 'chunking',
    current: 1,
    total: 1,
    message: `Created ${chunks.length} chunks`
  });
  
  return chunks;
}

