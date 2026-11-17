import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  checkGeminiServerHealth,
  executeGeminiAssist,
} from './lib/geminiServer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

function readJsonDataFile(fileName: string): unknown {
  const filePath = path.resolve(__dirname, 'src', 'data', fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

app.get('/api/public/artifacts', (_req, res) => {
  try {
    res.json(readJsonDataFile('artifacts.json'));
  } catch {
    res.status(500).json({ error: 'Không đọc được artifacts.json' });
  }
});

app.get('/api/public/sources', (_req, res) => {
  try {
    res.json(readJsonDataFile('sources.json'));
  } catch {
    res.status(500).json({ error: 'Không đọc được sources.json' });
  }
});

app.get('/api/public/permissions', (_req, res) => {
  try {
    res.json(readJsonDataFile('permissions.json'));
  } catch {
    res.status(500).json({ error: 'Không đọc được permissions.json' });
  }
});

app.get('/api/public/bundle', (_req, res) => {
  try {
    res.json({
      artifacts: readJsonDataFile('artifacts.json'),
      sources: readJsonDataFile('sources.json'),
      permissions: readJsonDataFile('permissions.json'),
    });
  } catch {
    res.status(500).json({ error: 'Không đọc được gói dữ liệu công khai.' });
  }
});

app.get('/api/gemini/health', async (req, res) => {
  const verify = req.query?.verify === '1' || req.query?.verify === 'true';
  const result = await checkGeminiServerHealth(verify);
  res.status(result.httpStatus).json(result);
});

app.post('/api/gemini/assist', async (req, res) => {
  const result = await executeGeminiAssist(req.body ?? {});
  res.status(result.httpStatus).json(result);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
