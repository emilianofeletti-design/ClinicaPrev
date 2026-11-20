import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  getStoredMonthlyDigest,
  runMonthlyAcademicScanIfDue,
} from './server/researchService';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Return cached academic digest with live 30-day eligibility flags (zero external API calls)
  app.get('/api/monitoring/digest', (_req, res) => {
    const digest = getStoredMonthlyDigest();
    res.json(digest);
  });

  // Lazy on-demand monthly scan: runs at most once every 30 days and only when requested by a visitor.
  // If <30 days have elapsed, returns the cached digest without making any external API call.
  app.post('/api/monitoring/run-monthly-scan', async (_req, res) => {
    try {
      const updated = await runMonthlyAcademicScanIfDue();
      res.json(updated);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossibile completare l’aggiornamento periodico su PubMed, Google Scholar e AIRC.';
      res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClinicaPrev server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
