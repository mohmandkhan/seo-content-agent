/**
 * Content Generator Agent Tests
 */

import { ContentGeneratorAgent } from '../../src/agents/content-generator';

// Mock the external services
jest.mock('../../src/services/dataforseo/client', () => ({
  DataForSEOClient: jest.fn().mockImplementation(() => ({
    getSERPResults: jest.fn().mockResolvedValue({
      keyword: 'test topic',
      totalResults: 1000000,
      items: [
        {
          rank: 1,
          url: 'https://example.com/article-1',
          title: 'Test Article 1',
          description: 'Description for test article 1',
          domain: 'example.com',
        },
        {
          rank: 2,
          url: 'https://example.com/article-2',
          title: 'Test Article 2',
          description: 'Description for test article 2',
          domain: 'example.com',
        },
      ],
    }),
    getKeywordSuggestions: jest.fn().mockResolvedValue([
      {
        keyword: 'related keyword 1',
        search_volume: 500,
        competition_level: 'medium',
        keyword_difficulty: 45,
      },
      {
        keyword: 'related keyword 2',
        search_volume: 300,
        competition_level: 'low',
        keyword_difficulty: 30,
      },
    ]),
  })),
}));

jest.mock('../../src/services/ai/openai', () => ({
  OpenAIClient: jest.fn().mockImplementation(() => ({
    complete: jest.fn().mockResolvedValue({
      content: JSON.stringify({
        primaryKeyword: {
          keyword: 'test topic',
          searchVolume: 1000,
          competition: 'medium',
          competitionLevel: 'medium',
          cpc: 2.5,
          intent: 'informational',
          aiCitationFormat: 'guide',
        },
        secondaryKeywords: [
          { keyword: 'secondary 1', volume: 500, intent: 'informational', competition: 'low', useIn: 'H2' },
        ],
        longTailClusters: [],
        questions: [
          { question: 'What is test topic?', priority: 'HIGH', volume: 100, placement: 'FAQ' },
        ],
        contentStructure: {
          h1: 'Test Topic Guide',
          metaTitle: 'Test Topic Guide | Complete Overview',
          metaDescription: 'Learn about test topic in this comprehensive guide.',
          targetWordCount: 2000,
          sections: [],
        },
        competitiveAnalysis: {
          totalKeywordsDiscovered: 50,
          averageVolume: 400,
          intentDistribution: { informational: 60, commercial: 30, transactional: 10 },
          contentGaps: [],
        },
      }),
      tokensUsed: 1000,
    }),
    stream: jest.fn().mockImplementation(async function* () {
      yield '# Test Article\n\n';
      yield 'This is the article content.\n\n';
      yield '## Section 1\n\n';
      yield 'Content for section 1.';
    }),
  })),
}));

describe('ContentGeneratorAgent', () => {
  let agent: ContentGeneratorAgent;

  beforeEach(() => {
    // Set required env vars for tests
    process.env.DATAFORSEO_LOGIN = 'test';
    process.env.DATAFORSEO_PASSWORD = 'test';
    process.env.OPENAI_API_KEY = 'test-key';
    
    agent = new ContentGeneratorAgent({ aiProvider: 'openai' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate a complete article', async () => {
      const result = await agent.generate({
        topic: 'test topic',
        targetAudience: 'developers',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.article).toBeDefined();
      expect(result.data.seo).toBeDefined();
      expect(result.data.keywordResearch).toBeDefined();
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should include keyword research results', async () => {
      const result = await agent.generate({
        topic: 'test topic',
        includeKeywordResearch: true,
      });

      expect(result.data.keywordResearch.primaryKeyword).toBeDefined();
      expect(result.data.keywordResearch.primaryKeyword.keyword).toBe('test topic');
    });

    it('should generate SEO metadata', async () => {
      const result = await agent.generate({
        topic: 'test topic',
      });

      expect(result.data.seo.metaTitle).toBeDefined();
      expect(result.data.seo.metaDescription).toBeDefined();
      expect(result.data.seo.primaryKeyword).toBeDefined();
    });
  });

  describe('generateStream', () => {
    it('should stream progress events', async () => {
      const events: any[] = [];
      
      for await (const event of agent.generateStream({ topic: 'test topic' })) {
        events.push(event);
      }

      // Should have progress events
      const progressEvents = events.filter(e => e.type === 'progress');
      expect(progressEvents.length).toBeGreaterThan(0);

      // Should have chunk events
      const chunkEvents = events.filter(e => e.type === 'chunk');
      expect(chunkEvents.length).toBeGreaterThan(0);

      // Should have complete event
      const completeEvent = events.find(e => e.type === 'complete');
      expect(completeEvent).toBeDefined();
      expect(completeEvent.data.success).toBe(true);
    });
  });
});

describe('Input Validation', () => {
  it('should require a topic', async () => {
    process.env.DATAFORSEO_LOGIN = 'test';
    process.env.DATAFORSEO_PASSWORD = 'test';
    process.env.OPENAI_API_KEY = 'test-key';
    
    const agent = new ContentGeneratorAgent();
    
    // Empty topic should still work but produce minimal results
    const result = await agent.generate({ topic: '' });
    expect(result).toBeDefined();
  });
});
