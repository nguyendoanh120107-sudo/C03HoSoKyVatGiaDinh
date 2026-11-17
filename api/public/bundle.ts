import fs from 'fs';
import path from 'path';

function readJson(fileName: string) {
  const filePath = path.resolve(process.cwd(), 'src', 'data', fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }
  try {
    res.status(200).json({
      artifacts: readJson('artifacts.json'),
      sources: readJson('sources.json'),
      permissions: readJson('permissions.json'),
    });
  } catch {
    res.status(500).json({ error: 'Không đọc được gói dữ liệu công khai.' });
  }
}
