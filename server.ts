import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

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
  } catch (err) {
    res.status(500).json({ error: 'Không đọc được artifacts.json' });
  }
});

app.get('/api/public/sources', (_req, res) => {
  try {
    res.json(readJsonDataFile('sources.json'));
  } catch (err) {
    res.status(500).json({ error: 'Không đọc được sources.json' });
  }
});

app.get('/api/public/permissions', (_req, res) => {
  try {
    res.json(readJsonDataFile('permissions.json'));
  } catch (err) {
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
  } catch (err) {
    res.status(500).json({ error: 'Không đọc được gói dữ liệu công khai.' });
  }
});

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/gemini/health', (_req, res) => {
  const client = getGeminiClient();
  res.json({
    configured: Boolean(client),
    model: 'gemini-4-hydrogen',
  });
});

interface SanitizedArtifactContext {
  identifier: string;
  title: string;
  creator: string;
  subject: string;
  description: string;
  date: string;
  type: string;
  material: string;
  dimensions: string;
  artifactCategory: string;
  originalCondition: string;
  displayedCopyType: string;
  currentStorageLocation: string;
  historicalStorageLocation: string;
  familyStory: string;
  storyTeller: string;
  storyRecordedDate: string;
  storyVerificationStatus: string;
  acquisitionHistory: string;
  permissionStatus: string;
  permissionScope: string;
  verificationStatus: string;
  unresolvedQuestions: string;
  sourcesSummary: string;
}

type GeminiAssistAction =
  | 'qa'
  | 'summarize_story'
  | 'curatorial_narration'
  | 'standardize_description'
  | 'missing_info'
  | 'interview_questions';

app.post('/api/gemini/assist', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    res.status(503).json({
      error: 'GEMINI_NOT_CONFIGURED',
      message:
        'Tính năng Gemini chưa được cấu hình trên máy chủ (chưa có GEMINI_API_KEY). Vui lòng kiểm tra mục Settings > Secrets trong Google AI Studio.',
    });
    return;
  }

  const {
    action,
    question,
    artifactsContext,
    targetArtifactId,
  }: {
    action?: GeminiAssistAction;
    question?: string;
    artifactsContext?: SanitizedArtifactContext[];
    targetArtifactId?: string;
  } = req.body ?? {};

  if (!Array.isArray(artifactsContext)) {
    res.status(400).json({
      error: 'INVALID_PAYLOAD',
      message: 'Dữ liệu ngữ cảnh hồ sơ không hợp lệ.',
    });
    return;
  }

  const systemInstruction = [
    'Bạn là Trợ lý Ký ức & Số hóa Di sản cho dự án phi lợi nhuận "Hồ sơ Kỷ vật Gia đình (Mã đề tài C03)".',
    'QUY TẮC BẮT BUỘC:',
    '1. Chỉ trả lời dựa trên dữ liệu hồ sơ đã nạp trong ngữ cảnh dưới đây. TUYỆT ĐỐI KHÔNG bịa đặt thông tin, không tự tạo chứng cứ, không tự đánh dấu thông tin là đã kiểm chứng.',
    '2. Nếu không có dữ liệu hoặc câu hỏi vượt quá dữ liệu đã nạp, phải trả lời chính xác câu: "Chưa có tư liệu xác minh để trả lời câu hỏi".',
    '3. Khi nhắc đến hoặc trả lời về bất kỳ hiện vật nào, BẮT BUỘC phải ghi rõ 4 thông tin sau:',
    '   - Mã hiện vật (identifier)',
    '   - Nơi lưu giữ (currentStorageLocation)',
    '   - Loại bản hiển thị (displayedCopyType)',
    '   - Nguồn (sourcesSummary)',
    '4. Giữ giọng văn trang trọng, chuẩn mực bảo tàng số Việt Nam, tiếng Việt có dấu.',
    '5. Không bao giờ hiển thị số điện thoại, địa chỉ nhà riêng chi tiết hay nội dung bị hạn chế.',
  ].join('\n');

  const actionPrompts: Record<GeminiAssistAction, string> = {
    qa: `Hãy trả lời câu hỏi sau chỉ dựa trên dữ liệu hồ sơ đã nạp:\n"${question ?? ''}"`,
    summarize_story: `Hãy tóm tắt thông tin và câu chuyện gắn với hiện vật ${targetArtifactId ?? ''} dựa trên hồ sơ đã nạp.`,
    curatorial_narration: `Hãy đề xuất một đoạn nội dung thuyết minh bảo tàng số cho hiện vật ${targetArtifactId ?? ''}, bám sát hoàn toàn dữ liệu đã nạp và không suy đoán ngoài tài liệu.`,
    standardize_description: `Hãy hỗ trợ chuẩn hóa phần mô tả chuyên môn (chất liệu, kích thước, tình trạng, niên đại và căn cứ) cho hiện vật ${targetArtifactId ?? ''} theo chuẩn Dublin Core từ dữ liệu đã nạp.`,
    missing_info: `Hãy kiểm tra hiện vật ${targetArtifactId ? targetArtifactId : 'hoặc toàn bộ danh sách hồ sơ'} và liệt kê cụ thể các trường thông tin còn thiếu hoặc chưa xác định để tiếp tục tra cứu.`,
    interview_questions: `Dựa trên các điểm chưa rõ của hiện vật ${targetArtifactId ?? ''}, hãy đề xuất 5 câu hỏi phỏng vấn người thân hoặc câu hỏi xác minh gửi đơn vị lưu giữ.`,
  };

  const selectedAction: GeminiAssistAction =
    action && action in actionPrompts ? action : 'qa';
  const taskInstruction = actionPrompts[selectedAction];

  const userPrompt = [
    'DỮ LIỆU HỒ SƠ ĐÃ NẠP (JSON):',
    JSON.stringify(artifactsContext, null, 2),
    '',
    'YÊU CẦU:',
    taskInstruction,
    question && selectedAction !== 'qa' ? `\nGhi chú thêm của người dùng: ${question}` : '',
  ].join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: userPrompt,
      config: {
        systemInstruction,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      res.status(502).json({
        error: 'EMPTY_RESPONSE',
        message: 'Gemini không trả về nội dung văn bản. Vui lòng thử lại.',
      });
      return;
    }

    res.json({
      text,
      model: 'gemini-4-hydrogen',
      label: 'NỘI DUNG AI ĐỀ XUẤT – CHƯA KIỂM CHỨNG',
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Lỗi không xác định từ Gemini API.';
    const status = message.includes('429')
      ? 429
      : message.includes('403') || message.includes('API_KEY')
        ? 403
        : 500;
    res.status(status).json({
      error: 'GEMINI_API_ERROR',
      message: `Không thể kết nối Gemini API (${message}). Vui lòng kiểm tra cấu hình khóa hoặc thử lại sau.`,
    });
  }
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
