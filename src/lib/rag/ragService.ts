import { ragDB, type Book, type Chunk, type Embedding, type ChatSession, type ChatMessage } from './db';
import { processPdfWithProgress, type ProcessedChunk, type ProcessingProgress } from './chunk';
import { embedChunks, type EmbeddingResult, DEFAULT_EMBEDDING_OPTIONS } from './embed';
import { searchWithMMR, type SearchResult, DEFAULT_SEARCH_OPTIONS } from './search';
import { composeAnswer, type ComposedAnswer, DEFAULT_ANSWER_OPTIONS } from './summarize';

export interface RAGServiceOptions {
  chunkOptions: {
    targetWords: number;
    overlap: number;
    minChunkSize: number;
    maxChunkSize: number;
  };
  embeddingOptions: {
    modelName: string;
    pooling: 'mean' | 'cls';
    normalize: boolean;
    batchSize: number;
  };
  searchOptions: {
    useCosine: boolean;
    useBM25: boolean;
    cosineWeight: number;
    bm25Weight: number;
    topK: number;
    mmrLambda: number;
    minScore: number;
  };
  answerOptions: {
    maxAnswerLength: number;
    includePageNumbers: boolean;
    includeBookTitles: boolean;
    confidenceThreshold: number;
    maxSources: number;
  };
}

export const DEFAULT_RAG_OPTIONS: RAGServiceOptions = {
  chunkOptions: {
    targetWords: 900,
    overlap: 150,
    minChunkSize: 300,
    maxChunkSize: 1200
  },
  embeddingOptions: {
    modelName: 'Xenova/all-MiniLM-L6-v2',
    pooling: 'mean',
    normalize: true,
    batchSize: 8
  },
  searchOptions: {
    useCosine: true,
    useBM25: true,
    cosineWeight: 0.7,
    bm25Weight: 0.3,
    topK: 50,
    mmrLambda: 0.5,
    minScore: 0.1
  },
  answerOptions: {
    maxAnswerLength: 2000,
    includePageNumbers: true,
    includeBookTitles: true,
    confidenceThreshold: 0.3,
    maxSources: 6
  }
};

export interface BookProcessingResult {
  book: Book;
  chunks: Chunk[];
  embeddings: Embedding[];
  processingTime: number;
  totalChunks: number;
  totalEmbeddings: number;
}

export interface QueryResult {
  answer: ComposedAnswer;
  searchResults: SearchResult[];
  processingTime: number;
  query: string;
  subject: string;
}

export class RAGService {
  private options: RAGServiceOptions;

  constructor(options: Partial<RAGServiceOptions> = {}) {
    this.options = { ...DEFAULT_RAG_OPTIONS, ...options };
  }

  /**
   * Process and ingest a PDF textbook
   */
  async processTextbook(
    file: File,
    title: string,
    subject: string,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<BookProcessingResult> {
    const startTime = performance.now();
    
    try {
      // Create book record
      const bookId = crypto.randomUUID();
      const book: Book = {
        id: bookId,
        title,
        subject,
        pages: 0, // Will be updated after parsing
        fileSize: file.size,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'processing'
      };

      // Add book to database
      await ragDB.books.add(book);

      // Process PDF
      const processedChunks = await processPdfWithProgress(
        file,
        this.options.chunkOptions,
        onProgress
      );

      // Update book with page count
      const pageCount = Math.max(...processedChunks.map(c => c.pageEnd));
      await ragDB.books.update(bookId, { pages: pageCount });

      // Create chunk records
      const chunks: Chunk[] = processedChunks.map(chunk => ({
        id: crypto.randomUUID(),
        bookId,
        subject,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
        section: chunk.section,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        embedVersion: this.options.embeddingOptions.modelName,
        createdAt: Date.now()
      }));

      // Add chunks to database
      await ragDB.chunks.bulkAdd(chunks);

      // Generate embeddings
      onProgress?.({
        stage: 'embedding',
        current: 0,
        total: chunks.length,
        message: 'Generating embeddings...'
      });

      const chunkData = chunks.map(chunk => ({
        text: chunk.text,
        id: chunk.id
      }));

      const embeddingsMap = await embedChunks(
        chunkData,
        this.options.embeddingOptions,
        (current, total, message) => {
          onProgress?.({
            stage: 'embedding',
            current,
            total,
            message
          });
        }
      );

      // Create embedding records
      const embeddings: Embedding[] = chunks.map(chunk => {
        const embedding = embeddingsMap.get(chunk.id);
        if (!embedding) {
          throw new Error(`Missing embedding for chunk ${chunk.id}`);
        }

        return {
          id: chunk.id, // Same ID as chunk
          bookId,
          subject,
          dim: embedding.dimension,
          values: embedding.values,
          embedVersion: this.options.embeddingOptions.modelName,
          createdAt: Date.now()
        };
      });

      // Add embeddings to database
      await ragDB.embeddings.bulkAdd(embeddings);

      // Update book status
      await ragDB.books.update(bookId, { 
        status: 'completed',
        updatedAt: Date.now()
      });

      const processingTime = performance.now() - startTime;

      return {
        book: { ...book, pages: pageCount, status: 'completed' },
        chunks,
        embeddings,
        processingTime,
        totalChunks: chunks.length,
        totalEmbeddings: embeddings.length
      };

    } catch (error) {
      // Update book status on error
      if (bookId) {
        await ragDB.books.update(bookId, { 
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: Date.now()
        });
      }

      console.error('Error processing textbook:', error);
      throw new Error(`Failed to process textbook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query the knowledge base
   */
  async query(
    query: string,
    subject: string,
    userId: string,
    sessionId?: string
  ): Promise<QueryResult> {
    const startTime = performance.now();
    
    try {
      // Get chunks and embeddings for the subject
      const [chunks, embeddings] = await Promise.all([
        ragDB.getChunksBySubject(subject),
        ragDB.getEmbeddingsBySubject(subject)
      ]);

      if (chunks.length === 0 || embeddings.length === 0) {
        throw new Error(`No knowledge base found for subject: ${subject}`);
      }

      // Generate query embedding
      const [queryEmbedding] = await embedChunks(
        [{ text: query, id: 'query' }],
        this.options.embeddingOptions
      );

      const queryVector = queryEmbedding.get('query');
      if (!queryVector) {
        throw new Error('Failed to generate query embedding');
      }

      // Search for relevant chunks
      const searchResults = await searchWithMMR(
        query,
        queryVector.values,
        chunks,
        embeddings,
        this.options.searchOptions
      );

      // Compose answer
      const answer = composeAnswer(
        searchResults,
        query,
        this.options.answerOptions
      );

      // Create or update chat session
      if (!sessionId) {
        const session: ChatSession = {
          id: crypto.randomUUID(),
          userId,
          subject,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await ragDB.chatSessions.add(session);
        sessionId = session.id;
      }

      // Add user message
      await ragDB.addChatMessage(sessionId, {
        type: 'user',
        content: query,
        timestamp: Date.now()
      });

      // Add AI response
      await ragDB.addChatMessage(sessionId, {
        type: 'ai',
        content: answer.answer,
        timestamp: Date.now(),
        sources: answer.sources
      });

      const processingTime = performance.now() - startTime;

      return {
        answer,
        searchResults,
        processingTime,
        query,
        subject
      };

    } catch (error) {
      console.error('Error processing query:', error);
      throw new Error(`Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get books by subject
   */
  async getBooksBySubject(subject: string): Promise<Book[]> {
    return ragDB.getBooksBySubject(subject);
  }

  /**
   * Get all subjects with books
   */
  async getSubjects(): Promise<string[]> {
    const books = await ragDB.books.toArray();
    return [...new Set(books.map(book => book.subject))];
  }

  /**
   * Delete a book and all associated data
   */
  async deleteBook(bookId: string): Promise<void> {
    await ragDB.deleteBook(bookId);
  }

  /**
   * Get chat sessions for a subject
   */
  async getChatSessions(subject: string): Promise<ChatSession[]> {
    return ragDB.getChatSessionsBySubject(subject);
  }

  /**
   * Export database for backup
   */
  async exportDatabase(): Promise<{
    books: Book[];
    chunks: Chunk[];
    embeddings: Embedding[];
    chatSessions: ChatSession[];
    chatMessages: ChatMessage[];
  }> {
    const [books, chunks, embeddings, chatSessions, chatMessages] = await Promise.all([
      ragDB.books.toArray(),
      ragDB.chunks.toArray(),
      ragDB.embeddings.toArray(),
      ragDB.chatSessions.toArray(),
      ragDB.chatMessages.toArray()
    ]);

    return {
      books,
      chunks,
      embeddings,
      chatSessions,
      chatMessages
    };
  }

  /**
   * Import database from backup
   */
  async importDatabase(data: {
    books: Book[];
    chunks: Chunk[];
    embeddings: Embedding[];
    chatSessions: ChatSession[];
    chatMessages: ChatMessage[];
  }): Promise<void> {
    await ragDB.transaction('rw', [
      ragDB.books,
      ragDB.chunks,
      ragDB.embeddings,
      ragDB.chatSessions,
      ragDB.chatMessages
    ], async () => {
      // Clear existing data
      await Promise.all([
        ragDB.books.clear(),
        ragDB.chunks.clear(),
        ragDB.embeddings.clear(),
        ragDB.chatSessions.clear(),
        ragDB.chatMessages.clear()
      ]);

      // Import new data
      await Promise.all([
        ragDB.books.bulkAdd(data.books),
        ragDB.chunks.bulkAdd(data.chunks),
        ragDB.embeddings.bulkAdd(data.embeddings),
        ragDB.chatSessions.bulkAdd(data.chatSessions),
        ragDB.chatMessages.bulkAdd(data.chatMessages)
      ]);
    });
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    totalBooks: number;
    totalChunks: number;
    totalEmbeddings: number;
    totalChatSessions: number;
    subjects: string[];
    totalSize: number;
  }> {
    const [books, chunks, embeddings, chatSessions] = await Promise.all([
      ragDB.books.toArray(),
      ragDB.chunks.toArray(),
      ragDB.embeddings.toArray(),
      ragDB.chatSessions.toArray()
    ]);

    const subjects = [...new Set(books.map(book => book.subject))];
    const totalSize = books.reduce((sum, book) => sum + book.fileSize, 0);

    return {
      totalBooks: books.length,
      totalChunks: chunks.length,
      totalEmbeddings: embeddings.length,
      totalChatSessions: chatSessions.length,
      subjects,
      totalSize
    };
  }
}

// Export singleton instance
export const ragService = new RAGService();
