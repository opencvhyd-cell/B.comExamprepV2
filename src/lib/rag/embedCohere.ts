import { CohereClient } from 'cohere-ai';

export interface EmbeddingOptions {
  modelName: string;
  inputType: 'search_document' | 'search_query' | 'classification' | 'clustering';
}

export interface EmbeddingResult {
  values: Float32Array;
  dimension: number;
  modelName: string;
  processingTime: number;
}

export const DEFAULT_EMBEDDING_OPTIONS: EmbeddingOptions = {
  modelName: 'embed-english-v3.0',
  inputType: 'search_document'
};

// Initialize Cohere client
let cohereClient: CohereClient | null = null;

function getCohereClient(): CohereClient {
  if (!cohereClient) {
    if (!import.meta.env.VITE_COHERE_API_KEY) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ VITE_COHERE_API_KEY not found in environment variables');
        console.warn('⚠️ Please add VITE_COHERE_API_KEY to your .env file');
      }
      throw new Error('COHERE_API_KEY not configured');
    }
    
    cohereClient = new CohereClient({
      token: import.meta.env.VITE_COHERE_API_KEY
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Cohere client initialized');
    }
  }
  return cohereClient;
}

/**
 * Generate embeddings using Cohere API
 */
export async function embedText(
  text: string,
  options: EmbeddingOptions = DEFAULT_EMBEDDING_OPTIONS
): Promise<EmbeddingResult> {
  const startTime = performance.now();
  
  try {
    const client = getCohereClient();
    
    const response = await client.embed({
      texts: [text],
      model: options.modelName,
      inputType: options.inputType
    });
    
    if (!response.embeddings || response.embeddings.length === 0) {
      throw new Error('No embeddings returned from Cohere API');
    }
    
    const embedding = response.embeddings[0];
    const processingTime = performance.now() - startTime;
    
    return {
      values: new Float32Array(embedding),
      dimension: embedding.length,
      modelName: options.modelName,
      processingTime
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating Cohere embedding:', error);
    }
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embeddings for multiple texts in batches
 */
export async function embedTexts(
  texts: string[],
  options: EmbeddingOptions = DEFAULT_EMBEDDING_OPTIONS,
  onProgress?: (current: number, total: number) => void
): Promise<EmbeddingResult[]> {
  const startTime = performance.now();
  const results: EmbeddingResult[] = [];
  
  try {
    const client = getCohereClient();
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const response = await client.embed({
        texts: batch,
        model: options.modelName,
        inputType: options.inputType
      });
      
      if (!response.embeddings) {
        throw new Error('No embeddings returned from Cohere API');
      }
      
      // Convert embeddings to results
      for (let j = 0; j < response.embeddings.length; j++) {
        const embedding = response.embeddings[j];
        const processingTime = performance.now() - startTime;
        
        results.push({
          values: new Float32Array(embedding),
          dimension: embedding.length,
          modelName: options.modelName,
          processingTime
        });
      }
      
      // Report progress
      if (onProgress) {
        onProgress(Math.min(i + batchSize, texts.length), texts.length);
      }
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating Cohere embeddings:', error);
    }
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embeddings for chunks with progress tracking
 */
export async function embedChunks(
  chunks: { text: string; id: string }[],
  options: EmbeddingOptions = DEFAULT_EMBEDDING_OPTIONS,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<Map<string, EmbeddingResult>> {
  const results = new Map<string, EmbeddingResult>();
  
  try {
    const texts = chunks.map(chunk => chunk.text);
    const embeddings = await embedTexts(texts, options, onProgress);
    
    // Map results back to chunk IDs
    for (let i = 0; i < chunks.length; i++) {
      results.set(chunks[i].id, embeddings[i]);
    }
    
    return results;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error embedding chunks:', error);
    }
    throw new Error(`Failed to embed chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get model information
 */
export async function getModelInfo(options: EmbeddingOptions = DEFAULT_EMBEDDING_OPTIONS): Promise<{
  name: string;
  dimension: number;
  inputType: string;
}> {
  try {
    const client = getCohereClient();
    
    // Get model information
    const response = await client.models.get({
      model: options.modelName
    });
    
    return {
      name: response.model.name || options.modelName,
      dimension: response.model.embeddingDimensions || 4096,
      inputType: options.inputType
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting model info:', error);
    }
    return {
      name: options.modelName,
      dimension: 4096, // Default dimension
      inputType: options.inputType
    };
  }
}
