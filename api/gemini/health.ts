import { checkGeminiServerHealth } from '../../lib/geminiServer';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Chỉ hỗ trợ GET.' });
    return;
  }

  const verify = req.query?.verify === '1' || req.query?.verify === 'true';
  const result = await checkGeminiServerHealth(verify);
  res.status(result.httpStatus).json(result);
}
