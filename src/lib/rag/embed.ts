import { pipeline, Pipeline, FeatureExtractionPipeline, env } from '@xenova/transformers';

// Ensure the Hugging Face Hub URL is correctly set
env.HF_HUB_URL = 'https://huggingface.co/';

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

// Log the current embedding mode
console.log(`🔧 RAG System: ${USE_FALLBACK_EMBEDDINGS ? 'Fallback Mode (Hash-based embeddings)' : 'ML Mode (Transformers.js)'}`);
console.log(`🔧 USE_FALLBACK_EMBEDDINGS = ${USE_FALLBACK_EMBEDDINGS}`);
console.log(`🔧 Model will be: ${USE_FALLBACK_EMBEDDINGS ? 'DISABLED (using hash)' : 'Xenova/all-MiniLM-L6-v2'}`);

// Global model instance for reuse
let embeddingModel: FeatureExtractionPipeline | null = null;
let modelLoadingPromise: Promise<FeatureExtractionPipeline> | null = null;

/**
 * Get or load the embedding model
 */
export async function getEmbeddingModel(options: EmbeddingOptions = DEFAULT_EMBEDDING_OPTIONS): Promise<FeatureExtractionPipeline> {
  // If fallback mode is enabled, return null to indicate fallback should be used
  if (USE_FALLBACK_EMBEDDINGS) {
    return null as any; // Return null instead of throwing error
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
async function loadModel(options: EmbeddingOptions): Promise<FeatureExtractionPipeline> {
  console.log(`🚀 STARTING MODEL DOWNLOAD: ${options.modelName}`);
  console.log(`📥 This may take 1-3 minutes on first run...`);
  console.log(`📥 Model size: ~30-60MB`);
  console.log(`📥 Downloading from: https://huggingface.co/${options.modelName}`);
  
  try {
    const model = await pipeline('feature-extraction', options.modelName, {
      quantized: false, // Use full precision for better quality
      progress_callback: (progress: any) => {
        if (progress && typeof progress.progress === 'number' && progress.progress > 0 && progress.progress <= 1) {
          console.log(`Model loading progress: ${Math.round(progress.progress * 100)}%`);
        }
      },
      cache_dir: undefined, // Use default cache
      local_files_only: false, // Allow downloading
      revision: 'main' // Use main branch
    });
    
    console.log('✅ MODEL DOWNLOAD COMPLETE!');
    console.log('✅ Model loaded successfully and ready to use');
    console.log('✅ Future uploads will be much faster (model is cached)');
    return model;
  } catch (error) {
    console.error('Error loading embedding model:', error);
    
    // Try fallback model if main one fails
    if (options.modelName !== 'Xenova/all-MiniLM-L6-v2') {
      console.log('Trying fallback model: Xenova/all-MiniLM-L6-v2');
      return await loadModel({ ...options, modelName: 'Xenova/all-MiniLM-L6-v2' });
    }
    
    throw new Error(`Failed to load embedding model: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    // Generate embedding
    const output = await model(cleanText, {
      pooling: options.pooling,
      normalize: options.normalize
    });
    
    const processingTime = performance.now() - startTime;
    
    return {
      values: output.data as Float32Array,
      dimension: output.data.length,
      modelName: options.modelName,
      processingTime
    };
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
    const model = await getEmbeddingModel(options);
    
    // If model is null, use fallback immediately
    if (!model) {
      console.log(`⚠️ FALLBACK MODE: Model not available, using hash-based embeddings for ${texts.length} texts`);
      for (let i = 0; i < texts.length; i++) {
        const fallbackResult = generateFallbackEmbedding(texts[i], options);
        results.push(fallbackResult);
        onProgress?.(i + 1, texts.length);
      }
      console.log(`✅ Completed ${texts.length} fallback embeddings`);
      return results;
    }
    
    console.log(`🤖 ML MODE: Using real transformer model for ${texts.length} texts`);
    // Process in batches with real model
    for (let i = 0; i < texts.length; i += options.batchSize) {
      const batch = texts.slice(i, i + options.batchSize);
      const batchPromises = batch.map(text => embedText(text, options));
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Report progress
      onProgress?.(Math.min(i + options.batchSize, texts.length), texts.length);
    }
    
    const totalTime = performance.now() - startTime;
    console.log(`Generated ${results.length} embeddings in ${totalTime.toFixed(2)}ms`);
    
    return results;
  } catch (error) {
    console.error('Error generating embeddings in batch:', error);
    
    // Fallback to individual fallback embeddings
    console.log('Using fallback embedding method for batch due to error');
    const fallbackResults: EmbeddingResult[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      try {
        const fallbackResult = generateFallbackEmbedding(texts[i], options);
        fallbackResults.push(fallbackResult);
        onProgress?.(i + 1, texts.length);
      } catch (fallbackError) {
        console.error(`Fallback embedding failed for text ${i}:`, fallbackError);
        // Create a zero embedding as last resort
        const zeroEmbedding = new Float32Array(384);
        fallbackResults.push({
          values: zeroEmbedding,
          dimension: 384,
          modelName: 'fallback-zero',
          processingTime: 0
        });
      }
    }
    
    return fallbackResults;
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
    onProgress?.(0, chunks.length, 'Starting embedding generation...');
    
    console.log(`🤖 ML MODE: Using real transformer model for ${chunks.length} chunks`);
    // Process chunks in batches
    for (let i = 0; i < chunks.length; i += options.batchSize) {
      const batch = chunks.slice(i, i + options.batchSize);
      const batchTexts = batch.map(chunk => chunk.text);
      
      onProgress?.(
        i,
        chunks.length,
        `Generating embeddings for batch ${Math.floor(i / options.batchSize) + 1}/${Math.ceil(chunks.length / options.batchSize)}`
      );
      
      const batchEmbeddings = await embedTexts(batchTexts, options);
      
      // Map embeddings back to chunk IDs
      batch.forEach((chunk, index) => {
        results.set(chunk.id, batchEmbeddings[index]);
      });
      
      onProgress?.(
        Math.min(i + options.batchSize, chunks.length),
        chunks.length,
        `Completed ${Math.min(i + options.batchSize, chunks.length)}/${chunks.length} embeddings`
      );
    }
    
    console.log(`✅ Completed ${chunks.length} ML model chunk embeddings`);
    return results;
  } catch (error) {
    console.error('Error embedding chunks:', error);
    
    // Fallback to individual fallback embeddings
    console.log(`⚠️ FALLBACK MODE: Model failed, using hash-based embeddings for ${chunks.length} chunks`);
    onProgress?.(0, chunks.length, 'Using fallback embedding method...');
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunk = chunks[i];
        const fallbackResult = generateFallbackEmbedding(chunk.text, options);
        results.set(chunk.id, fallbackResult);
        
        onProgress?.(
          i + 1,
          chunks.length,
          `Fallback embedding ${i + 1}/${chunks.length} completed`
        );
      } catch (fallbackError) {
        console.error(`Fallback embedding failed for chunk ${chunk.id}:`, fallbackError);
        // Create a zero embedding as last resort
        const zeroEmbedding = new Float32Array(384);
        results.set(chunks[i].id, {
          values: zeroEmbedding,
          dimension: 384,
          modelName: 'fallback-zero',
          processingTime: 0
        });
      }
    }
    
    console.log(`✅ Completed ${chunks.length} fallback chunk embeddings`);
    return results;
  }
}

/**
 * Validate embedding dimensions
 */
export function validateEmbedding(embedding: Float32Array, expectedDimension: number = 384): boolean {
  if (!embedding || embedding.length === 0) {
    return false;
  }
  
  if (embedding.length !== expectedDimension) {
    console.warn(`Expected embedding dimension ${expectedDimension}, got ${embedding.length}`);
    return false;
  }
  
  // Check for NaN or infinite values
  for (let i = 0; i < embedding.length; i++) {
    if (!Number.isFinite(embedding[i])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get model information
 */
export async function getModelInfo(options: EmbeddingOptions = DEFAULT_EMBEDDING_OPTIONS): Promise<{
  name: string;
  dimension: number;
  pooling: string;
  normalize: boolean;
}> {
  const model = await getEmbeddingModel(options);
  
  // Test with a simple text to get dimension
  const testResult = await embedText('test', options);
  
  return {
    name: options.modelName,
    dimension: testResult.dimension,
    pooling: options.pooling,
    normalize: options.normalize
  };
}

/**
 * Preload the model (useful for better UX)
 */
export async function preloadModel(options: EmbeddingOptions = DEFAULT_EMBEDDING_OPTIONS): Promise<void> {
  try {
    await getEmbeddingModel(options);
    console.log('Model preloaded successfully');
  } catch (error) {
    console.error('Failed to preload model:', error);
  }
}
