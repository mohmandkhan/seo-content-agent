/**
 * Shared Types for SEO Content Generation Agent
 */

// ===========================================
// INPUT TYPES
// ===========================================

export interface ArticleGenerationInput {
  /** Topic/keyword to generate content for */
  topic: string;
  /** Target audience description */
  targetAudience?: string;
  /** Type of content (blog post, guide, etc.) */
  contentType?: string;
  /** Target word count */
  targetWordCount?: number;
  /** Whether to include keyword research report */
  includeKeywordResearch?: boolean;
  /** Whether to include FAQ section */
  includeFAQ?: boolean;
  /** Internal links to incorporate */
  internalLinks?: InternalLink[];
}

export interface InternalLink {
  url: string;
  title: string;
  relevance?: 'high' | 'medium' | 'low';
}

// ===========================================
// SERP TYPES
// ===========================================

export interface SERPResult {
  keyword: string;
  totalResults: number;
  items: SERPItem[];
}

export interface SERPItem {
  rank: number;
  url: string;
  title: string;
  description: string;
  domain: string;
}

// ===========================================
// KEYWORD RESEARCH TYPES
// ===========================================

export interface KeywordResearchResult {
  primaryKeyword: PrimaryKeyword;
  secondaryKeywords: SecondaryKeyword[];
  longTailClusters: LongTailCluster[];
  questions: QuestionKeyword[];
  contentStructure: ContentStructure;
  competitiveAnalysis: CompetitiveAnalysis;
}

export interface PrimaryKeyword {
  keyword: string;
  searchVolume: number;
  competition: string;
  competitionLevel: 'low' | 'medium' | 'high';
  cpc: number;
  intent: 'informational' | 'commercial' | 'transactional';
  aiCitationFormat: string;
}

export interface SecondaryKeyword {
  keyword: string;
  volume: number;
  intent: string;
  competition: string;
  useIn: string;
}

export interface LongTailCluster {
  theme: string;
  keywords: {
    keyword: string;
    volume: number;
    intent: string;
  }[];
}

export interface QuestionKeyword {
  question: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  volume: number;
  placement: string;
}

export interface ContentStructure {
  h1: string;
  metaTitle: string;
  metaDescription: string;
  targetWordCount: number;
  sections: ContentSection[];
}

export interface ContentSection {
  type: 'h2' | 'h3';
  title: string;
  wordCount: number;
  intent: string;
  keywords: string[];
  subsections?: ContentSection[];
}

export interface CompetitiveAnalysis {
  totalKeywordsDiscovered: number;
  averageVolume: number;
  intentDistribution: {
    informational: number;
    commercial: number;
    transactional: number;
  };
  contentGaps: string[];
}

// ===========================================
// OUTLINE TYPES
// ===========================================

export interface OutlineResult {
  metadata: {
    primaryKeyword: string;
    h1: string;
    metaTitle: string;
    metaDescription: string;
    targetWordCount: number;
  };
  keyTakeaway: {
    mainAnswer: string;
    bullets: string[];
  };
  introduction: {
    paragraphs: OutlineParagraph[];
  };
  sections: OutlineSection[];
  faq: FAQItem[];
  conclusion: {
    paragraphs: OutlineParagraph[];
  };
  citations: Citation[];
}

export interface OutlineParagraph {
  wordCount: number;
  whatToWrite: string[];
  keywords: string[];
}

export interface OutlineSection {
  type: 'h2' | 'h3';
  title: string;
  wordCount: number;
  intent: string;
  paragraphs: OutlineParagraph[];
  subsections?: OutlineSection[];
}

export interface FAQItem {
  question: string;
  priority: string;
  answerStructure: {
    directAnswer: string;
    context: string;
  };
  wordCount: number;
}

export interface Citation {
  sourceName: string;
  url: string;
  type: string;
  useIn: string;
}

// ===========================================
// ARTICLE OUTPUT TYPES
// ===========================================

export interface ArticleResult {
  title: string;
  content: string;
  wordCount: number;
  readingTime: string;
}

export interface ArticleGenerationOutput {
  success: boolean;
  data: {
    article: ArticleResult;
    seo: {
      metaTitle: string;
      metaDescription: string;
      primaryKeyword: string;
      secondaryKeywords: string[];
    };
    outline: OutlineResult;
    keywordResearch: KeywordResearchResult;
    references: Reference[];
    internalLinks: PlacedInternalLink[];
  };
  metadata: {
    generatedAt: string;
    processingTime: number;
    tokensUsed: {
      keywordResearch: number;
      outline: number;
      article: number;
    };
  };
}

export interface Reference {
  number: number;
  source: string;
  url: string;
}

export interface PlacedInternalLink {
  anchorText: string;
  url: string;
  placement: string;
}

// ===========================================
// STREAMING TYPES
// ===========================================

export interface StreamEvent {
  type: 'progress' | 'chunk' | 'complete' | 'error';
  data: ProgressData | ChunkData | CompleteData | ErrorData;
}

export interface ProgressData {
  phase: string;
  progress: number;
  message: string;
}

export interface ChunkData {
  content: string;
}

export interface CompleteData {
  success: boolean;
  data: ArticleGenerationOutput['data'];
}

export interface ErrorData {
  message: string;
  code: string;
}

// ===========================================
// AI SERVICE TYPES
// ===========================================

export interface AICompletionRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResponse {
  content: string;
  tokensUsed: number;
}
