import { ragDB, type Book, type Chunk, type Embedding, type ChatSession, type ChatMessage } from './db';
import { processPdfWithProgress, type ProcessingProgress } from './chunk';
import { embedChunks } from './embedCohere';
import { searchWithMMR } from './search';
import { summarizeChunks } from './llmGroq';
import { vectorDB, type VectorDocument } from './vectorDB';

export interface BookProcessingResult {
  book: Book;
  totalChunks: number;
  totalEmbeddings: number;
  processingTime: number;
}

export interface QueryResult {
  answer: string;
  sources: Array<{
    text: string;
    bookTitle: string;
    pageStart: number;
    pageEnd: number;
    score: number;
  }>;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class RAGServiceAPI {
  /**
   * Process a textbook PDF using external APIs
   */
  async processTextbook(
    file: File,
    title: string,
    subject: string,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<BookProcessingResult> {
    const startTime = performance.now();
    
    try {
      console.log(`🚀 RAG Service: Starting processing for "${title}"`);
      console.log(`📁 File: ${file.name}, Size: ${file.size} bytes`);
      console.log(`📚 Subject: ${subject}`);
      
      // Validate file
      if (!file || file.size === 0) {
        throw new Error('Invalid file: File is empty or undefined');
      }
      
      if (file.type !== 'application/pdf') {
        throw new Error('Invalid file type: Only PDF files are supported');
      }
      
      // Step 1: Parse PDF and create chunks
      onProgress?.({
        stage: 'parsing',
        current: 0,
        total: 100,
        message: 'Parsing PDF and creating chunks...'
      });
      
      console.log('📖 Step 1: Parsing PDF...');
      const chunks = await processPdfWithProgress(file, undefined, onProgress);
      
      if (!chunks || chunks.length === 0) {
        throw new Error('Failed to parse PDF: No chunks created');
      }
      
      console.log(`✅ Created ${chunks.length} chunks from PDF`);
      
      // Step 2: Generate embeddings using Cohere
      onProgress?.({
        stage: 'embedding',
        current: 0,
        total: chunks.length,
        message: 'Generating embeddings with Cohere API...'
      });
      
      console.log('🔤 Step 2: Generating embeddings...');
      const embeddings = await embedChunks(
        chunks.map(chunk => ({ text: chunk.text, id: chunk.id })),
        undefined,
        (current, total, message) => {
          onProgress?.({
            stage: 'embedding',
            current,
            total,
            message
          });
        }
      );
      
      if (!embeddings || embeddings.size === 0) {
        throw new Error('Failed to generate embeddings: No embeddings created');
      }
      
      console.log(`✅ Generated ${embeddings.size} embeddings`);
      
      // Step 3: Create book record
      console.log('📚 Step 3: Creating book record...');
      const book: Book = {
        id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: title || 'Untitled Textbook',
        subject: subject || 'General',
        pages: Math.max(...chunks.map(c => c.pageEnd)),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'completed',
        fileSize: file.size
      };
      
      console.log('📖 Book record created:', book);
      
      // Step 4: Save to local database
      console.log('💾 Step 4: Saving to local database...');
      await ragDB.books.add(book);
      console.log('✅ Book saved to database');
      
      // Step 5: Save chunks to local database
      console.log('📝 Step 5: Saving chunks to database...');
      const chunkRecords: Chunk[] = chunks.map((chunk) => ({
        id: chunk.id,
        bookId: book.id,
        subject,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
        section: chunk.section || undefined,
        text: chunk.text,
        tokenCount: chunk.tokenCount,
        embedVersion: 'cohere-v3',
        createdAt: Date.now()
      }));
      
      await ragDB.chunks.bulkAdd(chunkRecords);
      console.log(`✅ ${chunkRecords.length} chunks saved to database`);
      
      // Step 6: Save embeddings to local database
      console.log('🔤 Step 6: Saving embeddings to database...');
      const embeddingRecords: Embedding[] = Array.from(embeddings.entries()).map(([chunkId, embedding]) => ({
        id: chunkId,
        bookId: book.id,
        subject,
        dim: embedding.dimension,
        values: embedding.values,
        embedVersion: 'cohere-v3',
        createdAt: Date.now()
      }));
      
      await ragDB.embeddings.bulkAdd(embeddingRecords);
      console.log(`✅ ${embeddingRecords.length} embeddings saved to database`);
      
      // Step 7: Add to vector database (ChromaDB)
      console.log('🔍 Step 7: Adding to vector database...');
      const vectorDocuments: VectorDocument[] = chunks.map((chunk, index) => {
        const embedding = embeddings.get(chunk.id);
        return {
          id: chunk.id,
          text: chunk.text,
          metadata: {
            bookId: book.id,
            bookTitle: title,
            subject,
            pageStart: chunk.pageStart,
            pageEnd: chunk.pageEnd,
            section: chunk.section || undefined,
            chunkIndex: index
          },
          embedding: embedding ? Array.from(embedding.values) : undefined
        };
      });
      
      await vectorDB.addDocuments(vectorDocuments);
      console.log(`✅ ${vectorDocuments.length} documents added to vector database`);
      
      const processingTime = performance.now() - startTime;
      
      console.log(`✅ RAG Service: Completed processing in ${processingTime.toFixed(2)}ms`);
      
      return {
        book,
        totalChunks: chunks.length,
        totalEmbeddings: embeddings.size,
        processingTime
      };
    } catch (error) {
      console.error('❌ RAG Service Error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to process textbook';
      if (error instanceof Error) {
        if (error.message.includes('COHERE_API_KEY')) {
          errorMessage = 'Cohere API key not configured. Please check your environment variables.';
        } else if (error.message.includes('GROQ_API_KEY')) {
          errorMessage = 'Groq API key not configured. Please check your environment variables.';
        } else if (error.message.includes('PDF')) {
          errorMessage = `PDF processing failed: ${error.message}`;
        } else if (error.message.includes('embedding')) {
          errorMessage = `Embedding generation failed: ${error.message}`;
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(errorMessage);
    }
  }
  
  /**
   * Query the RAG system using external APIs
   */
  async query(
    question: string,
    subject?: string,
    topK: number = 5
  ): Promise<QueryResult> {
    try {
            if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 RAG Service: Processing query: "${question}"`);
      }
      
      // Step 1: Generate embedding for the question
      const questionEmbedding = await embedChunks([
        { text: question, id: 'query' }
      ]);
      
      const queryVector = Array.from(questionEmbedding.get('query')!.values);
      
      // Step 2: Search vector database
      const searchResults = await vectorDB.search(queryVector, subject, topK);
      
      if (searchResults.length === 0) {
        return {
          answer: "I couldn't find any relevant information in the uploaded textbooks to answer your question.",
          sources: [],
          model: 'groq-llama3',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
        };
      }
      
      // Step 3: Generate answer using Groq LLM
      const llmResponse = await summarizeChunks(
        searchResults.map(result => ({
          text: result.text,
          bookTitle: result.metadata.bookTitle,
          pageStart: result.metadata.pageStart,
          pageEnd: result.metadata.pageEnd
        })),
        question
      );
      
      // Step 4: Format sources
      const sources = searchResults.map(result => ({
        text: result.text.substring(0, 200) + '...',
        bookTitle: result.metadata.bookTitle,
        pageStart: result.metadata.pageStart,
        pageEnd: result.metadata.pageEnd,
        score: result.score
      }));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ RAG Service: Generated answer with ${sources.length} sources`);
      }
      
      return {
        answer: llmResponse.text,
        sources,
        model: llmResponse.model,
        usage: llmResponse.usage
      };
    } catch (error) {
      console.error('❌ RAG Service Query Error:', error);
      throw new Error(`Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get books by subject
   */
  async getBooksBySubject(subject: string): Promise<Book[]> {
    try {
      return await ragDB.books.where('subject').equals(subject).toArray();
    } catch (error) {
      console.error('Error getting books by subject:', error);
      return [];
    }
  }
  
  /**
   * Get all books
   */
  async getAllBooks(): Promise<Book[]> {
    try {
      return await ragDB.books.toArray();
    } catch (error) {
      console.error('Error getting books:', error);
      return [];
    }
  }

  /**
   * Get all subjects
   */
  async getSubjects(): Promise<string[]> {
    try {
      const books = await ragDB.books.toArray();
      const subjects = Array.from(new Set(books.map(book => book.subject)));
      return subjects.sort();
    } catch (error) {
      console.error('Error getting subjects:', error);
      return [];
    }
  }
  
  /**
   * Delete a book and all associated data
   */
  async deleteBook(bookId: string): Promise<void> {
    try {
      console.log(`🚨 deleteBook called for ${bookId}`);
      console.trace('🚨 Delete book call stack:');
      
      // Add a delay to help identify what's calling this
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`🚨 Proceeding with deletion of ${bookId} after 1 second delay`);
      
      // Delete from local database
      await ragDB.books.delete(bookId);
      await ragDB.chunks.where('bookId').equals(bookId).delete();
      await ragDB.embeddings.where('bookId').equals(bookId).delete();
      
      // Delete from vector database
      await vectorDB.deleteByBookId(bookId);
      
      console.log(`✅ Deleted book ${bookId} and all associated data`);
    } catch (error) {
      console.error('Error deleting book:', error);
      throw new Error(`Failed to delete book: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get chat sessions
   */
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      return await ragDB.chatSessions.where('userId').equals(userId).toArray();
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      return [];
    }
  }
  
  /**
   * Save chat message
   */
  async saveChatMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<void> {
    try {
      const { sessionId: _, ...messageWithoutSessionId } = message;
      const chatMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        timestamp: Date.now(),
        ...messageWithoutSessionId
      };
      
      await ragDB.chatMessages.add(chatMessage);
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  }
  
  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    books: number;
    chunks: number;
    embeddings: number;
    vectorDocuments: number;
  }> {
    try {
      const books = await ragDB.books.count();
      const chunks = await ragDB.chunks.count();
      const embeddings = await ragDB.embeddings.count();
      
      const vectorStats = await vectorDB.getStats();
      
      return {
        books,
        chunks,
        embeddings,
        vectorDocuments: vectorStats.totalDocuments
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { books: 0, chunks: 0, embeddings: 0, vectorDocuments: 0 };
    }
  }
}

// Export singleton instance
export const ragServiceAPI = new RAGServiceAPI();
