/**
 * Google Gemini API Client
 * 
 * Client for interacting with Google Gemini for content generation.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AICompletionRequest, AICompletionResponse } from '../../types/index.js';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class GeminiClient {
  private config: GeminiConfig;
  private client: GoogleGenerativeAI;

  constructor(config?: Partial<GeminiConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.GOOGLE_AI_API_KEY || '',
      model: config?.model || 'gemini-1.5-pro',
      maxTokens: config?.maxTokens || 8192,
      temperature: config?.temperature || 0.7,
    };

    if (!this.config.apiKey) {
      throw new Error('Google AI API key not configured');
    }

    this.client = new GoogleGenerativeAI(this.config.apiKey);
  }

  /**
   * Create a completion
   */
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const model = this.client.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        maxOutputTokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature ?? this.config.temperature,
      },
    });

    // Convert messages to Gemini format
    const systemPrompt = request.messages.find(m => m.role === 'system')?.content || '';
    const userMessage = request.messages.find(m => m.role === 'user')?.content || '';
    
    const prompt = systemPrompt 
      ? `${systemPrompt}\n\n---\n\n${userMessage}`
      : userMessage;

    const result = await model.generateContent(prompt);
    const response = result.response;

    return {
      content: response.text(),
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
    };
  }

  /**
   * Stream a completion
   */
  async *stream(request: AICompletionRequest): AsyncGenerator<string> {
    const model = this.client.getGenerativeModel({
      model: this.config.model,
      generationConfig: {
        maxOutputTokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature ?? this.config.temperature,
      },
    });

    const systemPrompt = request.messages.find(m => m.role === 'system')?.content || '';
    const userMessage = request.messages.find(m => m.role === 'user')?.content || '';
    
    const prompt = systemPrompt 
      ? `${systemPrompt}\n\n---\n\n${userMessage}`
      : userMessage;

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  getModel(): string {
    return this.config.model;
  }
}
