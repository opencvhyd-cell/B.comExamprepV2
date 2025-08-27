import Groq from 'groq-sdk';

export interface LLMOptions {
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface LLMResponse {
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export const DEFAULT_LLM_OPTIONS: LLMOptions = {
  model: 'llama3-8b-8192',
  temperature: 0.1,
  maxTokens: 1000
};

// Initialize Groq (you'll need to set GROQ_API_KEY in your .env file)
if (!import.meta.env.VITE_GROQ_API_KEY) {
  console.warn('⚠️ VITE_GROQ_API_KEY not found in environment variables');
  console.warn('⚠️ Please add VITE_GROQ_API_KEY to your .env file');
}

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || 'your-api-key-here',
  dangerouslyAllowBrowser: true
});

/**
 * Generate answer using Groq LLM
 */
export async function generateAnswer(
  query: string,
  context: string,
  options: LLMOptions = DEFAULT_LLM_OPTIONS
): Promise<LLMResponse> {
  try {
    console.log(`🤖 Groq LLM: Generating answer for query: "${query.substring(0, 50)}..."`);
    
    const prompt = `You are a helpful AI assistant that answers questions based on the provided context from textbooks. 

Context:
${context}

Question: ${query}

Instructions:
1. Answer the question based ONLY on the provided context
2. If the context doesn't contain enough information, say "I don't have enough information from the provided context to answer this question completely."
3. Be concise but thorough
4. Cite specific parts of the context when possible
5. If the question is unclear, ask for clarification

Answer:`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: options.model,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: false
    });

    const response = completion.choices[0]?.message?.content || 'No response generated';
    
    console.log(`✅ Groq LLM: Generated answer (${response.length} characters)`);
    
    return {
      text: response,
      model: options.model,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      }
    };
  } catch (error) {
    console.error('❌ Groq LLM Error:', error);
    throw new Error(`Failed to generate answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a summary of retrieved chunks
 */
export async function summarizeChunks(
  chunks: Array<{ text: string; bookTitle: string; pageStart: number; pageEnd: number }>,
  query: string,
  options: LLMOptions = DEFAULT_LLM_OPTIONS
): Promise<LLMResponse> {
  try {
    console.log(`🤖 Groq LLM: Summarizing ${chunks.length} chunks for query`);
    
    const contextText = chunks.map((chunk, index) => 
      `[${index + 1}] ${chunk.text}\nSource: ${chunk.bookTitle}, pp. ${chunk.pageStart}-${chunk.pageEnd}\n`
    ).join('\n');
    
    const prompt = `Based on the following text chunks from textbooks, provide a comprehensive answer to the question.

Question: ${query}

Text Chunks:
${contextText}

Instructions:
1. Synthesize information from all relevant chunks
2. Provide a clear, structured answer
3. Include page references when citing specific information
4. If chunks contain conflicting information, note this
5. If the answer is incomplete, mention what additional information might be needed

Answer:`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: options.model,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: false
    });

    const response = completion.choices[0]?.message?.content || 'No summary generated';
    
    console.log(`✅ Groq LLM: Generated summary (${response.length} characters)`);
    
    return {
      text: response,
      model: options.model,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      }
    };
  } catch (error) {
    console.error('❌ Groq LLM Summary Error:', error);
    throw new Error(`Failed to summarize chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get available models
 */
export async function getAvailableModels(): Promise<string[]> {
  try {
    const models = await groq.models.list();
    return models.data.map(model => model.id);
  } catch (error) {
    console.error('❌ Groq Models Error:', error);
    return ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768'];
  }
}
