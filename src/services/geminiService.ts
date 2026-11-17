import { FamilyArtifact } from '../types/artifact';
import { sanitizeArtifactsForGemini } from '../utils/completeness';

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
  message: string;
}

export interface GeminiAssistResponse {
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

export async function checkGeminiHealth(liveVerify = false): Promise<GeminiHealthStatus> {
  const endpoint = liveVerify ? '/api/gemini/health?verify=1' : '/api/gemini/health';
  try {
    const res = await fetch(endpoint, { method: 'GET' });
    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        configured: false,
        verifiedLive: liveVerify,
        status: 'endpoint_unreachable',
        httpStatus: res.status,
        model: 'gemini-4-hydrogen',
        message:
          'API backend /api/gemini/health chưa sẵn sàng trên máy chủ hiện tại (nhận phản hồi không phải JSON). Nếu đang chạy trên Vercel, hãy kiểm tra thư mục api/ và cấu hình vercel.json.',
      };
    }

    const data = (await res.json()) as Partial<GeminiHealthStatus>;
    return {
      ok: Boolean(data.ok ?? data.configured),
      configured: Boolean(data.configured),
      verifiedLive: Boolean(data.verifiedLive),
      status:
        data.status ??
        (data.configured ? 'ready' : 'not_configured'),
      httpStatus: data.httpStatus ?? res.status,
      model: data.model || 'gemini-4-hydrogen',
      message:
        data.message ||
        (data.configured
          ? 'Máy chủ Gemini đã cấu hình khóa API.'
          : 'Chưa cấu hình GEMINI_API_KEY trên máy chủ.'),
    };
  } catch {
    return {
      ok: false,
      configured: false,
      verifiedLive: liveVerify,
      status: 'network_error',
      httpStatus: 0,
      model: 'gemini-4-hydrogen',
      message:
        'Không thể kết nối tới API backend (/api/gemini/health). Vui lòng kiểm tra kết nối mạng hoặc thử lại.',
    };
  }
}

export async function requestGeminiAssist(params: {
  action: GeminiActionType;
  question?: string;
  artifacts: FamilyArtifact[];
  targetArtifactId?: string;
}): Promise<GeminiAssistResponse> {
  const sanitizedContext = sanitizeArtifactsForGemini(params.artifacts).slice(0, 15);

  let res: Response;
  try {
    res = await fetch('/api/gemini/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: params.action,
        question: params.question,
        artifactsContext: sanitizedContext,
        targetArtifactId: params.targetArtifactId,
      }),
    });
  } catch {
    throw new GeminiClientError(
      'Lỗi kết nối mạng khi gọi máy chủ backend (/api/gemini/assist). Vui lòng kiểm tra mạng và nhấn Thử lại.',
      { httpStatus: 0, status: 'network_error', errorCode: 'NETWORK_ERROR' }
    );
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new GeminiClientError(
      `API máy chủ /api/gemini/assist không trả về JSON hợp lệ (mã HTTP ${res.status}). Vui lòng kiểm tra triển khai backend trên Vercel hoặc Node.js.`,
      {
        httpStatus: res.status,
        status: 'endpoint_unreachable',
        errorCode: 'ENDPOINT_UNREACHABLE',
      }
    );
  }

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    text?: string;
    model?: string;
    label?: string;
    status?: GeminiClientStatus;
    error?: string;
    message?: string;
  };

  if (!res.ok || !data?.text) {
    throw new GeminiClientError(
      data?.message || `Lỗi kết nối Gemini API (mã HTTP ${res.status}). Vui lòng thử lại.`,
      {
        httpStatus: res.status,
        status: data?.status ?? 'server_error',
        errorCode: data?.error ?? 'GEMINI_API_ERROR',
      }
    );
  }

  return {
    text: data.text,
    model: data.model || 'gemini-4-hydrogen',
    label: data.label || 'NỘI DUNG AI ĐỀ XUẤT – CHƯA KIỂM CHỨNG',
  };
}
