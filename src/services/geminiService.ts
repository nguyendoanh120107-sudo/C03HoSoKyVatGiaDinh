import { FamilyArtifact } from '../types/artifact';
import { sanitizeArtifactsForGemini } from '../utils/completeness';

const GEMINI_API_ENDPOINT = '/api/gemini/assist';

export type GeminiActionType =
  | 'qa'
  | 'summarize_story'
  | 'curatorial_narration'
  | 'standardize_description'
  | 'missing_info'
  | 'interview_questions';

export type GeminiClientStatus =
  | 'connected'
  | 'ready'
  | 'not_configured'
  | 'invalid_key'
  | 'permission_denied'
  | 'model_not_found'
  | 'rate_limited'
  | 'network_error'
  | 'server_error'
  | 'endpoint_unreachable';

export interface GeminiHealthStatus {
  ok: boolean;
  configured: boolean;
  verifiedLive?: boolean;
  status: GeminiClientStatus;
  httpStatus?: number;
  model: string;
  availableModels?: string[];
  message: string;
}

export interface GeminiAssistResponse {
  answer: string;
  text: string;
  model: string;
  label: string;
}

export class GeminiClientError extends Error {
  httpStatus: number;
  status: GeminiClientStatus;
  errorCode: string;

  constructor(
    message: string,
    opts: { httpStatus: number; status: GeminiClientStatus; errorCode: string }
  ) {
    super(message);
    this.name = 'GeminiClientError';
    this.httpStatus = opts.httpStatus;
    this.status = opts.status;
    this.errorCode = opts.errorCode;
  }
}

interface ParsedResponseResult {
  isJson: boolean;
  data: Record<string, unknown> | null;
  rawText: string;
}

async function safeParseResponse(res: Response): Promise<ParsedResponseResult> {
  const rawText = await res.text();
  const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
  const trimmed = rawText.trim();

  if (
    !contentType.includes('application/json') &&
    !trimmed.startsWith('{') &&
    !trimmed.startsWith('[')
  ) {
    return { isJson: false, data: null, rawText };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        isJson: true,
        data: parsed as Record<string, unknown>,
        rawText,
      };
    }
    return { isJson: false, data: null, rawText };
  } catch {
    return { isJson: false, data: null, rawText };
  }
}

function mapHttpFailure(
  httpStatus: number,
  serverStatus?: GeminiClientStatus,
  serverMessage?: string
): { status: GeminiClientStatus; message: string } {
  if (httpStatus === 400) {
    return {
      status: serverStatus ?? 'server_error',
      message:
        serverMessage ||
        'Yêu cầu gửi lên máy chủ Gemini không hợp lệ (HTTP 400). Vui lòng kiểm tra nội dung câu hỏi và hồ sơ đã chọn.',
    };
  }
  if (httpStatus === 401 || httpStatus === 403) {
    return {
      status:
        serverStatus ??
        (httpStatus === 401 ? 'invalid_key' : 'permission_denied'),
      message:
        serverMessage ||
        `Lỗi xác thực hoặc không có quyền gọi Gemini API (HTTP ${httpStatus}). Vui lòng kiểm tra GEMINI_API_KEY trên máy chủ.`,
    };
  }
  if (httpStatus === 404) {
    return {
      status: serverStatus ?? 'model_not_found',
      message:
        serverMessage ||
        'Không tìm thấy API endpoint /api/gemini/assist hoặc model Gemini không khả dụng (HTTP 404).',
    };
  }
  if (httpStatus === 429) {
    return {
      status: 'rate_limited',
      message:
        serverMessage ||
        'Đã vượt giới hạn lượt gọi Gemini API (HTTP 429). Vui lòng chờ giây lát và nhấn Thử lại.',
    };
  }
  if (httpStatus >= 500) {
    return {
      status: serverStatus ?? 'server_error',
      message:
        serverMessage ||
        `Máy chủ backend hoặc Google Gemini đang gặp lỗi (HTTP ${httpStatus}). Vui lòng kiểm tra cấu hình hoặc nhấn Thử lại.`,
    };
  }

  return {
    status: serverStatus ?? 'server_error',
    message:
      serverMessage ||
      `Lỗi kết nối Gemini API (mã HTTP ${httpStatus}). Vui lòng thử lại.`,
  };
}

export async function checkGeminiHealth(
  liveVerify = false
): Promise<GeminiHealthStatus> {
  const endpoint = liveVerify
    ? `${GEMINI_API_ENDPOINT}?verify=1`
    : GEMINI_API_ENDPOINT;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  } catch {
    return {
      ok: false,
      configured: false,
      verifiedLive: liveVerify,
      status: 'network_error',
      httpStatus: 0,
      model: 'Chưa xác định',
      message:
        'Không thể kết nối tới API backend (/api/gemini/assist) do lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.',
    };
  }

  const parsed = await safeParseResponse(res);
  if (!parsed.isJson || !parsed.data) {
    return {
      ok: false,
      configured: false,
      verifiedLive: liveVerify,
      status: 'endpoint_unreachable',
      httpStatus: res.status,
      model: 'Chưa xác định',
      message: `API backend ${GEMINI_API_ENDPOINT} trả về phản hồi không phải JSON (mã HTTP ${res.status}). Hãy kiểm tra Vercel Function tại api/gemini/assist.ts và cấu hình vercel.json.`,
    };
  }

  const d = parsed.data as Partial<GeminiHealthStatus>;
  const model = typeof d.model === 'string' && d.model ? d.model : 'gemini-4-hydrogen';
  const configured = Boolean(d.configured);
  const ok = Boolean(d.ok ?? configured);

  if (!res.ok && res.status !== 503) {
    const mapped = mapHttpFailure(
      res.status,
      d.status,
      typeof d.message === 'string' ? d.message : undefined
    );
    return {
      ok: false,
      configured,
      verifiedLive: Boolean(d.verifiedLive ?? liveVerify),
      status: mapped.status,
      httpStatus: res.status,
      model,
      availableModels: Array.isArray(d.availableModels)
        ? d.availableModels
        : undefined,
      message: mapped.message,
    };
  }

  return {
    ok,
    configured,
    verifiedLive: Boolean(d.verifiedLive),
    status: d.status ?? (configured ? 'ready' : 'not_configured'),
    httpStatus: typeof d.httpStatus === 'number' ? d.httpStatus : res.status,
    model,
    availableModels: Array.isArray(d.availableModels)
      ? d.availableModels
      : undefined,
    message:
      (typeof d.message === 'string' && d.message) ||
      (configured
        ? 'Máy chủ Gemini đã cấu hình khóa API.'
        : 'Chưa cấu hình GEMINI_API_KEY trên máy chủ.'),
  };
}

export async function requestGeminiAssist(params: {
  action: GeminiActionType;
  question?: string;
  artifacts: FamilyArtifact[];
  targetArtifactId?: string;
}): Promise<GeminiAssistResponse> {
  const sanitizedContext = sanitizeArtifactsForGemini(params.artifacts).slice(
    0,
    15
  );

  let res: Response;
  try {
    res = await fetch(GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        action: params.action,
        question: params.question,
        artifactsContext: sanitizedContext,
        targetArtifactId: params.targetArtifactId,
      }),
    });
  } catch {
    throw new GeminiClientError(
      'Mất kết nối mạng khi gọi máy chủ backend (/api/gemini/assist). Vui lòng kiểm tra kết nối mạng và nhấn Thử lại.',
      { httpStatus: 0, status: 'network_error', errorCode: 'NETWORK_ERROR' }
    );
  }

  const parsed = await safeParseResponse(res);
  if (!parsed.isJson || !parsed.data) {
    throw new GeminiClientError(
      `API máy chủ ${GEMINI_API_ENDPOINT} không trả về JSON hợp lệ (mã HTTP ${res.status}). Vui lòng kiểm tra triển khai backend trên Vercel (api/gemini/assist.ts) hoặc Node.js.`,
      {
        httpStatus: res.status,
        status: res.status === 404 ? 'endpoint_unreachable' : 'server_error',
        errorCode:
          res.status === 404 ? 'ENDPOINT_NOT_FOUND' : 'NON_JSON_RESPONSE',
      }
    );
  }

  const data = parsed.data as {
    ok?: boolean;
    answer?: string;
    text?: string;
    model?: string;
    label?: string;
    status?: GeminiClientStatus;
    error?: string;
    message?: string;
  };

  const answerText = (data.answer ?? data.text ?? '').trim();

  if (!res.ok || !answerText) {
    const mapped = mapHttpFailure(res.status, data.status, data.message);
    throw new GeminiClientError(mapped.message, {
      httpStatus: res.status,
      status: mapped.status,
      errorCode: data.error ?? `HTTP_${res.status}`,
    });
  }

  return {
    answer: answerText,
    text: answerText,
    model: data.model || 'gemini-4-hydrogen',
    label: data.label || 'NỘI DUNG AI ĐỀ XUẤT – CHƯA KIỂM CHỨNG',
  };
}
