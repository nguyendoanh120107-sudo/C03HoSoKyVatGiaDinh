import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useArchive } from '../context/ArchiveContext';
import { GeminiActionType, requestGeminiAssist } from '../services/geminiService';

const ACTION_OPTIONS: Array<{
  id: GeminiActionType;
  label: string;
  desc: string;
  needsTarget: boolean;
}> = [
  {
    id: 'qa',
    label: '1. Hỏi đáp bộ sưu tập',
    desc: 'Trả lời câu hỏi dựa trên các hồ sơ đã được phép truy cập.',
    needsTarget: false,
  },
  {
    id: 'summarize_story',
    label: '2. Tóm tắt câu chuyện',
    desc: 'Tóm tắt súc tích câu chuyện gắn với một kỷ vật cụ thể.',
    needsTarget: true,
  },
  {
    id: 'curatorial_narration',
    label: '3. Đề xuất thuyết minh',
    desc: 'Gợi ý đoạn thuyết minh bảo tàng số bám sát hồ sơ thật.',
    needsTarget: true,
  },
  {
    id: 'standardize_description',
    label: '4. Chuẩn hóa mô tả',
    desc: 'Chuẩn hóa mô tả chất liệu, kích thước, tình trạng theo Dublin Core.',
    needsTarget: true,
  },
  {
    id: 'missing_info',
    label: '5. Gợi ý thông tin thiếu',
    desc: 'Rà soát các trường thông tin còn thiếu hoặc chưa kiểm chứng.',
    needsTarget: false,
  },
  {
    id: 'interview_questions',
    label: '6. Câu hỏi phỏng vấn',
    desc: 'Đề xuất câu hỏi lễ phép để phỏng vấn ông bà, người thân.',
    needsTarget: true,
  },
];

const EXAMPLE_PROMPTS = [
  'Gia đình có những kỷ vật nào liên quan đến thời kỳ trước năm 1990?',
  'Hãy kể câu chuyện về chiếc đồng hồ đã được nhập trong hồ sơ.',
  'Những kỷ vật nào đang bị hư hại?',
  'Thông tin của kỷ vật C03-00001 còn thiếu gì?',
];

export const GeminiAssistantPage: React.FC = () => {
  const { activeViewArtifacts, geminiHealth, upsertArtifact } = useArchive();

  const permittedArtifacts = useMemo(
    () => activeViewArtifacts.filter((a) => a.permissionStatus === 'Đã được phép'),
    [activeViewArtifacts]
  );

  const [action, setAction] = useState<GeminiActionType>('qa');
  const [targetId, setTargetId] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [editedOutput, setEditedOutput] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const selectedActionMeta = ACTION_OPTIONS.find((a) => a.id === action)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveMessage(null);

    if (permittedArtifacts.length === 0) {
      setError(
        'Hiện chưa có hồ sơ nào ở trạng thái “Đã được phép”. Vì quy tắc bảo mật gia đình, hệ thống không gửi dữ liệu chưa được cấp quyền hoặc ảnh riêng tư cho Gemini.'
      );
      return;
    }

    if (selectedActionMeta.needsTarget && !targetId) {
      setError('Vui lòng chọn một kỷ vật cụ thể để thực hiện tác vụ này.');
      return;
    }

    if (action === 'qa' && !question.trim()) {
      setError('Vui lòng nhập câu hỏi của bạn.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestGeminiAssist({
        action,
        question: question.trim(),
        artifacts: permittedArtifacts,
        targetArtifactId: targetId || undefined,
      });
      setAiResponse(res.text);
      setEditedOutput(res.text);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể kết nối đến máy chủ Gemini AI.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResultToArtifact = async () => {
    const chosenId = targetId || permittedArtifacts[0]?.identifier;
    const target = permittedArtifacts.find((a) => a.identifier === chosenId);
    if (!target) {
      setError('Vui lòng chọn hồ sơ thật cần lưu ghi chú đề xuất.');
      return;
    }
    if (target.isDemo) {
      setError('Không thể lưu kết quả vào bản ghi DEMO minh họa.');
      return;
    }
    await upsertArtifact({
      ...target,
      aiDraftNotes: editedOutput.trim(),
      updatedAt: new Date().toISOString(),
    });
    setSaveMessage(
      `Đã lưu nội dung đã chỉnh sửa vào ghi chú quản lý của hồ sơ ${target.identifier} (chưa tự động công bố).`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8"
    >
      {/* Header */}
      <div className="border-b border-[#70452F]/15 pb-6 space-y-2">
        <p className="text-xs font-medium tracking-wider text-[#70452F] uppercase">
          Màn hình 5 · Tích hợp Google Gemini qua máy chủ bảo mật
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#231B15]">
          TRỢ LÝ KÝ ỨC GIA ĐÌNH
        </h1>
        <p className="text-sm text-[#65564A] max-w-3xl">
          Hỗ trợ tra cứu bộ sưu tập, tóm tắt câu chuyện, đề xuất thuyết minh và gợi ý thông tin còn thiếu dựa hoàn toàn trên các hồ sơ đã được phép công bố.
        </p>
      </div>

      {/* Server Config & Privacy Guardrail Notices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm ${
            geminiHealth?.configured
              ? 'bg-[#52624B]/10 border-[#52624B]/30 text-[#2E3B29]'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {geminiHealth?.configured ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">
                {geminiHealth?.configured
                  ? `Máy chủ Gemini đã sẵn sàng (${geminiHealth.model})`
                  : 'Tính năng Gemini chưa được cấu hình khóa API trên máy chủ'}
              </p>
              <p className="text-xs leading-relaxed">
                {geminiHealth?.configured
                  ? 'Khóa API được đọc an toàn ở phía máy chủ Express, không lộ ra trình duyệt.'
                  : 'Vui lòng thiết lập biến môi trường GEMINI_API_KEY trong phần Settings > Secrets của Google AI Studio. Giao diện không giả lập kết quả AI khi chưa có kết nối thật.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#70452F]/15 text-xs sm:text-sm text-[#65564A] space-y-1">
          <p className="font-semibold text-[#231B15] inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#70452F]" />
            <span>Ngữ cảnh được phép gửi Gemini: {permittedArtifacts.length} hồ sơ</span>
          </p>
          <p className="text-xs leading-relaxed">
            Không gửi ảnh, số điện thoại, nội dung hạn chế hoặc hồ sơ chưa cấp quyền. AI bị ràng buộc không bịa đặt niên đại/lịch sử ngoài tư liệu đã nhập.
          </p>
        </div>
      </div>

      {/* Action Selector */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#231B15]">
          Chọn chức năng hỗ trợ (6 tác vụ)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACTION_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAction(opt.id)}
              className={`p-4 rounded-xl border text-left transition-colors ${
                action === opt.id
                  ? 'bg-[#70452F] text-white border-[#70452F]'
                  : 'bg-white text-[#231B15] border-[#70452F]/15 hover:bg-[#F8F4EC]'
              }`}
            >
              <p className="text-sm font-semibold">{opt.label}</p>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  action === opt.id ? 'text-white/85' : 'text-[#65564A]'
                }`}
              >
                {opt.desc}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Query Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1.5">
              Chọn kỷ vật mục tiêu {selectedActionMeta.needsTarget ? '(Bắt buộc)' : '(Tùy chọn)'}
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm bg-white"
            >
              <option value="">-- Toàn bộ các hồ sơ được phép --</option>
              {permittedArtifacts.map((a) => (
                <option key={a.id} value={a.identifier}>
                  {a.identifier} — {a.title || '(Chưa đặt tên)'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end text-xs text-[#65564A]">
            <p>
              Mọi câu trả lời về kỷ vật đều bắt buộc dẫn rõ: Mã bản ghi, nơi lưu giữ được phép tiết lộ, loại bản đang hiển thị và nguồn sử dụng.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#231B15] mb-1.5">
            {action === 'qa' ? 'Câu hỏi dành cho bộ sưu tập' : 'Ghi chú bổ sung (tùy chọn)'}
          </label>
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Nhập câu hỏi hoặc yêu cầu cụ thể..."
            className="w-full p-3 rounded-lg border border-[#70452F]/25 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
          />
        </div>

        {/* Example Prompts */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#65564A]">Câu hỏi gợi ý mẫu:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setAction('qa');
                  setQuestion(prompt);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#F8F4EC] border border-[#70452F]/15 text-xs text-[#543220] hover:bg-[#EFE8DA] text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#70452F] text-white text-sm font-medium hover:bg-[#543220] disabled:opacity-60"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? 'Đang truy vấn Gemini...' : 'Gửi yêu cầu'}</span>
        </button>
      </form>

      {/* Output Area with mandatory verification warning & edit/save flow */}
      {aiResponse && (
        <section className="bg-white rounded-2xl border border-[#C59A54] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#70452F]/15">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#70452F]">
              <Bot className="w-4 h-4" />
              <span>NỘI DUNG AI ĐỀ XUẤT – CHƯA KIỂM CHỨNG</span>
            </span>
            <span className="text-xs text-[#65564A]">
              Người quản lý cần rà soát, chỉnh sửa trước khi lưu (không tự động công bố)
            </span>
          </div>

          <textarea
            rows={9}
            value={editedOutput}
            onChange={(e) => setEditedOutput(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-[#F8F4EC]/50 border border-[#70452F]/20 text-sm text-[#231B15] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSaveResultToArtifact}
              className="px-4 py-2 rounded-lg bg-[#52624B] text-white text-xs sm:text-sm font-medium hover:bg-[#3F4D39]"
            >
              Xác nhận & Lưu vào ghi chú hồ sơ đã chọn
            </button>
            {saveMessage && (
              <span className="text-xs font-medium text-[#52624B]">
                {saveMessage}
              </span>
            )}
          </div>
        </section>
      )}
    </motion.div>
  );
};
