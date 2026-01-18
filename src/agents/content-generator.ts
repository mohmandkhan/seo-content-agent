/**
 * Content Generator Agent
 * 
 * Main orchestrator agent that coordinates SERP analysis, keyword research,
 * outline generation, and article writing to produce SEO-optimized content.
 */

import { DataForSEOClient } from '../services/dataforseo/client.js';
import { OpenAIClient } from '../services/ai/openai.js';
import { GeminiClient } from '../services/ai/gemini.js';
import {
  KEYWORD_RESEARCH_SYSTEM_PROMPT,
  buildKeywordResearchPrompt,
} from '../prompts/keyword-research.js';
import {
  OUTLINE_SYSTEM_PROMPT,
  buildOutlinePrompt,
} from '../prompts/outline.js';
import {
  ARTICLE_SYSTEM_PROMPT,
  buildArticlePrompt,
} from '../prompts/article.js';
import {
  ArticleGenerationInput,
  ArticleGenerationOutput,
  KeywordResearchResult,
  OutlineResult,
  StreamEvent,
  Reference,
} from '../types/index.js';

export interface ContentGeneratorConfig {
  aiProvider: 'openai' | 'gemini';
}

export class ContentGeneratorAgent {
  private dataForSEO: DataForSEOClient;
  private aiClient: OpenAIClient | GeminiClient;
  private config: ContentGeneratorConfig;

  constructor(config?: Partial<ContentGeneratorConfig>) {
    this.config = {
      aiProvider: config?.aiProvider || 'openai',
    };

    this.dataForSEO = new DataForSEOClient();
    
    if (this.config.aiProvider === 'gemini') {
      this.aiClient = new GeminiClient();
    } else {
      this.aiClient = new OpenAIClient();
    }
  }

  /**
   * Generate a complete SEO-optimized article
   */
  async generate(input: ArticleGenerationInput): Promise<ArticleGenerationOutput> {
    const startTime = Date.now();
    const tokensUsed = { keywordResearch: 0, outline: 0, article: 0 };

    // Phase 1: SERP Analysis
    const serpData = await this.analyzeSERP(input.topic);

    // Phase 2: Keyword Research
    const { result: keywordResearch, tokens: kwTokens } = await this.performKeywordResearch(
      input.topic,
      serpData,
      input.targetAudience
    );
    tokensUsed.keywordResearch = kwTokens;

    // Phase 3: Outline Generation
    const { result: outline, tokens: outlineTokens } = await this.generateOutline(
      keywordResearch,
      input.internalLinks
    );
    tokensUsed.outline = outlineTokens;

    // Phase 4: Article Writing
    const { content: articleContent, tokens: articleTokens } = await this.writeArticle(
      outline,
      keywordResearch
    );
    tokensUsed.article = articleTokens;

    // Parse references from article
    const references = this.extractReferences(articleContent);

    // Calculate reading time
    const wordCount = this.countWords(articleContent);
    const readingTime = `${Math.ceil(wordCount / 200)} min`;

    return {
      success: true,
      data: {
        article: {
          title: outline.metadata.h1,
          content: articleContent,
          wordCount,
          readingTime,
        },
        seo: {
          metaTitle: outline.metadata.metaTitle,
          metaDescription: outline.metadata.metaDescription,
          primaryKeyword: keywordResearch.primaryKeyword.keyword,
          secondaryKeywords: keywordResearch.secondaryKeywords.map(k => k.keyword),
        },
        outline,
        keywordResearch,
        references,
        internalLinks: input.internalLinks?.map(link => ({
          anchorText: link.title,
          url: link.url,
          placement: 'body',
        })) || [],
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        tokensUsed,
      },
    };
  }

  /**
   * Generate with streaming support
   */
  async *generateStream(input: ArticleGenerationInput): AsyncGenerator<StreamEvent> {
    const startTime = Date.now();
    const tokensUsed = { keywordResearch: 0, outline: 0, article: 0 };

    // Phase 1: SERP Analysis
    yield {
      type: 'progress',
      data: { phase: 'serp_analysis', progress: 5, message: 'Analyzing SERP results...' },
    };
    const serpData = await this.analyzeSERP(input.topic);

    // Phase 2: Keyword Research
    yield {
      type: 'progress',
      data: { phase: 'keyword_research', progress: 20, message: 'Performing keyword research...' },
    };
    const { result: keywordResearch, tokens: kwTokens } = await this.performKeywordResearch(
      input.topic,
      serpData,
      input.targetAudience
    );
    tokensUsed.keywordResearch = kwTokens;

    yield {
      type: 'progress',
      data: { phase: 'keyword_research', progress: 35, message: 'Keyword research complete' },
    };

    // Phase 3: Outline Generation
    yield {
      type: 'progress',
      data: { phase: 'outline', progress: 40, message: 'Generating article outline...' },
    };
    const { result: outline, tokens: outlineTokens } = await this.generateOutline(
      keywordResearch,
      input.internalLinks
    );
    tokensUsed.outline = outlineTokens;

    yield {
      type: 'progress',
      data: { phase: 'outline', progress: 55, message: 'Outline complete' },
    };

    // Phase 4: Article Writing (Streaming)
    yield {
      type: 'progress',
      data: { phase: 'article', progress: 60, message: 'Writing article...' },
    };

    let articleContent = '';
    for await (const chunk of this.writeArticleStream(outline, keywordResearch)) {
      articleContent += chunk;
      yield { type: 'chunk', data: { content: chunk } };
    }

    // Estimate tokens (rough approximation)
    tokensUsed.article = Math.ceil(articleContent.length / 4);

    yield {
      type: 'progress',
      data: { phase: 'article', progress: 95, message: 'Finalizing...' },
    };

    const references = this.extractReferences(articleContent);
    const wordCount = this.countWords(articleContent);
    const readingTime = `${Math.ceil(wordCount / 200)} min`;

    yield {
      type: 'complete',
      data: {
        success: true,
        data: {
          article: {
            title: outline.metadata.h1,
            content: articleContent,
            wordCount,
            readingTime,
          },
          seo: {
            metaTitle: outline.metadata.metaTitle,
            metaDescription: outline.metadata.metaDescription,
            primaryKeyword: keywordResearch.primaryKeyword.keyword,
            secondaryKeywords: keywordResearch.secondaryKeywords.map(k => k.keyword),
          },
          outline,
          keywordResearch,
          references,
          internalLinks: input.internalLinks?.map(link => ({
            anchorText: link.title,
            url: link.url,
            placement: 'body',
          })) || [],
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          tokensUsed,
        },
      },
    };
  }

  /**
   * Analyze SERP results for the topic
   */
  private async analyzeSERP(topic: string): Promise<string> {
    try {
      const serpResult = await this.dataForSEO.getSERPResults({ keyword: topic });
      
      const sections: string[] = ['### SERP Analysis'];
      sections.push(`**Keyword:** ${serpResult.keyword}`);
      sections.push(`**Total Results:** ${serpResult.totalResults.toLocaleString()}`);

      if (serpResult.items.length > 0) {
        sections.push('\n**Top 10 Results:**');
        serpResult.items.forEach((item, i) => {
          sections.push(`${i + 1}. **${item.title}**`);
          sections.push(`   - URL: ${item.url}`);
          sections.push(`   - Domain: ${item.domain}`);
          if (item.description) {
            sections.push(`   - Description: ${item.description.substring(0, 150)}...`);
          }
        });
      }

      return sections.join('\n');
    } catch (error) {
      console.error('SERP analysis failed:', error);
      return 'SERP data unavailable.';
    }
  }

  /**
   * Perform keyword research using AI
   */
  private async performKeywordResearch(
    topic: string,
    serpData: string,
    targetAudience?: string
  ): Promise<{ result: KeywordResearchResult; tokens: number }> {
    // Get keyword suggestions from DataForSEO
    let keywordData = '';
    try {
      const suggestions = await this.dataForSEO.getKeywordSuggestions({ keyword: topic });
      keywordData = this.formatKeywordSuggestions(suggestions);
    } catch (error) {
      console.error('Keyword suggestions failed:', error);
      keywordData = 'Keyword suggestions unavailable.';
    }

    // Generate keyword research report using AI
    const prompt = buildKeywordResearchPrompt(topic, serpData, keywordData, targetAudience);
    
    const response = await this.aiClient.complete({
      messages: [
        { role: 'system', content: KEYWORD_RESEARCH_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });

    const result = this.parseKeywordResearchResponse(response.content, topic);
    return { result, tokens: response.tokensUsed };
  }

  /**
   * Generate article outline
   */
  private async generateOutline(
    keywordResearch: KeywordResearchResult,
    internalLinks?: Array<{ url: string; title: string }>
  ): Promise<{ result: OutlineResult; tokens: number }> {
    const prompt = buildOutlinePrompt(keywordResearch, internalLinks);

    const response = await this.aiClient.complete({
      messages: [
        { role: 'system', content: OUTLINE_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });

    const result = this.parseOutlineResponse(response.content, keywordResearch);
    return { result, tokens: response.tokensUsed };
  }

  /**
   * Write the article
   */
  private async writeArticle(
    outline: OutlineResult,
    keywordResearch: KeywordResearchResult
  ): Promise<{ content: string; tokens: number }> {
    const prompt = buildArticlePrompt(outline, keywordResearch);

    const response = await this.aiClient.complete({
      messages: [
        { role: 'system', content: ARTICLE_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      maxTokens: 8000,
      temperature: 0.7,
    });

    return { content: response.content, tokens: response.tokensUsed };
  }

  /**
   * Write article with streaming
   */
  private async *writeArticleStream(
    outline: OutlineResult,
    keywordResearch: KeywordResearchResult
  ): AsyncGenerator<string> {
    const prompt = buildArticlePrompt(outline, keywordResearch);

    for await (const chunk of this.aiClient.stream({
      messages: [
        { role: 'system', content: ARTICLE_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      maxTokens: 8000,
      temperature: 0.7,
    })) {
      yield chunk;
    }
  }

  /**
   * Format keyword suggestions for the prompt
   */
  private formatKeywordSuggestions(
    suggestions: Array<{
      keyword: string;
      search_volume: number;
      competition_level: string;
      keyword_difficulty: number;
    }>
  ): string {
    const sections: string[] = ['### Keyword Suggestions'];
    sections.push(`**Total Keywords Found:** ${suggestions.length}`);

    if (suggestions.length > 0) {
      sections.push('\n**Top Keywords by Volume:**');
      const sorted = [...suggestions].sort((a, b) => b.search_volume - a.search_volume);
      sorted.slice(0, 30).forEach((kw, i) => {
        sections.push(
          `${i + 1}. "${kw.keyword}" - ${kw.search_volume}/month, ${kw.competition_level} competition, KD: ${kw.keyword_difficulty}`
        );
      });
    }

    return sections.join('\n');
  }

  /**
   * Parse keyword research response from AI
   */
  private parseKeywordResearchResponse(content: string, topic: string): KeywordResearchResult {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse keyword research response:', error);
    }

    // Return fallback structure
    return {
      primaryKeyword: {
        keyword: topic,
        searchVolume: 1000,
        competition: 'medium',
        competitionLevel: 'medium',
        cpc: 1.5,
        intent: 'informational',
        aiCitationFormat: 'comprehensive guide',
      },
      secondaryKeywords: [],
      longTailClusters: [],
      questions: [],
      contentStructure: {
        h1: topic,
        metaTitle: topic,
        metaDescription: `Learn about ${topic}`,
        targetWordCount: 2500,
        sections: [],
      },
      competitiveAnalysis: {
        totalKeywordsDiscovered: 0,
        averageVolume: 0,
        intentDistribution: { informational: 100, commercial: 0, transactional: 0 },
        contentGaps: [],
      },
    };
  }

  /**
   * Parse outline response from AI
   */
  private parseOutlineResponse(
    content: string,
    keywordResearch: KeywordResearchResult
  ): OutlineResult {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse outline response:', error);
    }

    // Return fallback structure
    return {
      metadata: {
        primaryKeyword: keywordResearch.primaryKeyword.keyword,
        h1: keywordResearch.contentStructure.h1,
        metaTitle: keywordResearch.contentStructure.metaTitle,
        metaDescription: keywordResearch.contentStructure.metaDescription,
        targetWordCount: keywordResearch.contentStructure.targetWordCount,
      },
      keyTakeaway: {
        mainAnswer: '',
        bullets: [],
      },
      introduction: {
        paragraphs: [],
      },
      sections: [],
      faq: [],
      conclusion: {
        paragraphs: [],
      },
      citations: [],
    };
  }

  /**
   * Extract references from article content
   */
  private extractReferences(content: string): Reference[] {
    const references: Reference[] = [];
    const refSection = content.match(/## References[\s\S]*$/i);
    
    if (refSection) {
      const refLines = refSection[0].split('\n').filter(line => line.match(/^\d+\./));
      refLines.forEach((line, index) => {
        const urlMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (urlMatch) {
          references.push({
            number: index + 1,
            source: urlMatch[1],
            url: urlMatch[2],
          });
        }
      });
    }

    return references;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text
      .replace(/[#*_`\[\]()]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  }
}
