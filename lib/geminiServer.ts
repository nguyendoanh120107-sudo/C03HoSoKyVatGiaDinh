import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export const GEMINI_MODEL = 'gemini-4-hydrogen';

export type GeminiDiagnosticStatus =
  | 'connected'
  | 'ready'
  | 'not_configured'
  | 'invalid_key'
  | 'permission_denied'
  | 'rate_limited'
  | 'network_error'
  | 'server_error';

export interface GeminiHealthResult {
  ok: boolean;
  configured: boolean;
  verifiedLive: boolean;
  status: GeminiDiagnosticStatus;
  httpStatus: number;
  model: string;
  message: string;
}

export interface SanitizedArtifactContext {
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

export type GeminiAssistAction =
  | 'qa'
  | 'summarize_story'
  | 'curatorial_narration'
  | 'standardize_description'
  | 'missing_info'
  | 'interview_questions';

export interface GeminiAssistResult {
  ok: boolean;
  httpStatus: number;
  status: GeminiDiagnosticStatus;
  text?: string;
  model: string;
  label?: string;
  error?: string;
  message?: string;
}

function readServerApiKey(): string | null {
  const raw = process.env.GEMINI_API_KEY?.trim();
  if (!raw || raw === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return raw;
}

function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractRawErrorInfo(err: unknown): { code?: number; statusText: string; msg: string } {
  const anyErr = err as {
    status?: number;
    code?: number | string;
    message?: string;
    cause?: { code?: string; message?: string };
  };
  const rawMsg = String(anyErr?.message ?? err ?? '');
  let parsedCode = typeof anyErr?.status === 'number' ? anyErr.status : undefined;
  let statusText = String(anyErr?.code ?? '');

  // @google/genai sometimes embeds JSON inside err.message
  const jsonStart = rawMsg.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(rawMsg.slice(jsonStart)) as {
        error?: { code?: number; status?: string; message?: string };
      };
      if (typeof parsed?.error?.code === 'number') {
        parsedCode = parsed.error.code;
      }
      if (parsed?.error?.status) {
        statusText = parsed.error.status;
      }
    } catch {
      // ignore JSON parse failure
    }
  }

  const causeCode = anyErr?.cause?.code ? String(anyErr.cause.code) : '';
  return {
    code: parsedCode,
    statusText: `${statusText} ${causeCode}`.trim(),
    msg: rawMsg,
  };
}

export function classifyGeminiError(err: unknown): {
  status: GeminiDiagnosticStatus;
  httpStatus: number;
  errorCode: string;
  message: string;
  retryable: boolean;
} {
  const { code, statusText, msg } = extractRawErrorInfo(err);
  const upper = `${statusText} ${msg}`.toUpperCase();

  if (
    upper.includes('API_KEY_INVALID') ||
    upper.includes('API KEY NOT VALID') ||
    upper.includes('INVALID_ARGUMENT') && upper.includes('API KEY') ||
    code === 401
  ) {
    return {
      status: 'invalid_key',
      httpStatus: 400,
      errorCode: 'API_KEY_INVALID',
      message:
        'Khóa GEMINI_API_KEY trên máy chủ không hợp lệ hoặc đã bị thu hồi. Vui lòng kiểm tra lại giá trị biến môi trường GEMINI_API_KEY.',
      retryable: false,
    };
  }

  if (
    code === 403 ||
    code === 404 ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('NOT_FOUND') ||
    upper.includes('DOES NOT HAVE ACCESS')
  ) {
    return {
      status: 'permission_denied',
      httpStatus: 403,
      errorCode: 'PERMISSION_DENIED',
      message: `Không có quyền gọi model ${GEMINI_MODEL} hoặc Generative Language API chưa được bật cho khóa hiện tại.`,
      retryable: false,
    };
  }

  if (
    code === 429 ||
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('QUOTA') ||
    upper.includes('RATE LIMIT')
  ) {
    return {
      status: 'rate_limited',
      httpStatus: 429,
      errorCode: 'QUOTA_EXCEEDED',
      message:
        'Hệ thống đã vượt giới hạn lượt gọi Gemini API tạm thời (429). Vui lòng chờ giây lát và nhấn Thử lại.',
      retryable: true,
    };
  }

  if (
    upper.includes('ETIMEDOUT') ||
    upper.includes('ECONNREFUSED') ||
    upper.includes('ENOTFOUND') ||
    upper.includes('ECONNRESET') ||
    upper.includes('FETCH FAILED') ||
    upper.includes('NETWORK') ||
    upper.includes('ABORT')
  ) {
    return {
      status: 'network_error',
      httpStatus: 504,
      errorCode: 'NETWORK_ERROR',
      message:
        'Lỗi kết nối mạng từ máy chủ đến Google Gemini API hoặc quá thời gian phản hồi. Vui lòng nhấn Thử lại.',
      retryable: true,
    };
  }

  if (code === 503 || upper.includes('UNAVAILABLE') || upper.includes('HIGH DEMAND')) {
    return {
      status: 'server_error',
      httpStatus: 503,
      errorCode: 'GEMINI_UPSTREAM_UNAVAILABLE',
      message:
        'Máy chủ Google Gemini đang quá tải tạm thời (503). Vui lòng chờ vài giây rồi nhấn Thử lại.',
      retryable: true,
    };
  }

  return {
    status: 'server_error',
    httpStatus: 502,
    errorCode: 'GEMINI_UPSTREAM_ERROR',
    message:
      'Máy chủ Gemini gặp sự cố phản hồi tạm thời. Vui lòng thử lại sau ít phút.',
    retryable: true,
  };
}

async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  options: { timeoutMs: number; maxRetries: number }
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= options.maxRetries; attempt += 1) {
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('ETIMEDOUT: Request to Gemini API timed out')),
            options.timeoutMs
          );
        }),
      ]);
      return result;
    } catch (err) {
      lastError = err;
      const classified = classifyGeminiError(err);
      if (!classified.retryable || attempt >= options.maxRetries) {
        throw err;
      }
      const delayMs = 700 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

export async function checkGeminiServerHealth(
  liveProbe = false
): Promise<GeminiHealthResult> {
  const apiKey = readServerApiKey();
  if (!apiKey) {
    return {
      ok: false,
      configured: false,
      verifiedLive: false,
      status: 'not_configured',
      httpStatus: 503,
      model: GEMINI_MODEL,
      message:
        'Chưa cấu hình biến môi trường GEMINI_API_KEY trên máy chủ (Node.js / Vercel Environment Variables).',
    };
  }

  if (!liveProbe) {
    return {
      ok: true,
      configured: true,
      verifiedLive: false,
      status: 'ready',
      httpStatus: 200,
      model: GEMINI_MODEL,
      message: `Khóa GEMINI_API_KEY đã được cấu hình trên máy chủ (model ${GEMINI_MODEL}).`,
    };
  }

  try {
    const ai = createGeminiClient(apiKey);
    const response = await withTimeoutAndRetry(
      () =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: 'Trả lời đúng 2 ký tự: OK',
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
      { timeoutMs: 12000, maxRetries: 1 }
    );

    if (!response.text?.trim()) {
      return {
        ok: false,
        configured: true,
        verifiedLive: true,
        status: 'server_error',
        httpStatus: 502,
        model: GEMINI_MODEL,
        message: 'Máy chủ Gemini kết nối được nhưng trả về phản hồi rỗng.',
      };
    }

    return {
      ok: true,
      configured: true,
      verifiedLive: true,
      status: 'connected',
      httpStatus: 200,
      model: GEMINI_MODEL,
      message: `Kết nối thành công tới Google Gemini (${GEMINI_MODEL}).`,
    };
  } catch (err) {
    const classified = classifyGeminiError(err);
    return {
      ok: false,
      configured: classified.status !== 'invalid_key',
      verifiedLive: true,
      status: classified.status,
      httpStatus: classified.httpStatus,
      model: GEMINI_MODEL,
      message: classified.message,
    };
  }
}

export async function executeGeminiAssist(body: {
  action?: GeminiAssistAction;
  question?: string;
  artifactsContext?: SanitizedArtifactContext[];
  targetArtifactId?: string;
}): Promise<GeminiAssistResult> {
  const apiKey = readServerApiKey();
  if (!apiKey) {
    return {
      ok: false,
      httpStatus: 503,
      status: 'not_configured',
      model: GEMINI_MODEL,
      error: 'GEMINI_NOT_CONFIGURED',
      message:
        'GEMINI_API_KEY chưa được cấu hình trên máy chủ. Nếu triển khai trên Vercel, vui lòng thêm GEMINI_API_KEY vào Project Settings > Environment Variables và Redeploy.',
    };
  }

  const { action, question, artifactsContext, targetArtifactId } = body ?? {};
  if (!Array.isArray(artifactsContext)) {
    return {
      ok: false,
      httpStatus: 400,
      status: 'server_error',
      model: GEMINI_MODEL,
      error: 'INVALID_PAYLOAD',
      message: 'Dữ liệu ngữ cảnh hồ sơ không hợp lệ.',
    };
  }

  // Strictly cap to the 15 allowed artifacts context
  const scopedArtifacts = artifactsContext.slice(0, 15);
  if (scopedArtifacts.length === 0) {
    return {
      ok: false,
      httpStatus: 400,
      status: 'server_error',
      model: GEMINI_MODEL,
      error: 'EMPTY_CONTEXT',
      message:
        'Không có hồ sơ hiện vật nào được phép sử dụng để gửi tới Trợ lý Gemini.',
    };
  }

  const systemInstruction = [
    'Bạn là Trợ lý Ký ức & Số hóa Di sản cho dự án phi lợi nhuận "Hồ sơ Kỷ vật Gia đình (Mã đề tài C03)".',
    'QUY TẮC BẮT BUỘC:',
    '1. Chỉ trả lời dựa trên danh sách hồ sơ hiện vật được cung cấp dưới đây. TUYỆT ĐỐI KHÔNG bịa đặt thông tin, nguồn dẫn chứng, quyền công bố hay niên đại.',
    '2. Nếu dữ liệu được cung cấp không hỗ trợ trả lời câu hỏi, BẮT BUỘC trả lời chính xác câu: "Chưa có tư liệu được xác minh để trả lời câu hỏi này".',
    '3. Với MỖI hiện vật được nhắc đến trong câu trả lời, BẮT BUỘC trình bày rõ cả 5 thông tin sau:',
    '   - Mã bản ghi (identifier)',
    '   - Tên hiện vật (title)',
    '   - Nơi lưu giữ (currentStorageLocation)',
    '   - Loại bản đang hiển thị (displayedCopyType)',
    '   - Nguồn dẫn chứng (sourcesSummary)',
    '4. Sử dụng tiếng Việt có dấu chuẩn xác, giọng văn trang trọng, khách quan chuẩn bảo tàng số.',
    '5. Tuyệt đối không tiết lộ thông tin cá nhân nhạy cảm hoặc nội dung hạn chế ngoài hồ sơ đã cung cấp.',
  ].join('\n');

  const actionPrompts: Record<GeminiAssistAction, string> = {
    qa: `Hãy trả lời câu hỏi sau chỉ dựa trên các hồ sơ hiện vật đã nạp:\n"${question ?? ''}"`,
    summarize_story: `Hãy tóm tắt ngắn gọn câu chuyện và ý nghĩa gắn với hiện vật ${targetArtifactId ?? ''} dựa trên hồ sơ đã nạp.`,
    curatorial_narration: `Hãy đề xuất một đoạn thuyết minh bảo tàng số cho hiện vật ${targetArtifactId ?? ''}, bám sát hoàn toàn dữ liệu đã nạp và không suy đoán ngoài tư liệu.`,
    standardize_description: `Hãy chuẩn hóa mô tả chuyên môn (chất liệu, kích thước, tình trạng bản gốc, niên đại và căn cứ) cho hiện vật ${targetArtifactId ?? ''} theo chuẩn Dublin Core từ dữ liệu đã nạp.`,
    missing_info: `Hãy kiểm tra hiện vật ${targetArtifactId ? targetArtifactId : 'hoặc toàn bộ 15 hồ sơ'} và liệt kê cụ thể các trường thông tin còn thiếu hoặc chưa xác định theo tài liệu.`,
    interview_questions: `Dựa trên các thông tin còn bỏ ngỏ của hiện vật ${targetArtifactId ?? ''}, hãy đề xuất 5 câu hỏi phỏng vấn lễ phép để hỏi người thân hoặc xác minh thêm với đơn vị lưu giữ.`,
  };

  const selectedAction: GeminiAssistAction =
    action && action in actionPrompts ? action : 'qa';
  const taskInstruction = actionPrompts[selectedAction];

  const userPrompt = [
    `DANH SÁCH ${scopedArtifacts.length} HỒ SƠ HIỆN VẬT ĐƯỢC PHÉP SỬ DỤNG (JSON):`,
    JSON.stringify(scopedArtifacts, null, 2),
    '',
    'YÊU CẦU:',
    taskInstruction,
    question && selectedAction !== 'qa' ? `\nGhi chú thêm của người dùng: ${question}` : '',
  ].join('\n');

  try {
    const ai = createGeminiClient(apiKey);
    const response = await withTimeoutAndRetry(
      () =>
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: userPrompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
      { timeoutMs: 22000, maxRetries: 2 }
    );

    const text = response.text?.trim();
    if (!text) {
      return {
        ok: false,
        httpStatus: 502,
        status: 'server_error',
        model: GEMINI_MODEL,
        error: 'EMPTY_RESPONSE',
        message: 'Máy chủ Gemini không trả về nội dung văn bản. Vui lòng thử lại.',
      };
    }

    return {
      ok: true,
      httpStatus: 200,
      status: 'connected',
      text,
      model: GEMINI_MODEL,
      label: 'NỘI DUNG AI ĐỀ XUẤT – CHƯA KIỂM CHỨNG',
    };
  } catch (err) {
    const classified = classifyGeminiError(err);
    console.error(`[Gemini Assist Error] status=${classified.status} code=${classified.errorCode}`);
    return {
      ok: false,
      httpStatus: classified.httpStatus,
      status: classified.status,
      model: GEMINI_MODEL,
      error: classified.errorCode,
      message: classified.message,
    };
  }
}
