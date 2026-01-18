/**
 * Article Generation Routes
 * 
 * Express routes for article generation API endpoints.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ContentGeneratorAgent } from '../agents/content-generator.js';

const router = Router();

// Request validation schema
const GenerateArticleSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  targetAudience: z.string().optional(),
  contentType: z.string().optional(),
  targetWordCount: z.number().min(500).max(10000).optional(),
  includeKeywordResearch: z.boolean().optional().default(true),
  includeFAQ: z.boolean().optional().default(true),
  internalLinks: z.array(z.object({
    url: z.string().url(),
    title: z.string(),
    relevance: z.enum(['high', 'medium', 'low']).optional(),
  })).optional(),
});

/**
 * POST /api/articles/generate
 * Generate a complete SEO-optimized article
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = GenerateArticleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validationResult.error.errors,
        },
      });
    }

    const input = validationResult.data;

    // Determine AI provider from query param or default
    const aiProvider = req.query.provider === 'gemini' ? 'gemini' : 'openai';
    
    const agent = new ContentGeneratorAgent({ aiProvider });
    const result = await agent.generate(input);

    return res.json(result);
  } catch (error) {
    console.error('Article generation failed:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/articles/generate/stream
 * Generate article with Server-Sent Events streaming
 */
router.post('/generate/stream', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = GenerateArticleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validationResult.error.errors,
        },
      });
    }

    const input = validationResult.data;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Determine AI provider
    const aiProvider = req.query.provider === 'gemini' ? 'gemini' : 'openai';
    
    const agent = new ContentGeneratorAgent({ aiProvider });

    // Stream events
    for await (const event of agent.generateStream(input)) {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event.data)}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Streaming generation failed:', error);
    
    // Send error event if headers already sent
    if (res.headersSent) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'GENERATION_ERROR',
      })}\n\n`);
      res.end();
    } else {
      return res.status(500).json({
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
});

/**
 * GET /api/articles/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      dataForSEO: !!process.env.DATAFORSEO_LOGIN,
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GOOGLE_AI_API_KEY,
    },
  });
});

export default router;
