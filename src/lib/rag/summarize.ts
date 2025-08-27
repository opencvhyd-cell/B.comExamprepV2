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
  const bestResult = results[0];
  const text = bestResult.chunk.text;
  
  // Try to find a concise definition
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const definitionSentence = sentences.find(s => 
    s.toLowerCase().includes('is') || 
    s.toLowerCase().includes('refers to') ||
    s.toLowerCase().includes('defined as')
  ) || sentences[0];
  
  let answer = `Based on the textbook content:\n\n${definitionSentence.trim()}.`;
  
  if (results.length > 1) {
    answer += '\n\nAdditional context:\n';
    const additionalInfo = results.slice(1, 3).map(r => 
      r.chunk.text.split(/[.!?]+/)[0].trim()
    ).join(' ');
    answer += additionalInfo;
  }
  
  return answer;
}

/**
 * Generate explanation-style answer
 */
function generateExplanationAnswer(results: SearchResult[], options: AnswerCompositionOptions): string {
  let answer = 'Based on the textbook content:\n\n';
  
  // Combine information from multiple chunks
  const explanations = results.slice(0, 3).map((result, index) => {
    const text = result.chunk.text;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
    return sentences.slice(0, 2).join('. ').trim();
  });
  
  answer += explanations.join('\n\n');
  
  return answer;
}

/**
 * Generate comparison-style answer
 */
function generateComparisonAnswer(results: SearchResult[], options: AnswerCompositionOptions): string {
  let answer = 'Based on the textbook content:\n\n';
  
  // Look for comparison language in chunks
  const comparisonTexts = results.slice(0, 3).map(result => {
    const text = result.chunk.text;
    const comparisonSentences = text.split(/[.!?]+/).filter(s => 
      s.toLowerCase().includes('however') ||
      s.toLowerCase().includes('while') ||
      s.toLowerCase().includes('on the other hand') ||
      s.toLowerCase().includes('difference') ||
      s.toLowerCase().includes('similar')
    );
    return comparisonSentences.slice(0, 2).join('. ').trim();
  });
  
  answer += comparisonTexts.join('\n\n');
  
  return answer;
}

/**
 * Generate step-by-step answer
 */
function generateStepByStepAnswer(results: SearchResult[], options: AnswerCompositionOptions): string {
  let answer = 'Based on the textbook content, here are the steps:\n\n';
  
  // Look for numbered or ordered content
  const stepTexts = results.slice(0, 3).map(result => {
    const text = result.chunk.text;
    const stepSentences = text.split(/[.!?]+/).filter(s => 
      /^\s*\d+\./.test(s) || // Numbered steps
      /^\s*[a-z]\)/.test(s) || // Lettered steps
      s.toLowerCase().includes('first') ||
      s.toLowerCase().includes('next') ||
      s.toLowerCase().includes('then') ||
      s.toLowerCase().includes('finally')
    );
    return stepSentences.slice(0, 3).join('. ').trim();
  });
  
  answer += stepTexts.join('\n\n');
  
  return answer;
}

/**
 * Generate general answer
 */
function generateGeneralAnswer(results: SearchResult[], options: AnswerCompositionOptions): string {
  let answer = 'Based on the textbook content:\n\n';
  
  // Combine information from top chunks
  const texts = results.slice(0, 3).map(result => {
    const text = result.chunk.text;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 2).join('. ').trim();
  });
  
  answer += texts.join('\n\n');
  
  return answer;
}

/**
 * Create properly formatted sources
 */
function createSources(results: SearchResult[], options: AnswerCompositionOptions): Source[] {
  return results.map(result => ({
    chunkId: result.chunk.id,
    bookId: result.chunk.bookId,
    bookTitle: 'Textbook', // This will be populated from book data
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
