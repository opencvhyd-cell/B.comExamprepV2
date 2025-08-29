import Dexie, { Table } from 'dexie';

export interface Book {
  id: string;
  title: string;
  subject: string;
  pages: number;
  fileSize: number;
  createdAt: number;
  updatedAt: number;
  status: 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

export interface Chunk {
  id: string;
  bookId: string;
  subject: string;
  pageStart: number;
  pageEnd: number;
  section?: string;
  text: string;
  tokenCount: number;
  embedVersion: string;
  createdAt: number;
}

export interface Embedding {
  id: string; // same as chunkId
  bookId: string;
  subject: string;
  dim: number;
  values: Float32Array;
  embedVersion: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  subject: string;
  bookId?: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  sources?: Source[];
}

export interface Source {
  chunkId: string;
  bookId: string;
  bookTitle: string;
  pageStart: number;
  pageEnd: number;
  relevance: number;
}

export interface DatabaseStats {
  totalBooks: number;
  totalChunks: number;
  totalChatSessions: number;
  books: number;
  chunks: number;
  embeddings: number;
  vectorDocuments: number;
}

export interface BookProcessingResult {
  book: Book;
  totalChunks: number;
  totalEmbeddings: number;
  processingTime: number;
}

class RAGDatabase extends Dexie {
  books!: Table<Book, string>;
  chunks!: Table<Chunk, string>;
  embeddings!: Table<Embedding, string>;
  chatSessions!: Table<ChatSession, string>;
  chatMessages!: Table<ChatMessage, string>;

  constructor() {
    super('RAGDatabase');
    
    this.version(1).stores({
      books: 'id, subject, createdAt, status',
      chunks: 'id, bookId, subject, pageStart, pageEnd',
      embeddings: 'id, bookId, subject',
      chatSessions: 'id, userId, subject, createdAt',
      chatMessages: 'id, sessionId, timestamp'
    });

    // Add indexes for better query performance
    this.version(2).stores({
      chunks: 'id, bookId, subject, pageStart, pageEnd, *text',
      embeddings: 'id, bookId, subject, embedVersion'
    });
  }

  // Helper methods for common operations
  async getBooksBySubject(subject: string): Promise<Book[]> {
    return this.books.where('subject').equals(subject).toArray();
  }

  async getChunksBySubject(subject: string): Promise<Chunk[]> {
    return this.chunks.where('subject').equals(subject).toArray();
  }

  async getEmbeddingsBySubject(subject: string): Promise<Embedding[]> {
    return this.embeddings.where('subject').equals(subject).toArray();
  }

  async getBookWithChunks(bookId: string): Promise<{ book: Book; chunks: Chunk[] } | null> {
    const book = await this.books.get(bookId);
    if (!book) return null;
    
    const chunks = await this.chunks.where('bookId').equals(bookId).toArray();
    return { book, chunks };
  }

  async deleteBook(bookId: string): Promise<void> {
    await this.transaction('rw', [this.books, this.chunks, this.embeddings], async () => {
      await this.books.delete(bookId);
      await this.chunks.where('bookId').equals(bookId).delete();
      await this.embeddings.where('bookId').equals(bookId).delete();
    });
  }

  async getChatSessionsBySubject(subject: string): Promise<ChatSession[]> {
    return this.chatSessions.where('subject').equals(subject).reverse().sortBy('updatedAt');
  }

  async addChatMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'sessionId'>): Promise<string> {
    const id = crypto.randomUUID();
    const chatMessage: ChatMessage = {
      ...message,
      id,
      sessionId
    };
    
    await this.chatMessages.add(chatMessage);
    
    // Update session timestamp
    await this.chatSessions.update(sessionId, {
      updatedAt: Date.now()
    });
    
    return id;
  }
}

export const ragDB = new RAGDatabase();
