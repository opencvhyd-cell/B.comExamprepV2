// import elasticlunr from 'elasticlunr';
import type { Embedding, Chunk } from './db';

export interface SearchResult {
  chunkId: string;
  score: number;
  chunk: Chunk;
  embedding: Embedding;
}

export interface HybridSearchOptions {
  useCosine: boolean;
  useBM25: boolean;
  cosineWeight: number;
  bm25Weight: number;
  topK: number;
  mmrLambda: number;
  minScore: number;
}

export const DEFAULT_SEARCH_OPTIONS: HybridSearchOptions = {
  useCosine: true,
  useBM25: true,
  cosineWeight: 0.7,
  bm25Weight: 0.3,
  topK: 50,
  mmrLambda: 0.5,
  minScore: 0.1
};

/**
 * Calculate cosine similarity between two vectors
 * Assumes vectors are already normalized
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimensions don't match: ${a.length} vs ${b.length}`);
  }
  
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  
  return dotProduct; // Already normalized, so dot product = cosine similarity
}

/**
 * Calculate Euclidean distance between two vectors
 */
export function euclideanDistance(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimensions don't match: ${a.length} vs ${b.length}`);
  }
  
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
}

/**
 * Build BM25 search index for text-based search
 */
export function buildBM25Index(chunks: Chunk[]): any {
  // Simple keyword-based search as fallback
  const index = new Map<string, { id: string; text: string; section?: string; words: Set<string> }>();
  
  chunks.forEach(chunk => {
    const words = chunk.text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    index.set(chunk.id, { 
      id: chunk.id, 
      text: chunk.text, 
      section: chunk.section || '',
      words: new Set(words) 
    });
  });
  
  return index;
}

/**
 * Perform BM25 search on chunks
 */
export function searchBM25(
  index: any,
  query: string,
  topK: number = 50
): Array<{ id: string; score: number }> {
  try {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const results: Array<{ id: string; score: number }> = [];
    
    for (const [id, doc] of index.entries()) {
      let score = 0;
      for (const word of queryWords) {
        if (doc.words.has(word)) {
          score += 1;
        }
      }
      if (score > 0) {
        results.push({ id, score });
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch (error) {
    console.error('BM25 search error:', error);
    return [];
  }
}

/**
 * Perform vector similarity search using cosine similarity
 */
export function searchCosine(
  queryEmbedding: Float32Array,
  chunks: Chunk[],
  embeddings: Embedding[],
  topK: number = 50,
  minScore: number = 0.1
): Array<{ chunkId: string; score: number; chunk: Chunk; embedding: Embedding }> {
  const results: Array<{ chunkId: string; score: number; chunk: Chunk; embedding: Embedding }> = [];
  
  // Create a map for faster lookup
  const embeddingMap = new Map(embeddings.map(emb => [emb.id, emb]));
  
  for (const chunk of chunks) {
    const embedding = embeddingMap.get(chunk.id);
    if (!embedding) continue;
    
    try {
      const score = cosineSimilarity(queryEmbedding, embedding.values);
      
      if (score >= minScore) {
        results.push({
          chunkId: chunk.id,
          score,
          chunk,
          embedding
        });
      }
    } catch (error) {
      console.warn(`Error calculating similarity for chunk ${chunk.id}:`, error);
      continue;
    }
  }
  
  // Sort by score (descending) and return top K
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Perform hybrid search combining cosine similarity and BM25
 */
export async function hybridSearch(
  query: string,
  queryEmbedding: Float32Array,
  chunks: Chunk[],
  embeddings: Embedding[],
  options: HybridSearchOptions = DEFAULT_SEARCH_OPTIONS
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  try {
    // Get cosine similarity results
    let cosineResults: Array<{ chunkId: string; score: number; chunk: Chunk; embedding: Embedding }> = [];
    if (options.useCosine) {
      cosineResults = searchCosine(
        queryEmbedding,
        chunks,
        embeddings,
        options.topK,
        options.minScore
      );
    }
    
    // Get BM25 results
    let bm25Results: Array<{ id: string; score: number }> = [];
    if (options.useBM25) {
      const bm25Index = buildBM25Index(chunks);
      bm25Results = searchBM25(bm25Index, query, options.topK);
    }
    
    // Combine results
    if (cosineResults.length > 0 && bm25Results.length > 0) {
      // Hybrid scoring
      const hybridResults = combineScores(
        cosineResults,
        bm25Results,
        options.cosineWeight,
        options.bm25Weight
      );
      
      results.push(...hybridResults);
    } else if (cosineResults.length > 0) {
      // Only cosine results
      results.push(...cosineResults.map(r => ({
        chunkId: r.chunkId,
        score: r.score,
        chunk: r.chunk,
        embedding: r.embedding
      })));
    } else if (bm25Results.length > 0) {
      // Only BM25 results
      const bm25Chunks = chunks.filter(c => bm25Results.some(r => r.id === c.id));
      const bm25Embeddings = embeddings.filter(e => bm25Results.some(r => r.id === e.id));
      
      for (const bm25Result of bm25Results) {
        const chunk = bm25Chunks.find(c => c.id === bm25Result.id);
        const embedding = bm25Embeddings.find(e => e.id === bm25Result.id);
        
        if (chunk && embedding) {
          results.push({
            chunkId: bm25Result.id,
            score: bm25Result.score,
            chunk,
            embedding
          });
        }
      }
    }
    
    // Sort by final score
    results.sort((a, b) => b.score - a.score);
    
    return results;
  } catch (error) {
    console.error('Hybrid search error:', error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Combine cosine and BM25 scores with weights
 */
function combineScores(
  cosineResults: Array<{ chunkId: string; score: number; chunk: Chunk; embedding: Embedding }>,
  bm25Results: Array<{ id: string; score: number }>,
  cosineWeight: number,
  bm25Weight: number
): SearchResult[] {
  // Normalize BM25 scores to 0-1 range
  const bm25MaxScore = Math.max(...bm25Results.map(r => r.score));
  const normalizedBm25 = bm25MaxScore > 0 
    ? bm25Results.map(r => ({ ...r, score: r.score / bm25MaxScore }))
    : bm25Results.map(r => ({ ...r, score: 0 }));
  
  // Create a map for faster lookup
  const bm25Map = new Map(normalizedBm25.map(r => [r.id, r.score]));
  
  return cosineResults.map(cosineResult => {
    const bm25Score = bm25Map.get(cosineResult.chunkId) || 0;
    const combinedScore = (cosineWeight * cosineResult.score) + (bm25Weight * bm25Score);
    
    return {
      chunkId: cosineResult.chunkId,
      score: combinedScore,
      chunk: cosineResult.chunk,
      embedding: cosineResult.embedding
    };
  });
}

/**
 * Apply Maximum Marginal Relevance (MMR) for diversity
 */
export function applyMMR(
  results: SearchResult[],
  queryEmbedding: Float32Array,
  lambda: number = 0.5,
  topK: number = 6
): SearchResult[] {
  if (results.length <= topK) {
    return results;
  }
  
  const selected: SearchResult[] = [];
  const remaining = [...results];
  
  // Select first result (highest score)
  if (remaining.length > 0) {
    selected.push(remaining.shift()!);
  }
  
  // Apply MMR for remaining selections
  while (selected.length < topK && remaining.length > 0) {
    let bestResult: SearchResult | null = null;
    let bestMMRScore = -Infinity;
    
    for (const result of remaining) {
      // Relevance score (original score)
      const relevance = result.score;
      
      // Diversity score (minimum similarity to already selected)
      let diversity = 1.0;
      if (selected.length > 0) {
        const similarities = selected.map(selectedResult => 
          cosineSimilarity(result.embedding.values, selectedResult.embedding.values)
        );
        diversity = 1.0 - Math.max(...similarities);
      }
      
      // MMR score
      const mmrScore = lambda * relevance + (1 - lambda) * diversity;
      
      if (mmrScore > bestMMRScore) {
        bestMMRScore = mmrScore;
        bestResult = result;
      }
    }
    
    if (bestResult) {
      selected.push(bestResult);
      remaining.splice(remaining.indexOf(bestResult), 1);
    } else {
      break;
    }
  }
  
  return selected;
}

/**
 * Search with MMR diversity selection
 */
export async function searchWithMMR(
  query: string,
  queryEmbedding: Float32Array,
  chunks: Chunk[],
  embeddings: Embedding[],
  options: HybridSearchOptions = DEFAULT_SEARCH_OPTIONS
): Promise<SearchResult[]> {
  // Perform initial search
  const initialResults = await hybridSearch(
    query,
    queryEmbedding,
    chunks,
    embeddings,
    options
  );
  
  // Apply MMR for diversity
  return applyMMR(
    initialResults,
    queryEmbedding,
    options.mmrLambda,
    Math.min(options.topK, 10) // Limit MMR to reasonable number
  );
}
