// Browser-compatible vector database using IndexedDB
import { ragDB } from './db';

export interface VectorDocument {
  id: string;
  text: string;
  metadata: {
    bookId: string;
    bookTitle: string;
    subject: string;
    pageStart: number;
    pageEnd: number;
    section?: string;
    chunkIndex: number;
  };
  embedding?: number[];
}

export interface SearchResult {
  id: string;
  text: string;
  metadata: {
    bookId: string;
    bookTitle: string;
    subject: string;
    pageStart: number;
    pageEnd: number;
    section?: string;
    chunkIndex: number;
  };
  distance: number;
  score: number;
}

// Simple cosine similarity calculation
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class VectorDatabase {
  private documents: Map<string, VectorDocument> = new Map();
  
  constructor() {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 VectorDB: Initialized browser-compatible vector database');
    }
    this.loadFromIndexedDB();
  }
  
  /**
   * Load documents from IndexedDB on initialization
   */
  private async loadFromIndexedDB(): Promise<void> {
    try {
      const embeddings = await ragDB.embeddings.toArray();
      for (const embedding of embeddings) {
        if (embedding.values && embedding.id) {
          const chunk = await ragDB.chunks.get(embedding.id);
          if (chunk) {
            const book = await ragDB.books.get(chunk.bookId);
            if (book) {
              this.documents.set(embedding.id, {
                id: embedding.id,
                text: chunk.text,
                metadata: {
                  bookId: chunk.bookId,
                  bookTitle: book.title,
                  subject: chunk.subject,
                  pageStart: chunk.pageStart,
                  pageEnd: chunk.pageEnd,
                  section: chunk.section || undefined,
                  chunkIndex: 0
                },
                embedding: Array.from(embedding.values)
              });
            }
          }
        }
      }
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ VectorDB: Loaded ${this.documents.size} documents from IndexedDB`);
      }
    } catch (error) {
      console.error('❌ VectorDB Load Error:', error);
    }
  }
  
  /**
   * Add documents with embeddings to the vector database
   */
  async addDocuments(documents: VectorDocument[]): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 VectorDB: Adding ${documents.length} documents`);
      }
      
      // Add to in-memory store
      for (const doc of documents) {
        this.documents.set(doc.id, doc);
        
        // Also persist to IndexedDB
        if (doc.embedding) {
          await ragDB.embeddings.put({
            id: doc.id,  // ✅ Fixed: use 'id' not 'chunkId'
            bookId: doc.metadata.bookId,  // ✅ Added: required field
            subject: doc.metadata.subject,  // ✅ Added: required field
            dim: doc.embedding.length,  // ✅ Fixed: use 'dim' not 'dimension'
            values: new Float32Array(doc.embedding),  // ✅ Fixed: use 'values' not 'embedding'
            embedVersion: 'cohere-embed-english-v3.0',  // ✅ Fixed: use 'embedVersion' not 'modelName'
            createdAt: Date.now()  // ✅ Added: required field
          });
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ VectorDB: Successfully added ${documents.length} documents`);
      }
    } catch (error) {
      console.error('❌ VectorDB Add Error:', error);
      throw new Error(`Failed to add documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Search for similar documents
   */
  async search(
    queryEmbedding: number[],
    subject?: string,
    topK: number = 10
  ): Promise<SearchResult[]> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 VectorDB: Searching for ${topK} similar documents`);
      }
      
      const candidates: SearchResult[] = [];
      
      // Search through all documents
      this.documents.forEach((doc, id) => {
        // Filter by subject if specified
        if (subject && doc.metadata.subject !== subject) {
          return;
        }
        
        // Skip documents without embeddings
        if (!doc.embedding) {
          return;
        }
        
        // Calculate cosine similarity
        const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
        const distance = 1 - similarity;
        
        candidates.push({
          id,
          text: doc.text,
          metadata: doc.metadata,
          distance,
          score: similarity
        });
      });
      
      // Sort by similarity (highest first) and take top K
      const searchResults = candidates
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ VectorDB: Found ${searchResults.length} similar documents`);
      }
      return searchResults;
    } catch (error) {
      console.error('❌ VectorDB Search Error:', error);
      throw new Error(`Failed to search documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Delete documents by book ID
   */
  async deleteByBookId(bookId: string): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ VectorDB: Deleting documents for book ${bookId}`);
      }
      
      // Remove from in-memory store
      const idsToDelete: string[] = [];
      this.documents.forEach((doc, id) => {
        if (doc.metadata.bookId === bookId) {
          idsToDelete.push(id);
        }
      });
      
      for (const id of idsToDelete) {
        this.documents.delete(id);
        // Also remove from IndexedDB
        await ragDB.embeddings.delete(id);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ VectorDB: Deleted ${idsToDelete.length} documents for book ${bookId}`);
      }
    } catch (error) {
      console.error('❌ VectorDB Delete Error:', error);
      throw new Error(`Failed to delete documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get collection statistics
   */
  async getStats(): Promise<{
    totalDocuments: number;
    subjects: string[];
    books: string[];
  }> {
    try {
      const totalDocuments = this.documents.size;
      const subjects = Array.from(new Set(Array.from(this.documents.values()).map(doc => doc.metadata.subject)));
      const books = Array.from(new Set(Array.from(this.documents.values()).map(doc => doc.metadata.bookId)));
      
      return {
        totalDocuments,
        subjects,
        books
      };
    } catch (error) {
      console.error('❌ VectorDB Stats Error:', error);
      return {
        totalDocuments: 0,
        subjects: [],
        books: []
      };
    }
  }
  
  /**
   * Clear all documents (useful for testing)
   */
  async clearAll(): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ VectorDB: Clearing all documents');
      }
      
      // Clear in-memory store
      this.documents.clear();
      
      // Clear IndexedDB
      await ragDB.embeddings.clear();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ VectorDB: Cleared all documents');
      }
    } catch (error) {
      console.error('❌ VectorDB Clear Error:', error);
      throw new Error(`Failed to clear documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const vectorDB = new VectorDatabase();
