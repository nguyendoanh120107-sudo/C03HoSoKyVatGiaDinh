import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const DEFAULT_GEMINI_MODEL = 'gemini-4-hydrogen';

export type GeminiDiagnosticStatus =
  | 'connected'
  | 'ready'
  | 'not_configured'
  | 'invalid_key'
  | 'permission_denied'
  | 'model_not_found'
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
  availableModels?: string[];
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
  answer?: string;
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

function getConfiguredModel(): { model: string; isExplicit: boolean } {
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (envModel) {
    return { model: envModel.replace(/^models\//, ''), isExplicit: true };
  }
  return { model: DEFAULT_GEMINI_MODEL, isExplicit: false };
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

function supportsThinkingLevel(modelName: string): boolean {
  const normalized = modelName.toLowerCase();
  return normalized.startsWith('gemini-3') || normalized.startsWith('gemini-4');
}

function buildGenerateConfig(
  modelName: string,
  systemInstruction?: string
): Record<string, unknown> | undefined {
  const config: Record<string, unknown> = {};
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }
  if (supportsThinkingLevel(modelName)) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
  }
  return Object.keys(config).length > 0 ? config : undefined;
}

function extractRawErrorInfo(err: unknown): {
  code?: number;
  statusText: string;
  msg: string;
} {
  const anyErr = err as {
    status?: number;
    code?: number | string;
    message?: string;
    cause?: { code?: string; message?: string };
  };
  const rawMsg = String(anyErr?.message ?? err ?? '');
  let parsedCode = typeof anyErr?.status === 'number' ? anyErr.status : undefined;
  let statusText = String(anyErr?.code ?? '');

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

export function classifyGeminiError(
  err: unknown,
  modelName: string
): {
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
    (upper.includes('INVALID_ARGUMENT') && upper.includes('API KEY')) ||
    code === 401
  ) {
    return {
      status: 'invalid_key',
      httpStatus: 401,
      errorCode: 'API_KEY_INVALID',
      message:
        'Khóa GEMINI_API_KEY trên máy chủ không hợp lệ hoặc đã bị thu hồi. Vui lòng kiểm tra lại giá trị biến môi trường GEMINI_API_KEY.',
      retryable: false,
    };
  }

  if (
    code === 404 ||
    upper.includes('NOT_FOUND') ||
    (upper.includes('MODEL') && upper.includes('NOT FOUND'))
  ) {
    return {
      status: 'model_not_found',
      httpStatus: 404,
      errorCode: 'MODEL_NOT_FOUND',
      message: `Model Gemini "${modelName}" không tồn tại hoặc chưa được hỗ trợ cho khóa API hiện tại. Vui lòng kiểm tra cấu hình GEMINI_MODEL phía máy chủ.`,
      retryable: false,
    };
  }

  if (
    code === 403 ||
    upper.includes('PERMISSION_DENIED') ||
    upper.includes('DOES NOT HAVE ACCESS')
  ) {
    return {
      status: 'permission_denied',
      httpStatus: 403,
      errorCode: 'PERMISSION_DENIED',
      message: `Khóa API hiện tại không có quyền gọi model "${modelName}" hoặc Generative Language API chưa được bật.`,
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
      errorCode: 'QUOTA_EXHAUSTED',
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

  if (
    code === 503 ||
    upper.includes('UNAVAILABLE') ||
    upper.includes('HIGH DEMAND')
  ) {
    return {
      status: 'server_error',
      httpStatus: 503,
      errorCode: 'GEMINI_UPSTREAM_UNAVAILABLE',
      message:
        'Máy chủ Google Gemini đang quá tải tạm thời (503). Vui lòng chờ vài giây rồi nhấn Thử lại.',
      retryable: true,
    };
  }

  if (code === 400) {
    return {
      status: 'server_error',
      httpStatus: 400,
      errorCode: 'BAD_REQUEST',
      message:
        'Yêu cầu gửi lên Gemini API không hợp lệ (HTTP 400). Vui lòng kiểm tra cấu hình model và nội dung đầu vào.',
      retryable: false,
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
  modelName: string,
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
      const classified = classifyGeminiError(err, modelName);
      if (!classified.retryable || attempt >= options.maxRetries) {
        throw err;
      }
      const delayMs = 600 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

const DEPRECATED_PATTERNS = [
  'gemini-1.0',
  'gemini-1.5',
  'gemini-2.0',
  'gemini-pro',
  'embedding',
  'imagen',
  'veo',
  'lyria',
  'tts',
  'transcribe',
  'live',
  'image',
  'robotics',
  'aqa',
];

async function discoverAvailableTextModels(ai: GoogleGenAI): Promise<string[]> {
  try {
    const pager = await Promise.race([
      ai.models.list({ config: { pageSize: 50 } }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('ETIMEDOUT: list models timeout')), 4000)
      ),
    ]);
    const candidates: string[] = [];
    const firstPage = Array.isArray((pager as { page?: unknown[] }).page)
      ? (pager as { page: Array<{ name?: string; supportedActions?: string[] }> }).page
      : [];
    for (const m of firstPage) {
      const rawName = (m.name ?? '').replace(/^models\//, '');
      if (!rawName.toLowerCase().startsWith('gemini-')) continue;
      const actions = m.supportedActions ?? [];
      if (actions.length > 0 && !actions.includes('generateContent')) continue;
      const lower = rawName.toLowerCase();
      if (DEPRECATED_PATTERNS.some((p) => lower.includes(p))) continue;
      candidates.push(rawName);
    }

    const priority = [
      'gemini-4-hydrogen',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro',
    ];
    candidates.sort((a, b) => {
      const ia = priority.indexOf(a);
      const ib = priority.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    return candidates;
  } catch {
    return [];
  }
}

async function generateWithModelResolution(params: {
  ai: GoogleGenAI;
  requestedModel: string;
  isExplicitModel: boolean;
  contents: string;
  systemInstruction?: string;
  timeoutMs: number;
  maxRetries: number;
}): Promise<{ text: string; usedModel: string; availableModels?: string[] }> {
  const {
    ai,
    requestedModel,
    isExplicitModel,
    contents,
    systemInstruction,
    timeoutMs,
    maxRetries,
  } = params;

  try {
    const response = await withTimeoutAndRetry(
      () =>
        ai.models.generateContent({
          model: requestedModel,
          contents,
          config: buildGenerateConfig(requestedModel, systemInstruction),
        }),
      requestedModel,
      { timeoutMs, maxRetries }
    );
    return { text: response.text?.trim() ?? '', usedModel: requestedModel };
  } catch (err) {
    const classified = classifyGeminiError(err, requestedModel);
    const shouldFallback =
      !isExplicitModel &&
      (classified.status === 'model_not_found' ||
        (classified.status === 'server_error' && classified.httpStatus === 503));

    if (!shouldFallback) {
      throw err;
    }

    // Primary default model was unavailable/404 for this key — inspect live models via ai.models.list()
    const available = await discoverAvailableTextModels(ai);
    const fallback =
      available.find((m) => m !== requestedModel) ??
      (requestedModel !== 'gemini-3.1-flash-lite'
        ? 'gemini-3.1-flash-lite'
        : undefined);
    if (!fallback) {
      throw err;
    }

    const retryResp = await withTimeoutAndRetry(
      () =>
        ai.models.generateContent({
          model: fallback,
          contents,
          config: buildGenerateConfig(fallback, systemInstruction),
        }),
      fallback,
      { timeoutMs: 10000, maxRetries: 0 }
    );

    return {
      text: retryResp.text?.trim() ?? '',
      usedModel: fallback,
      availableModels: available,
    };
  }
}

export async function checkGeminiServerHealth(
  liveProbe = false
): Promise<GeminiHealthResult> {
  const apiKey = readServerApiKey();
  const { model: configuredModel, isExplicit } = getConfiguredModel();

  if (!apiKey) {
    return {
      ok: false,
      configured: false,
      verifiedLive: false,
      status: 'not_configured',
      httpStatus: 503,
      model: configuredModel,
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
      model: configuredModel,
      message: `Khóa GEMINI_API_KEY đã được cấu hình trên máy chủ (model cấu hình: ${configuredModel}).`,
    };
  }

  try {
    const ai = createGeminiClient(apiKey);
    const probe = await generateWithModelResolution({
      ai,
      requestedModel: configuredModel,
      isExplicitModel: isExplicit,
      contents: 'Trả lời đúng 2 ký tự: OK',
      timeoutMs: 10000,
      maxRetries: 1,
    });

    if (!probe.text) {
      return {
        ok: false,
        configured: true,
        verifiedLive: true,
        status: 'server_error',
        httpStatus: 502,
        model: probe.usedModel,
        availableModels: probe.availableModels,
        message: 'Máy chủ Gemini kết nối được nhưng trả về phản hồi rỗng.',
      };
    }

    return {
      ok: true,
      configured: true,
      verifiedLive: true,
      status: 'connected',
      httpStatus: 200,
      model: probe.usedModel,
      availableModels: probe.availableModels,
      message: `Kết nối thành công tới Google Gemini (${probe.usedModel}).`,
    };
  } catch (err) {
    const classified = classifyGeminiError(err, configuredModel);
    return {
      ok: false,
      configured: classified.status !== 'invalid_key',
      verifiedLive: true,
      status: classified.status,
      httpStatus: classified.httpStatus,
      model: configuredModel,
      message: classified.message,
    };
  }
}

function sanitizeIncomingArtifacts(
  rawList: unknown[]
): SanitizedArtifactContext[] {
  return rawList.slice(0, 15).map((raw) => {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Record<
      string,
      unknown
    >;
    const str = (k: string, fallback = 'Chưa cập nhật') => {
      const val = item[k];
      return typeof val === 'string' && val.trim() ? val.trim() : fallback;
    };

    return {
      identifier: str('identifier'),
      title: str('title'),
      creator: str('creator', 'Chưa xác định theo tài liệu đã tra cứu'),
      subject: str('subject'),
      description: str('description'),
      date: str('date'),
      type: str('type'),
      material: str('material', 'Chưa xác định theo tài liệu đã tra cứu'),
      dimensions: str('dimensions', 'Chưa xác định theo tài liệu đã tra cứu'),
      artifactCategory: str('artifactCategory'),
      originalCondition: str('originalCondition'),
      displayedCopyType: str('displayedCopyType'),
      currentStorageLocation: str('currentStorageLocation'),
      historicalStorageLocation: str('historicalStorageLocation'),
      familyStory: str('familyStory'),
      storyTeller: str('storyTeller'),
      storyRecordedDate: str('storyRecordedDate'),
      storyVerificationStatus: str('storyVerificationStatus'),
      acquisitionHistory: str('acquisitionHistory'),
      permissionStatus: str('permissionStatus'),
      permissionScope: str('permissionScope'),
      verificationStatus: str('verificationStatus'),
      unresolvedQuestions: str('unresolvedQuestions', 'Không có'),
      sourcesSummary: str('sourcesSummary', 'Chưa cập nhật nguồn đối chiếu'),
    };
  });
}

export async function executeGeminiAssist(body: {
  action?: GeminiAssistAction;
  question?: string;
  prompt?: string;
  artifactsContext?: unknown[];
  targetArtifactId?: string;
}): Promise<GeminiAssistResult> {
  const { model: configuredModel, isExplicit } = getConfiguredModel();
  const apiKey = readServerApiKey();

  if (!apiKey) {
    return {
      ok: false,
      httpStatus: 503,
      status: 'not_configured',
      model: configuredModel,
      error: 'GEMINI_NOT_CONFIGURED',
      message:
        'GEMINI_API_KEY chưa được cấu hình trên máy chủ. Trên Vercel, hãy vào Project Settings > Environment Variables, thêm GEMINI_API_KEY cho Production và Redeploy.',
    };
  }

  if (!body || typeof body !== 'object') {
    return {
      ok: false,
      httpStatus: 400,
      status: 'server_error',
      model: configuredModel,
      error: 'INVALID_BODY',
      message: 'Phần thân yêu cầu (request body) không phải JSON hợp lệ.',
    };
  }

  const { action, artifactsContext, targetArtifactId } = body;
  const userQuestion = (body.question ?? body.prompt ?? '').trim();

  if (!Array.isArray(artifactsContext)) {
    return {
      ok: false,
      httpStatus: 400,
      status: 'server_error',
      model: configuredModel,
      error: 'INVALID_PAYLOAD',
      message: 'Thiếu danh sách hồ sơ công khai (artifactsContext) hợp lệ.',
    };
  }

  const scopedArtifacts = sanitizeIncomingArtifacts(artifactsContext);
  if (scopedArtifacts.length === 0) {
    return {
      ok: false,
      httpStatus: 400,
      status: 'server_error',
      model: configuredModel,
      error: 'EMPTY_CONTEXT',
      message:
        'Không có hồ sơ hiện vật nào được phép sử dụng để gửi tới Trợ lý Gemini.',
    };
  }

  const selectedAction: GeminiAssistAction =
    action &&
    [
      'qa',
      'summarize_story',
      'curatorial_narration',
      'standardize_description',
      'missing_info',
      'interview_questions',
    ].includes(action)
      ? action
      : 'qa';

  if (selectedAction === 'qa' && !userQuestion) {
    return {
      ok: false,
      httpStatus: 400,
      status: 'server_error',
      model: configuredModel,
      error: 'EMPTY_QUESTION',
      message: 'Vui lòng nhập câu hỏi trước khi gửi tới Trợ lý Gemini.',
    };
  }

  const systemInstruction = [
    'Bạn là Trợ lý Ký ức & Số hóa Di sản cho dự án phi lợi nhuận "Hồ sơ Kỷ vật Gia đình (Mã đề tài C03)".',
    'QUY TẮC BẮT BUỘC:',
    '1. Chỉ trả lời dựa trên danh sách hồ sơ hiện vật được cung cấp dưới đây. TUYỆT ĐỐI KHÔNG bịa đặt thông tin, nguồn dẫn chứng, quyền công bố hay niên đại.',
    '2. Nếu dữ liệu được cung cấp không hỗ trợ trả lời câu hỏi, BẮT BUỘC trả lời chính xác câu: "Chưa có tư liệu được xác minh để trả lời câu hỏi này."',
    '3. Với MỖI hiện vật được nhắc đến trong câu trả lời, BẮT BUỘC trình bày rõ cả 5 thông tin sau:',
    '   - Mã hồ sơ (identifier)',
    '   - Tên hiện vật (title)',
    '   - Nơi lưu giữ (currentStorageLocation)',
    '   - Loại bản hiển thị (displayedCopyType)',
    '   - Nguồn dẫn chứng (sourcesSummary)',
    '4. Sử dụng tiếng Việt có dấu chuẩn xác, giọng văn trang trọng, khách quan chuẩn bảo tàng số.',
    '5. Tuyệt đối không tiết lộ thông tin cá nhân nhạy cảm hoặc nội dung hạn chế công bố.',
  ].join('\n');

  const actionPrompts: Record<GeminiAssistAction, string> = {
    qa: `Hãy trả lời câu hỏi sau chỉ dựa trên các hồ sơ hiện vật đã nạp:\n"${userQuestion}"`,
    summarize_story: `Hãy tóm tắt ngắn gọn câu chuyện và ý nghĩa gắn với hiện vật ${targetArtifactId ?? ''} dựa trên hồ sơ đã nạp.`,
    curatorial_narration: `Hãy đề xuất một đoạn thuyết minh bảo tàng số cho hiện vật ${targetArtifactId ?? ''}, bám sát hoàn toàn dữ liệu đã nạp và không suy đoán ngoài tư liệu.`,
    standardize_description: `Hãy chuẩn hóa mô tả chuyên môn (chất liệu, kích thước, tình trạng bản gốc, niên đại và căn cứ) cho hiện vật ${targetArtifactId ?? ''} theo chuẩn Dublin Core từ dữ liệu đã nạp.`,
    missing_info: `Hãy kiểm tra hiện vật ${targetArtifactId ? targetArtifactId : 'hoặc toàn bộ 15 hồ sơ'} và liệt kê cụ thể các trường thông tin còn thiếu hoặc chưa xác định theo tài liệu.`,
    interview_questions: `Dựa trên các thông tin còn bỏ ngỏ của hiện vật ${targetArtifactId ?? ''}, hãy đề xuất 5 câu hỏi phỏng vấn lễ phép để hỏi người thân hoặc xác minh thêm với đơn vị lưu giữ.`,
  };

  const userPrompt = [
    `DANH SÁCH ${scopedArtifacts.length} HỒ SƠ HIỆN VẬT ĐƯỢC PHÉP SỬ DỤNG (JSON):`,
    JSON.stringify(scopedArtifacts, null, 2),
    '',
    'YÊU CẦU:',
    actionPrompts[selectedAction],
    userQuestion && selectedAction !== 'qa'
      ? `\nGhi chú thêm của người dùng: ${userQuestion}`
      : '',
  ].join('\n');

  try {
    const ai = createGeminiClient(apiKey);
    const result = await generateWithModelResolution({
      ai,
      requestedModel: configuredModel,
      isExplicitModel: isExplicit,
      contents: userPrompt,
      systemInstruction,
      timeoutMs: 14000,
      maxRetries: 1,
    });

    if (!result.text) {
      return {
        ok: false,
        httpStatus: 502,
        status: 'server_error',
        model: result.usedModel,
        error: 'EMPTY_RESPONSE',
        message: 'Máy chủ Gemini không trả về nội dung văn bản. Vui lòng thử lại.',
      };
    }

    return {
      ok: true,
      httpStatus: 200,
      status: 'connected',
      answer: result.text,
      text: result.text,
      model: result.usedModel,
      label: 'NỘI DUNG AI ĐỀ XUẤT – CHƯA KIỂM CHỨNG',
    };
  } catch (err) {
    const classified = classifyGeminiError(err, configuredModel);
    console.error(
      `[Gemini Assist Error] status=${classified.status} code=${classified.errorCode}`
    );
    return {
      ok: false,
      httpStatus: classified.httpStatus,
      status: classified.status,
      model: configuredModel,
      error: classified.errorCode,
      message: classified.message,
    };
  }
}

async function readParsedBody(req: any): Promise<any | null> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return req.body;
    }
    if (typeof req.body === 'string') {
      try {
        return req.body.trim() ? JSON.parse(req.body) : {};
      } catch {
        return null;
      }
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    let settled = false;
    const finish = (val: any) => {
      if (!settled) {
        settled = true;
        resolve(val);
      }
    };
    if (typeof req.on !== 'function') {
      finish({});
      return;
    }
    req.on('data', (chunk: Buffer | string) => {
      raw += chunk.toString();
    });
    req.on('end', () => {
      try {
        finish(raw.trim() ? JSON.parse(raw) : {});
      } catch {
        finish(null);
      }
    });
    req.on('error', () => finish(null));
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const verify =
        req.query?.verify === '1' || req.query?.verify === 'true';
      const health = await checkGeminiServerHealth(verify);
      res.status(health.httpStatus).json(health);
      return;
    }

    if (req.method === 'POST') {
      const parsedBody = await readParsedBody(req);
      if (parsedBody === null) {
        res.status(400).json({
          ok: false,
          httpStatus: 400,
          status: 'server_error',
          model: getConfiguredModel().model,
          error: 'INVALID_JSON',
          message: 'Dữ liệu gửi lên không phải JSON hợp lệ.',
        });
        return;
      }

      const result = await executeGeminiAssist(parsedBody);
      res.status(result.httpStatus).json(result);
      return;
    }

    res.status(405).json({
      ok: false,
      httpStatus: 405,
      status: 'server_error',
      error: 'METHOD_NOT_ALLOWED',
      message: 'Endpoint /api/gemini/assist chỉ hỗ trợ phương thức GET và POST.',
    });
  } catch (err) {
    console.error('[Gemini Serverless Handler Fatal]', err instanceof Error ? err.message : 'unknown');
    res.status(500).json({
      ok: false,
      httpStatus: 500,
      status: 'server_error',
      model: getConfiguredModel().model,
      error: 'INTERNAL_SERVER_ERROR',
      message:
        'Lỗi nội bộ tại máy chủ API /api/gemini/assist. Vui lòng thử lại sau.',
    });
  }
}
