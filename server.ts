import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Start Server with Vite Middleware in Development or Static SPA in Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(expressStaticDist(distPath));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Genzio Server listening on port ${PORT}`);
  });
}

function expressStaticDist(distPath: string) {
  const express = require('express');
  const router = express.Router();
  router.use(express.static(distPath));
  router.get('*', (_req: any, res: any) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  return router;
}

startServer();
