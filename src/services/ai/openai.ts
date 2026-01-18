/**
 * OpenAI API Client
 * 
 * Client for interacting with OpenAI GPT-4 for content generation.
 */

import { AICompletionRequest, AICompletionResponse } from '../../types/index.js';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class OpenAIClient {
  private config: OpenAIConfig;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(config?: Partial<OpenAIConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.OPENAI_API_KEY || '',
      model: config?.model || 'gpt-4-turbo-preview',
      maxTokens: config?.maxTokens || 4096,
      temperature: config?.temperature || 0.7,
    };

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  }

  /**
   * Create a chat completion
   */
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: request.messages,
        max_tokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature ?? this.config.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }

  /**
   * Stream a chat completion
   */
  async *stream(request: AICompletionRequest): AsyncGenerator<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: request.messages,
        max_tokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature ?? this.config.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip malformed chunks
          }
        }
      }
    }
  }

  getModel(): string {
    return this.config.model;
  }
}
