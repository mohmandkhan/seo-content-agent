# SEO Content Generation Agent

> **⚠️ IMPORTANT NOTICE**
> 
> This repository contains a **subset of code** extracted from a **live production SaaS application**. The full source code cannot be disclosed due to proprietary business reasons.
> 
> **🔗 Live Application URL:** https://content-automation-app-production.up.railway.app
> 
> The complete system includes additional features such as:
> - Multi-tenant authentication & authorization
> - Team management & collaboration
> - Billing & subscription management (Stripe)
> - Publishing integrations (WordPress, Shopify)
> - Content versioning & scheduling
> - Analytics & reporting dashboard
> - And much more...
>
> This extract demonstrates the core **agent-based content generation system** as requested in the assessment.

---

## Overview

An intelligent agent-based system that generates SEO-optimized articles by:

1. **Analyzing SERP data** - Fetches and analyzes top 10 search results for target keywords
2. **Performing keyword research** - Identifies primary, secondary, and long-tail keywords
3. **Generating structured outlines** - Creates EEAT-compliant article structures
4. **Producing publish-ready content** - Writes natural, SEO-optimized articles

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API Layer (Express)                          │
│                    POST /api/articles/generate                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Content Generator Agent                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Phase 1   │  │   Phase 2   │  │   Phase 3   │  │  Phase 4   │ │
│  │    SERP     │─▶│  Keyword    │─▶│   Outline   │─▶│  Article   │ │
│  │  Analysis   │  │  Research   │  │ Generation  │  │  Writing   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
         │                                                    │
         ▼                                                    ▼
┌─────────────────────┐                          ┌─────────────────────┐
│   DataForSEO API    │                          │   OpenAI GPT-4 /    │
│  - SERP Results     │                          │   Google Gemini     │
│  - Keyword Data     │                          │  - Content Gen      │
│  - Suggestions      │                          │  - Streaming        │
└─────────────────────┘                          └─────────────────────┘
```

## Features

### SERP Analysis
- Fetches top 10 organic search results via DataForSEO
- Extracts titles, URLs, descriptions, and domains
- Identifies common themes and content patterns
- Analyzes competitor content structure

### Keyword Research
- Primary keyword selection (500-10K volume preferred)
- 8-15 secondary keywords for H2/H3 sections
- Long-tail keyword clusters (5 clusters × 6 keywords)
- Question-based keywords for FAQ sections
- Competition and difficulty analysis

### Outline Generation
- EEAT-compliant structure (Experience, Expertise, Authoritativeness, Trust)
- AI-citation optimized format
- Internal linking strategy
- Word count targets per section
- Citation placeholders with source URLs

### Article Generation
- Natural, human-like writing
- Primary keyword placement optimization
- Proper header hierarchy (H1, H2, H3)
- FAQ section with structured answers
- References section with citations
- Streaming support for real-time output

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **AI Providers**: OpenAI GPT-4 / Google Gemini
- **SERP Data**: DataForSEO API
- **Validation**: Zod
- **Testing**: Jest

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your API keys to .env

# Run in development
npm run dev

# Run tests
npm test
```

## API Specification

### Generate Article

```http
POST /api/articles/generate
Content-Type: application/json
```

**Request Body:**
```json
{
  "topic": "best productivity tools for remote teams",
  "targetAudience": "remote workers and team managers",
  "contentType": "comprehensive guide",
  "targetWordCount": 2500,
  "includeKeywordResearch": true,
  "includeFAQ": true,
  "internalLinks": [
    {
      "url": "/blog/remote-work-tips",
      "title": "Remote Work Tips",
      "relevance": "high"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "article": {
      "title": "Best Productivity Tools for Remote Teams in 2024",
      "content": "# Best Productivity Tools for Remote Teams...",
      "wordCount": 2547,
      "readingTime": "10 min"
    },
    "seo": {
      "metaTitle": "Best Productivity Tools for Remote Teams | Complete Guide 2024",
      "metaDescription": "Discover the top productivity tools...",
      "primaryKeyword": "productivity tools for remote teams",
      "secondaryKeywords": ["remote team software", "collaboration tools"]
    },
    "outline": {
      "sections": [],
      "faq": []
    },
    "keywordResearch": {
      "primaryKeyword": {},
      "secondaryKeywords": [],
      "longTailClusters": [],
      "competitiveAnalysis": {}
    },
    "references": [
      {
        "number": 1,
        "source": "Harvard Business Review",
        "url": "https://hbr.org/..."
      }
    ]
  },
  "metadata": {
    "generatedAt": "2024-01-15T10:30:00Z",
    "processingTime": 45000
  }
}
```

### Streaming Endpoint

```http
POST /api/articles/generate/stream
```

Returns Server-Sent Events (SSE):

```
event: progress
data: {"phase": "serp_analysis", "progress": 10}

event: chunk
data: {"content": "# Best Productivity Tools..."}

event: complete
data: {"success": true}
```

## Project Structure

```
├── src/
│   ├── index.ts                 # Express server
│   ├── routes/
│   │   └── articles.ts          # Article generation routes
│   ├── agents/
│   │   └── content-generator.ts # Main orchestrator agent
│   ├── services/
│   │   ├── dataforseo/
│   │   │   ├── client.ts        # DataForSEO API client
│   │   │   └── types.ts
│   │   └── ai/
│   │       ├── openai.ts        # OpenAI client
│   │       └── gemini.ts        # Gemini client
│   ├── prompts/
│   │   ├── keyword-research.ts
│   │   ├── outline.ts
│   │   └── article.ts
│   └── types/
│       └── index.ts
├── tests/
├── examples/
│   └── sample-output.json
├── package.json
└── tsconfig.json
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATAFORSEO_LOGIN` | Yes | DataForSEO API login |
| `DATAFORSEO_PASSWORD` | Yes | DataForSEO API password |
| `OPENAI_API_KEY` | Yes* | OpenAI API key |
| `GOOGLE_AI_API_KEY` | Yes* | Google Gemini API key |
| `PORT` | No | Server port (default: 3000) |

*At least one AI provider required

## Design Decisions

### Agent-Based Architecture
Modular agent architecture where each phase is handled by a specialized agent:
- **Separation of concerns** - Each agent focuses on one task
- **Testability** - Agents can be tested in isolation
- **Extensibility** - New agents can be added easily
- **Streaming** - Progress reported at each phase

### SERP Analysis Strategy
- Analyzes ranking patterns
- Extracts common themes across top results
- Identifies content gaps and opportunities
- Informs keyword strategy based on actual SERP data

### SEO Best Practices
- **Answer-first structure** - Direct answers at the beginning
- **EEAT compliance** - Author credentials, citations, balanced language
- **AI-citation optimization** - Structured for AI overview inclusion
- **Natural keyword integration** - No keyword stuffing

## Performance

Typical generation times:
- SERP Analysis: 2-5 seconds
- Keyword Research: 5-10 seconds
- Outline Generation: 5-10 seconds
- Article Writing: 20-40 seconds
- **Total: 35-65 seconds**

## License

This code is provided for assessment purposes only.

---

## About the Full System

This is part of a comprehensive **Content Automation SaaS** platform:

- **5-Step Workflow**: Links scanning → Business analysis → EEAT sources → Topics → Content
- **Multi-tenant Architecture**: Organizations, workspaces, teams
- **Publishing Pipeline**: WordPress, Shopify integration
- **Content Management**: Versioning, scheduling, collaboration
- **Analytics Dashboard**: Performance tracking, SEO metrics
- **Billing System**: Stripe integration

**🔗 Live Demo:** https://content-automation-app-production.up.railway.app
