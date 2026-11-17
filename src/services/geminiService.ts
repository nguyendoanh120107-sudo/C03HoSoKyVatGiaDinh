import { FamilyArtifact } from '../types/artifact';
import { sanitizeArtifactsForGemini } from '../utils/completeness';

export type GeminiActionType =
  | 'qa'
  | 'summarize_story'
  | 'curatorial_narration'
  | 'standardize_description'
  | 'missing_info'
  | 'interview_questions';

export interface GeminiHealthStatus {
  configured: boolean;
  model: string;
}

export interface GeminiAssistResponse {
  text: string;
  model: string;
  label: string;
}

export async function checkGeminiHealth(): Promise<GeminiHealthStatus> {
  const res = await fetch('/api/gemini/health');
  if (!res.ok) {
    throw new Error('Không thể kiểm tra trạng thái máy chủ Gemini.');
  }
  return res.json();
}

export async function requestGeminiAssist(params: {
  action: GeminiActionType;
  question?: string;
  artifacts: FamilyArtifact[];
  targetArtifactId?: string;
}): Promise<GeminiAssistResponse> {
  const sanitizedContext = sanitizeArtifactsForGemini(params.artifacts);

  const res = await fetch('/api/gemini/assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: params.action,
      question: params.question,
      artifactsContext: sanitizedContext,
      targetArtifactId: params.targetArtifactId,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.message || `Lỗi kết nối Gemini API (mã ${res.status}). Vui lòng thử lại.`
    );
  }

  return data as GeminiAssistResponse;
}
