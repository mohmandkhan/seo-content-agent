/**
 * DataForSEO API Client
 * 
 * Client for interacting with DataForSEO API for SERP analysis
 * and keyword research capabilities.
 */

import {
  DataForSEOConfig,
  DataForSEOResponse,
  SERPTaskResult,
  KeywordDataResult,
  KeywordSuggestion,
  DataForSEOError,
} from './types.js';

const DEFAULT_BASE_URL = 'https://api.dataforseo.com/v3';

export class DataForSEOClient {
  private config: DataForSEOConfig;
  private authHeader: string;

  constructor(config?: Partial<DataForSEOConfig>) {
    this.config = {
      login: config?.login || process.env.DATAFORSEO_LOGIN || '',
      password: config?.password || process.env.DATAFORSEO_PASSWORD || '',
      baseUrl: config?.baseUrl || DEFAULT_BASE_URL,
    };

    if (!this.config.login || !this.config.password) {
      throw new DataForSEOError(
        'DataForSEO credentials not configured',
        'AUTH_ERROR'
      );
    }

    this.authHeader = Buffer.from(
      `${this.config.login}:${this.config.password}`
    ).toString('base64');
  }

  /**
   * Make authenticated request to DataForSEO API
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: unknown
  ): Promise<DataForSEOResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Basic ${this.authHeader}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new DataForSEOError('Invalid credentials', 'AUTH_ERROR', 401);
        }
        if (response.status === 429) {
          throw new DataForSEOError('Rate limit exceeded', 'RATE_LIMIT', 429);
        }
        throw new DataForSEOError(
          `API error: ${response.statusText}`,
          'API_ERROR',
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof DataForSEOError) throw error;
      throw new DataForSEOError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown'}`,
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Get Google SERP results for a keyword
   * Returns top 10 organic search results with titles, URLs, and descriptions
   */
  async getSERPResults(params: {
    keyword: string;
    locationCode?: number;
    languageCode?: string;
    depth?: number;
  }): Promise<{
    keyword: string;
    totalResults: number;
    items: Array<{
      rank: number;
      url: string;
      title: string;
      description: string;
      domain: string;
    }>;
  }> {
    const taskData = [
      {
        keyword: params.keyword,
        location_code: params.locationCode || 2840, // US
        language_code: params.languageCode || 'en',
        device: 'desktop',
        depth: params.depth || 10,
      },
    ];

    const response = await this.request<SERPTaskResult>(
      '/serp/google/organic/live/advanced',
      'POST',
      taskData
    );

    const result = response.tasks?.[0]?.result?.[0];
    if (!result) {
      return { keyword: params.keyword, totalResults: 0, items: [] };
    }

    const organicItems = result.items
      ?.filter((item) => item.type === 'organic')
      .slice(0, 10)
      .map((item, index) => ({
        rank: index + 1,
        url: item.url,
        title: item.title,
        description: item.description || '',
        domain: item.domain,
      })) || [];

    return {
      keyword: result.keyword,
      totalResults: result.se_results_count,
      items: organicItems,
    };
  }

  /**
   * Get keyword data including search volume and competition
   */
  async getKeywordData(params: {
    keywords: string[];
    locationCode?: number;
    languageCode?: string;
  }): Promise<KeywordDataResult[]> {
    const taskData = [
      {
        keywords: params.keywords,
        location_code: params.locationCode || 2840,
        language_code: params.languageCode || 'en',
      },
    ];

    const response = await this.request<KeywordDataResult>(
      '/keywords_data/google_ads/search_volume/live',
      'POST',
      taskData
    );

    return response.tasks?.[0]?.result || [];
  }

  /**
   * Get keyword suggestions based on a seed keyword
   */
  async getKeywordSuggestions(params: {
    keyword: string;
    locationCode?: number;
    languageCode?: string;
    limit?: number;
  }): Promise<KeywordSuggestion[]> {
    const taskData = [
      {
        keyword: params.keyword,
        location_code: params.locationCode || 2840,
        language_code: params.languageCode || 'en',
        limit: params.limit || 100,
      },
    ];

    const response = await this.request<{ items: KeywordSuggestion[] }>(
      '/dataforseo_labs/google/keyword_suggestions/live',
      'POST',
      taskData
    );

    return response.tasks?.[0]?.result?.[0]?.items || [];
  }

  /**
   * Get related keywords for competitive analysis
   */
  async getRelatedKeywords(params: {
    keyword: string;
    locationCode?: number;
    languageCode?: string;
    limit?: number;
  }): Promise<KeywordSuggestion[]> {
    const taskData = [
      {
        keyword: params.keyword,
        location_code: params.locationCode || 2840,
        language_code: params.languageCode || 'en',
        limit: params.limit || 50,
      },
    ];

    const response = await this.request<{ items: KeywordSuggestion[] }>(
      '/dataforseo_labs/google/related_keywords/live',
      'POST',
      taskData
    );

    return response.tasks?.[0]?.result?.[0]?.items || [];
  }
}

export { DataForSEOError };
