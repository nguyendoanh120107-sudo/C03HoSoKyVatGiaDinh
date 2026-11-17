import fs from 'fs';
import path from 'path';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  try {
    const filePath = path.resolve(process.cwd(), 'src', 'data', 'permissions.json');
    res.status(200).json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
  } catch {
    res.status(500).json({ error: 'Không đọc được permissions.json' });
  }
}
