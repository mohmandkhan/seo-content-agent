/**
 * SEO Content Generation Agent - Server Entry Point
 * 
 * Express server that exposes the article generation API.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import articlesRouter from './routes/articles.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/articles', articlesRouter);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'SEO Content Generation Agent',
    version: '1.0.0',
    description: 'Agent-based system for generating SEO-optimized articles',
    endpoints: {
      'POST /api/articles/generate': 'Generate a complete article',
      'POST /api/articles/generate/stream': 'Generate with streaming',
      'GET /api/articles/health': 'Health check',
    },
    documentation: 'See README.md for full API documentation',
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         SEO Content Generation Agent                      ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                  ║
║                                                           ║
║  Endpoints:                                               ║
║  • POST /api/articles/generate                            ║
║  • POST /api/articles/generate/stream                     ║
║  • GET  /api/articles/health                              ║
║                                                           ║
║  Services:                                                ║
║  • DataForSEO: ${process.env.DATAFORSEO_LOGIN ? '✓ Configured' : '✗ Not configured'}                          ║
║  • OpenAI:     ${process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Not configured'}                          ║
║  • Gemini:     ${process.env.GOOGLE_AI_API_KEY ? '✓ Configured' : '✗ Not configured'}                          ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
