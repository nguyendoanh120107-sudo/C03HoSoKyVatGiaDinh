import { executeGeminiAssist } from '../../lib/geminiServer';

async function readParsedBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on?.('data', (chunk: Buffer | string) => {
      raw += chunk.toString();
    });
    req.on?.('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on?.('error', () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Chỉ hỗ trợ POST.' });
    return;
  }

  const body = await readParsedBody(req);
  const result = await executeGeminiAssist(body);
  res.status(result.httpStatus).json(result);
}
