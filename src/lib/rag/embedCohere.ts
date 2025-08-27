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
      console.warn('⚠️ VITE_COHERE_API_KEY not found in environment variables');
      console.warn('⚠️ Please add VITE_COHERE_API_KEY to your .env file');
      throw new Error('COHERE_API_KEY not configured');
    }
    
    cohereClient = new CohereClient({
      token: import.meta.env.VITE_COHERE_API_KEY
    });
    console.log('✅ Cohere client initialized');
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
    console.log(`🤖 Cohere API: Generating embedding for "${text.substring(0, 50)}..."`);
    
    const client = getCohereClient();
    const response = await client.v2.embed({
      texts: [text],
      model: options.modelName,
      inputType: options.inputType
    });
    
    console.log('🔍 Cohere API Single Response:', response);
    
    // The new Cohere API v2 has a different structure
    // Try multiple possible locations for embeddings
    let embeddings: any = null;
    
    // Try different possible structures
    if (response.body?.embeddings) {
      embeddings = response.body.embeddings;
    } else if (response.embeddings) {
      embeddings = response.embeddings;
    } else if (response.embeddings?.embeddings) {
      embeddings = response.embeddings.embeddings;
    }
    
    if (!embeddings || embeddings.length === 0) {
      console.error('❌ No embeddings found in response:', response);
      throw new Error('No embeddings returned from Cohere API');
    }
    
          // Handle different embedding formats
      let embeddingArray: any[] = [];
      
      if (Array.isArray(embeddings)) {
        embeddingArray = embeddings;
      } else if (embeddings.embeddings && Array.isArray(embeddings.embeddings)) {
        embeddingArray = embeddings.embeddings;
      } else if (embeddings.byType && embeddings.byType.embedding) {
        embeddingArray = embeddings.byType.embedding;
      } else if (embeddings.float && Array.isArray(embeddings.float)) {
        // NEW: Cohere API v2 format with categorized embeddings
        embeddingArray = embeddings.float;
        console.log('🔍 Single text: Float format detected, length:', embeddings.float.length);
      } else {
        console.error('❌ Unknown embeddings format:', embeddings);
        console.error('❌ Available keys:', Object.keys(embeddings));
        throw new Error('Unknown embeddings format returned from Cohere API');
      }
    
    const embedding = embeddingArray[0];
    const values = new Float32Array(embedding);
    
    const processingTime = performance.now() - startTime;
    
    console.log(`✅ Cohere API: Generated ${values.length}-dim embedding in ${processingTime.toFixed(2)}ms`);
    
    return {
      values,
      dimension: values.length,
      modelName: options.modelName,
      processingTime
    };
  } catch (error) {
    console.error('❌ Cohere API Error:', error);
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
    console.log(`🤖 Cohere API: Processing ${texts.length} texts in batches`);
    
    // Cohere can handle up to 96 texts per request
    const batchSize = 96;
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
      
      const client = getCohereClient();
      const response = await client.v2.embed({
        texts: batch,
        model: options.modelName,
        inputType: options.inputType
      });
      
      console.log('🔍 Cohere API Response:', response);
      console.log('🔍 Response body:', response.body);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', Object.keys(response));
      
      // Debug the embeddings structure
      if (response.embeddings) {
        console.log('🔍 Embeddings type:', typeof response.embeddings);
        console.log('🔍 Embeddings keys:', Object.keys(response.embeddings));
        console.log('🔍 Embeddings preview:', response.embeddings);
      }
      
      // The new Cohere API v2 has a different structure
      // Try multiple possible locations for embeddings
      let embeddings: any = null;
      
      // Try different possible structures
      if (response.body?.embeddings) {
        embeddings = response.body.embeddings;
        console.log('🔍 Found embeddings in response.body.embeddings');
      } else if (response.embeddings) {
        embeddings = response.embeddings;
        console.log('🔍 Found embeddings in response.embeddings');
      } else if (response.embeddings?.embeddings) {
        embeddings = response.embeddings.embeddings;
        console.log('🔍 Found embeddings in response.embeddings.embeddings');
      }
      
      if (!embeddings) {
        console.error('❌ No embeddings found in response:', response);
        throw new Error('No embeddings returned from Cohere API');
      }
      
      // Handle different embedding formats
      let embeddingArray: any[] = [];
      
      if (Array.isArray(embeddings)) {
        // Direct array format
        embeddingArray = embeddings;
        console.log('🔍 Embeddings is a direct array');
      } else if (embeddings.embeddings && Array.isArray(embeddings.embeddings)) {
        // Nested array format
        embeddingArray = embeddings.embeddings;
        console.log('🔍 Embeddings is nested array');
      } else if (embeddings.byType && embeddings.byType.embedding) {
        // New v2 format with byType
        embeddingArray = embeddings.byType.embedding;
        console.log('🔍 Embeddings is byType.embedding format');
      } else if (embeddings.float && Array.isArray(embeddings.float)) {
        // NEW: Cohere API v2 format with categorized embeddings
        embeddingArray = embeddings.float;
        console.log('🔍 Embeddings is float format (Cohere v2)');
        console.log('🔍 Float array length:', embeddings.float.length);
        console.log('🔍 First float embedding preview:', embeddings.float[0]?.slice(0, 5));
      } else {
        console.error('❌ Unknown embeddings format:', embeddings);
        console.error('❌ Available keys:', Object.keys(embeddings));
        throw new Error('Unknown embeddings format returned from Cohere API');
      }
      
      console.log('🔍 Final embedding array length:', embeddingArray.length);
      
      // Convert embeddings to our format
      const batchResults = embeddingArray.map((embedding: any, index: number) => {
        const values = new Float32Array(embedding);
        return {
          values,
          dimension: values.length,
          modelName: options.modelName,
          processingTime: 0 // Individual timing not available for batch
        };
      });
      
      results.push(...batchResults);
      
      // Report progress
      onProgress?.(Math.min(i + batchSize, texts.length), texts.length);
    }
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ Cohere API: Generated ${results.length} embeddings in ${totalTime.toFixed(2)}ms`);
    
    return results;
  } catch (error) {
    console.error('❌ Cohere API Batch Error:', error);
    throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    onProgress?.(0, chunks.length, 'Starting Cohere API embedding generation...');
    
    console.log(`🤖 Cohere API: Processing ${chunks.length} chunks`);
    
    // Extract texts for batch processing
    const texts = chunks.map(chunk => chunk.text);
    
    onProgress?.(0, chunks.length, 'Generating embeddings with Cohere API...');
    
    // Generate all embeddings in batches
    const embeddings = await embedTexts(texts, options, (current, total) => {
      onProgress?.(current, total, `Generated ${current}/${total} embeddings`);
    });
    
    // Map embeddings back to chunk IDs
    chunks.forEach((chunk, index) => {
      results.set(chunk.id, embeddings[index]);
    });
    
    console.log(`✅ Cohere API: Completed ${chunks.length} chunk embeddings`);
    return results;
  } catch (error) {
    console.error('❌ Cohere API Chunk Error:', error);
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
  // Test with a simple text to get dimension
  const testResult = await embedText('test', options);
  
  return {
    name: options.modelName,
    dimension: testResult.dimension,
    inputType: options.inputType
  };
}
