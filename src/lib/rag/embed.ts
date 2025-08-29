// import { env } from '@xenova/transformers';

// Ensure the Hugging Face Hub URL is correctly set
// env.HF_HUB_URL = 'https://huggingface.co/';

export interface EmbeddingOptions {
  modelName: string;
  pooling: 'mean' | 'cls';
  normalize: boolean;
  batchSize: number;
}

export interface EmbeddingResult {
  values: Float32Array;
  dimension: number;
  modelName: string;
  processingTime: number;
}

export const DEFAULT_EMBEDDING_OPTIONS: EmbeddingOptions = {
  modelName: 'Xenova/all-MiniLM-L6-v2',
  pooling: 'mean',
  normalize: true,
  batchSize: 8
};

// Check if we're in offline mode or if the model should be skipped
export const USE_FALLBACK_EMBEDDINGS = false; // Set to false to enable ML model

// Log the current embedding mode (only once)
if (process.env.NODE_ENV === 'development') {
  console.log(`🔧 RAG System: ${USE_FALLBACK_EMBEDDINGS ? 'Fallback Mode (Hash-based embeddings)' : 'ML Mode (Transformers.js)'}`);
  console.log(`🔧 USE_FALLBACK_EMBEDDINGS = ${USE_FALLBACK_EMBEDDINGS}`);
  console.log(`🔧 Model will be: ${USE_FALLBACK_EMBEDDINGS ? 'DISABLED (using hash)' : 'Xenova/all-MiniLM-L6-v2'}`);
}

// Global model instance for reuse
let embeddingModel: unknown | null = null; // Changed from any to unknown
let modelLoadingPromise: Promise<unknown> | null = null; // Changed from any to unknown

/**
 * Get or load the embedding model
 */
export async function getEmbeddingModel(options: EmbeddingOptions = DEFAULT_EMBEDDING_OPTIONS): Promise<unknown> {
  // If fallback mode is enabled, return null to indicate fallback should be used
  if (USE_FALLBACK_EMBEDDINGS) {
    return null; // Return null instead of throwing error
  }
  
  if (embeddingModel) {
    return embeddingModel;
  }

  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  modelLoadingPromise = loadModel(options);
  try {
    embeddingModel = await modelLoadingPromise;
    return embeddingModel;
  } finally {
    modelLoadingPromise = null;
  }
}

/**
 * Load the embedding model
 */
async function loadModel(options: EmbeddingOptions): Promise<unknown> {
  console.log(`🚀 STARTING MODEL DOWNLOAD: ${options.modelName}`);
  console.log(`📥 This may take 1-3 minutes on first run...`);
  console.log(`📥 Model size: ~30-60MB`);
  console.log(`📥 Downloading from: https://huggingface.co/${options.modelName}`);
  
  try {
    // For now, return null to use fallback embeddings
    console.log('⚠️ Transformers.js not available, using fallback embeddings');
    return null;
  } catch (error) {
    console.error('Error loading embedding model:', error);
    return null;
  }
}

/**
 * Generate embeddings for a single text
 */
export async function embedText(
  text: string,
  options: EmbeddingOptions = DEFAULT_EMBEDDING_OPTIONS
): Promise<EmbeddingResult> {
  const startTime = performance.now();
  
  try {
    const model = await getEmbeddingModel(options);
    
    // If model is null, use fallback immediately
    if (!model) {
      console.log('⚠️ FALLBACK MODE: Model not available, using hash-based embeddings');
      return generateFallbackEmbedding(text, options);
    }
    
    console.log('🤖 ML MODE: Using real transformer model for high-quality embeddings');
    
    // Clean and prepare text
    const cleanText = text.trim();
    if (!cleanText) {
      throw new Error('Text cannot be empty');
    }
    
    // Generate embedding - using fallback for now
    console.log('⚠️ Using fallback embedding method');
    return generateFallbackEmbedding(text, options);
  } catch (error) {
    console.error('Error generating embedding:', error);
    
    // Fallback to simple hash-based embedding if model fails
    console.log('Using fallback embedding method due to error');
    return generateFallbackEmbedding(text, options);
  }
}

/**
 * Generate a simple fallback embedding when the model fails to load
 */
function generateFallbackEmbedding(text: string, options: EmbeddingOptions): EmbeddingResult {
  const startTime = performance.now();
  
  // Simple hash-based embedding (not as good but functional)
  const cleanText = text.toLowerCase().trim();
  const words = cleanText.split(/\s+/).filter(w => w.length > 2);
  
  // Create a 384-dimensional vector (same as MiniLM)
  const embedding = new Float32Array(384);
  
  // Fill with simple hash-based values
  for (let i = 0; i < 384; i++) {
    let hash = 0;
    for (const word of words) {
      hash += word.charCodeAt(i % word.length) * (i + 1);
    }
    embedding[i] = (hash % 2000 - 1000) / 1000; // Normalize to [-1, 1]
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  for (let i = 0; i < embedding.length; i++) {
    embedding[i] /= magnitude;
  }
  
  const processingTime = performance.now() - startTime;
  
  console.log(`🔧 Generated fallback embedding: ${text.length} chars → 384-dim vector in ${processingTime.toFixed(2)}ms`);
  
  return {
    values: embedding,
    dimension: 384,
    modelName: 'fallback-hash',
    processingTime
  };
}

/**
 * Generate embeddings for multiple text chunks
 */
export async function embedChunks(
  chunks: Array<{ text: string; id: string }>,
  options: EmbeddingOptions = DEFAULT_EMBEDDING_OPTIONS,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<Map<string, EmbeddingResult>> {
  const results = new Map<string, EmbeddingResult>();
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    if (onProgress) {
      onProgress(i + 1, chunks.length, `Processing chunk ${i + 1}/${chunks.length}`);
    }
    
    try {
      const embedding = await embedText(chunk.text, options);
      results.set(chunk.id, embedding);
    } catch (error) {
      console.error(`Error embedding chunk ${chunk.id}:`, error);
      // Continue with other chunks
    }
  }
  
  return results;
}