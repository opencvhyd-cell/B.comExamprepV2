import type { SearchResult, Source } from './db';

export interface ComposedAnswer {
  answer: string;
  sources: Source[];
  confidence: number;
  processingTime: number;
}

export interface AnswerCompositionOptions {
  maxAnswerLength: number;
  includePageNumbers: boolean;
  includeBookTitles: boolean;
  confidenceThreshold: number;
  maxSources: number;
}

export const DEFAULT_ANSWER_OPTIONS: AnswerCompositionOptions = {
  maxAnswerLength: 2000,
  includePageNumbers: true,
  includeBookTitles: true,
  confidenceThreshold: 0.3,
  maxSources: 6
};

/**
 * Compose an answer from retrieved chunks
 */
export function composeAnswer(
  searchResults: SearchResult[],
  query: string,
  options: AnswerCompositionOptions = DEFAULT_ANSWER_OPTIONS
): ComposedAnswer {
  const startTime = performance.now();
  
  try {
    // Filter results by confidence threshold
    const confidentResults = searchResults.filter(result => result.score >= options.confidenceThreshold);
    
    if (confidentResults.length === 0) {
      return {
        answer: generateLowConfidenceResponse(query, searchResults),
        sources: [],
        confidence: 0,
        processingTime: performance.now() - startTime
      };
    }
    
    // Limit sources
    const limitedResults = confidentResults.slice(0, options.maxSources);
    
    // Generate answer text
    const answer = generateAnswerText(limitedResults, query, options);
    
    // Create sources with proper formatting
    const sources = createSources(limitedResults, options);
    
    // Calculate overall confidence
    const confidence = calculateConfidence(limitedResults);
    
    return {
      answer,
      sources,
      confidence,
      processingTime: performance.now() - startTime
    };
  } catch (error) {
    console.error('Error composing answer:', error);
    return {
      answer: 'I encountered an error while processing your question. Please try rephrasing or ask a different question.',
      sources: [],
      confidence: 0,
      processingTime: performance.now() - startTime
    };
  }
}

/**
 * Generate answer text from chunks
 */
function generateAnswerText(
  results: SearchResult[],
  query: string,
  options: AnswerCompositionOptions
): string {
  // Sort by relevance score
  const sortedResults = [...results].sort((a, b) => b.score - a.score);
  
  // Extract key information from query
  const queryType = analyzeQueryType(query);
  
  // Generate answer based on query type
  let answer = '';
  
  if (queryType === 'definition') {
    answer = generateDefinitionAnswer(sortedResults, options);
  } else if (queryType === 'explanation') {
    answer = generateExplanationAnswer(sortedResults, options);
  } else if (queryType === 'comparison') {
    answer = generateComparisonAnswer(sortedResults, options);
  } else if (queryType === 'step-by-step') {
    answer = generateStepByStepAnswer(sortedResults, options);
  } else {
    answer = generateGeneralAnswer(sortedResults, options);
  }
  
  // Truncate if too long
  if (answer.length > options.maxAnswerLength) {
    answer = answer.substring(0, options.maxAnswerLength - 100) + '...\n\n[Answer truncated due to length]';
  }
  
  return answer;
}

/**
 * Analyze the type of query to determine answer format
 */
function analyzeQueryType(query: string): 'definition' | 'explanation' | 'comparison' | 'step-by-step' | 'general' {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('what is') || lowerQuery.includes('define') || lowerQuery.includes('meaning')) {
    return 'definition';
  }
  
  if (lowerQuery.includes('how') || lowerQuery.includes('explain') || lowerQuery.includes('describe')) {
    return 'explanation';
  }
  
  if (lowerQuery.includes('compare') || lowerQuery.includes('difference') || lowerQuery.includes('versus')) {
    return 'comparison';
  }
  
  if (lowerQuery.includes('step') || lowerQuery.includes('process') || lowerQuery.includes('procedure')) {
    return 'step-by-step';
  }
  
  return 'general';
}

/**
 * Generate definition-style answer
 */
function generateDefinitionAnswer(results: SearchResult[], options: AnswerCompositionOptions): string {
  if (results.length === 0) {
    return 'I could not find a clear definition for this term in the available sources.';
  }
  
  const bestResult = results[0];
  const definition = bestResult.chunk.text.split('.')[0]; // First sentence
  
  return `**Definition:** ${definition}

**Source:** ${bestResult.chunk.bookTitle} (Page ${bestResult.chunk.pageStart})`;
}

/**
 * Generate explanation-style answer
 */
function generateExplanationAnswer(results: SearchResult[], options: AnswerCompositionOptions): string {
  if (results.length === 0) {
    return 'I could not find sufficient information to provide a detailed explanation.';
  }
  
  const explanations = results.slice(0, 3).map(result => 
    `${result.chunk.text} (${result.chunk.bookTitle}, Page ${result.chunk.pageStart})`
  );
  
  return `**Explanation:**

${explanations.join('\n\n')}`;
}

/**
 * Generate comparison-style answer
 */
function generateComparisonAnswer(results: SearchResult[], options: AnswerCompositionOptions): string {
  if (results.length < 2) {
    return 'I need at least two sources to provide a meaningful comparison.';
  }
  
  const comparisons = results.slice(0, 2).map((result, index) => 
    `**Source ${index + 1}:** ${result.chunk.text} (${result.chunk.bookTitle}, Page ${result.chunk.pageStart})`
  );
  
  return `**Comparison:**

${comparisons.join('\n\n')}

**Analysis:** Based on the available sources, here are the key differences and similarities...`;
}

/**
 * Generate step-by-step answer
 */
function generateStepByStepAnswer(results: SearchResult[], options: AnswerCompositionOptions): string {
  if (results.length === 0) {
    return 'I could not find step-by-step information for this process.';
  }
  
  const steps = results.slice(0, 3).map((result, index) => 
    `**Step ${index + 1}:** ${result.chunk.text} (${result.chunk.bookTitle}, Page ${result.chunk.pageStart})`
  );
  
  return `**Step-by-Step Process:**

${steps.join('\n\n')}`;
}

/**
 * Generate general answer
 */
function generateGeneralAnswer(results: SearchResult[], options: AnswerCompositionOptions): string {
  if (results.length === 0) {
    return 'I could not find relevant information to answer your question.';
  }
  
  const answers = results.slice(0, 3).map(result => 
    `${result.chunk.text} (${result.chunk.bookTitle}, Page ${result.chunk.pageStart})`
  );
  
  return `**Answer:**

${answers.join('\n\n')}`;
}

/**
 * Create properly formatted sources
 */
function createSources(results: SearchResult[], options: AnswerCompositionOptions): Source[] {
  return results.map(result => ({
    chunkId: result.chunkId,
    bookId: result.chunk.bookId,
    bookTitle: result.chunk.bookTitle,
    pageStart: result.chunk.pageStart,
    pageEnd: result.chunk.pageEnd,
    relevance: result.score
  }));
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(results: SearchResult[]): number {
  if (results.length === 0) return 0;
  
  const scores = results.map(r => r.score);
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const maxScore = Math.max(...scores);
  
  // Weight average and max scores
  return (avgScore * 0.7) + (maxScore * 0.3);
}

/**
 * Generate response for low confidence results
 */
function generateLowConfidenceResponse(query: string, results: SearchResult[]): string {
  if (results.length === 0) {
    return 'I couldn\'t find any relevant information in the uploaded textbooks to answer your question. Please try rephrasing your question or check if the relevant subject material has been uploaded.';
  }
  
  const topResults = results.slice(0, 3);
  const maxScore = Math.max(...topResults.map(r => r.score));
  
  if (maxScore < 0.1) {
    return 'I found some information but it doesn\'t seem very relevant to your question. The best matches have very low relevance scores. Please try rephrasing your question or ask about a different topic.';
  }
  
  return `I found some information but I'm not very confident it directly answers your question. Here's what I found that might be related:\n\n${topResults.map((r, i) => 
    `${i + 1}. ${r.chunk.text.substring(0, 200)}...`
  ).join('\n\n')}\n\nPlease let me know if this helps or if you'd like me to search for something more specific.`;
}

/**
 * Format answer with proper citations
 */
export function formatAnswerWithCitations(
  answer: ComposedAnswer,
  bookTitles: Map<string, string>
): string {
  let formattedAnswer = answer.answer;
  
  if (answer.sources.length > 0) {
    formattedAnswer += '\n\n**Sources:**\n';
    
    answer.sources.forEach((source, index) => {
      const bookTitle = bookTitles.get(source.bookId) || 'Unknown Book';
      formattedAnswer += `${index + 1}. ${bookTitle}, pages ${source.pageStart}-${source.pageEnd} (relevance: ${(source.relevance * 100).toFixed(1)}%)\n`;
    });
  }
  
  return formattedAnswer;
}
