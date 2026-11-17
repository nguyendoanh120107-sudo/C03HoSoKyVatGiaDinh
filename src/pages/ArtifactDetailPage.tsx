import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Edit3,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ArtifactPlaceholder } from '../components/ArtifactPlaceholder';
import { useArchive } from '../context/ArchiveContext';
import { DUBLIN_CORE_FIELDS } from '../data/constants';
import { getOriginalImageBlob } from '../services/db';
import { requestGeminiAssist } from '../services/geminiService';
import {
  displayOrPlaceholder,
  evaluateArtifactCompleteness,
  getPublicPermittedImages,
} from '../utils/completeness';

export const ArtifactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { activeViewArtifacts, isPublicPreview, upsertArtifact } = useArchive();

  const artifact = useMemo(
    () => activeViewArtifacts.find((a) => a.id === id),
    [activeViewArtifacts, id]
  );

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  // On-demand Gemini state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [aiEditedText, setAiEditedText] = useState<string>('');
  const [aiSavedMsg, setAiSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveImgIdx(0);
    setZoom(1);
    setAiSuggestion('');
    setAiEditedText('');
    setAiError(null);
    setAiSavedMsg(null);
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [id]);

  if (!artifact) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-editorial text-2xl font-semibold text-[#231B15]">
          Không tìm thấy hồ sơ kỷ vật
        </h1>
        <p className="text-sm text-[#65564A]">
          Hồ sơ không tồn tại trong bộ nhớ trình duyệt hiện tại hoặc chế độ DEMO đang tắt.
        </p>
        <Link
          to="/kho-ky-vat"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#70452F] text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Kho kỷ vật
        </Link>
      </div>
    );
  }

  const isRestrictedFromPublic =
    isPublicPreview &&
    (artifact.permissionStatus !== 'Đã được phép' || Boolean(artifact.isDraft));

  if (isRestrictedFromPublic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-editorial text-2xl font-semibold text-[#231B15]">
          Hồ sơ chưa được phép công bố công khai
        </h1>
        <p className="text-sm text-[#65564A] max-w-lg mx-auto">
          Theo thiết lập quyền sử dụng hiện tại ({artifact.permissionStatus}), kỷ vật{' '}
          <span className="font-mono">{artifact.identifier}</span> và hình ảnh liên quan không hiển thị trong chế độ công khai.
        </p>
        <Link
          to="/kho-ky-vat"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#70452F] text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Kho kỷ vật
        </Link>
      </div>
    );
  }

  const visibleImages =
    artifact.permissionStatus === 'Đã được phép'
      ? getPublicPermittedImages(artifact)
      : isPublicPreview
        ? []
        : artifact.imageFiles;

  const currentImg = visibleImages[activeImgIdx];
  const completeness = evaluateArtifactCompleteness(artifact);

  const relatedArtifacts = activeViewArtifacts.filter(
    (other) =>
      other.id !== artifact.id &&
      (artifact.relatedArtifactIds.includes(other.identifier) ||
        other.relatedArtifactIds.includes(artifact.identifier))
  );

  const toggleSpeakStory = () => {
    setSpeechError(null);
    if (!('speechSynthesis' in window)) {
      setSpeechError('Trình duyệt hiện tại không hỗ trợ Web Speech API.');
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const storyText = artifact.familyStory?.trim();
    if (!storyText) {
      setSpeechError('Kỷ vật này chưa có câu chuyện được ghi nhận để đọc.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      `${artifact.title}. ${storyText}`
    );
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.toLowerCase().startsWith('vi'));
    if (viVoice) {
      utterance.voice = viVoice;
    }
    utterance.lang = 'vi-VN';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setSpeechError('Không thể phát giọng đọc tiếng Việt trên thiết bị này.');
    };
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleRequestGeminiDescription = async () => {
    if (artifact.permissionStatus !== 'Đã được phép') {
      setAiError(
        'Vì quy tắc bảo mật thông tin gia đình, chỉ gửi hồ sơ đã ở trạng thái “Đã được phép” cho Gemini.'
      );
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiSavedMsg(null);
    try {
      const result = await requestGeminiAssist({
        action: 'standardize_description',
        artifacts: [artifact],
        targetArtifactId: artifact.identifier,
      });
      setAiSuggestion(result.text);
      setAiEditedText(result.text);
    } catch (err: unknown) {
      setAiError(
        err instanceof Error ? err.message : 'Không thể gọi trợ lý Gemini.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAiNoteToDraft = async () => {
    if (!aiEditedText.trim() || artifact.isDemo) return;
    await upsertArtifact({
      ...artifact,
      aiDraftNotes: aiEditedText.trim(),
      updatedAt: new Date().toISOString(),
    });
    setAiSavedMsg('Đã lưu vào ghi chú đề xuất của người quản lý (chưa tự động công bố).');
  };

  const handleDownloadOriginalImage = async () => {
    if (!currentImg?.originalImageId) return;
    if (artifact.permissionStatus !== 'Đã được phép' || !currentImg.isPermittedForPublic) {
      return;
    }
    const rec = await getOriginalImageBlob(currentImg.originalImageId);
    if (!rec) return;
    const url = URL.createObjectURL(rec.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentImg.originalFileName || currentImg.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      setShareCopied(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8"
    >
      {/* Top Action Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/kho-ky-vat"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#70452F] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Kho kỷ vật</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleShareLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#70452F]/20 text-xs font-medium text-[#231B15] hover:bg-[#F8F4EC]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shareCopied ? 'Đã sao chép liên kết' : 'Chia sẻ liên kết'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#70452F]/20 text-xs font-medium text-[#231B15] hover:bg-[#F8F4EC]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In phiếu hiện vật</span>
          </button>

          {!isPublicPreview && !artifact.isDemo && (
            <Link
              to={`/quan-ly?edit=${encodeURIComponent(artifact.id)}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#70452F] text-white text-xs font-medium hover:bg-[#543220]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa hồ sơ</span>
            </Link>
          )}
        </div>
      </div>

      {/* Demo Warning if applicable */}
      {artifact.isDemo && (
        <div className="bg-[#C59A54]/20 border border-[#C59A54]/50 rounded-xl p-4 text-sm text-[#543220] font-medium">
          Dữ liệu minh họa, không dùng nghiệm thu — đây là bản ghi trình diễn trong chế độ DEMO.
        </div>
      )}

      {/* Main Accession Layout: Gallery + Key Identity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Multi-angle Interactive Image Viewer */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-[#70452F]/15 p-5 space-y-4 print-only-clean">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#231B15]">
              Thư viện ảnh tư liệu ({visibleImages.length} góc chụp được phép hiển thị)
            </h2>
            {currentImg && (
              <div className="no-print flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))}
                  aria-label="Thu nhỏ ảnh"
                  className="p-1.5 rounded border border-[#70452F]/20 hover:bg-[#F8F4EC]"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono tabular-nums px-1.5">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                  aria-label="Phóng to ảnh"
                  className="p-1.5 rounded border border-[#70452F]/20 hover:bg-[#F8F4EC]"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  aria-label="Đặt lại kích thước ảnh"
                  className="p-1.5 rounded border border-[#70452F]/20 hover:bg-[#F8F4EC]"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {currentImg ? (
            <>
              <div className="aspect-[4/3] bg-[#EFE8DA]/50 rounded-xl overflow-auto flex items-center justify-center relative border border-[#70452F]/10">
                <img
                  src={currentImg.displayDataUrl}
                  alt={currentImg.caption || artifact.title}
                  referrerPolicy="no-referrer"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                  className="max-h-full max-w-full object-contain transition-transform duration-200"
                />

                {visibleImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1);
                        setActiveImgIdx(
                          (idx) => (idx - 1 + visibleImages.length) % visibleImages.length
                        );
                      }}
                      aria-label="Ảnh trước"
                      className="no-print absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-[#70452F]/20 flex items-center justify-center shadow-sm hover:bg-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1);
                        setActiveImgIdx((idx) => (idx + 1) % visibleImages.length);
                      }}
                      aria-label="Ảnh tiếp theo"
                      className="no-print absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-[#70452F]/20 flex items-center justify-center shadow-sm hover:bg-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Mandatory Caption & Provenance directly under photo */}
              <div className="bg-[#F8F4EC]/70 rounded-xl p-4 space-y-2 text-xs">
                <p className="text-sm font-medium text-[#231B15]">
                  {displayOrPlaceholder(currentImg.caption)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#65564A]">
                  <div>
                    <span className="font-medium text-[#231B15]">Góc chụp & Tên tệp:</span>{' '}
                    {currentImg.angle} (<span className="font-mono">{currentImg.fileName}</span>)
                  </div>
                  <div>
                    <span className="font-medium text-[#231B15]">Người chụp / Nguồn:</span>{' '}
                    {displayOrPlaceholder(currentImg.photographerOrSource)}
                  </div>
                  <div>
                    <span className="font-medium text-[#231B15]">Ngày chụp:</span>{' '}
                    {displayOrPlaceholder(currentImg.captureDate)}
                  </div>
                  <div>
                    <span className="font-medium text-[#231B15]">Quyền sử dụng:</span>{' '}
                    {displayOrPlaceholder(currentImg.usagePermission)}
                  </div>
                </div>
                {!isPublicPreview &&
                  artifact.permissionStatus === 'Đã được phép' &&
                  currentImg.isPermittedForPublic && (
                    <div className="no-print pt-1">
                      <button
                        type="button"
                        onClick={handleDownloadOriginalImage}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#70452F] hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải tệp ảnh gốc lưu giữ riêng</span>
                      </button>
                    </div>
                  )}
              </div>

              {/* Angle Thumbnail Strip */}
              {visibleImages.length > 1 && (
                <div className="no-print flex gap-2.5 overflow-x-auto pb-1">
                  {visibleImages.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => {
                        setZoom(1);
                        setActiveImgIdx(i);
                      }}
                      className={`shrink-0 w-24 rounded-lg overflow-hidden border text-left transition-colors ${
                        i === activeImgIdx
                          ? 'border-[#70452F] ring-2 ring-[#C59A54]'
                          : 'border-[#70452F]/15 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.displayDataUrl}
                        alt={img.angle}
                        className="w-full h-14 object-cover"
                      />
                      <p className="px-1.5 py-1 text-[10px] truncate bg-white text-[#231B15]">
                        {img.angle}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <ArtifactPlaceholder
              className="aspect-[4/3] rounded-xl"
              reason={
                artifact.permissionStatus !== 'Đã được phép'
                  ? 'Chưa có ảnh tư liệu được phép công bố (chưa có sự đồng ý công bố hoặc đã thu hồi quyền)'
                  : 'Chưa có ảnh tư liệu được phép công bố'
              }
            />
          )}
        </section>

        {/* Right: Accession Core Metadata */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-5 print-only-clean">
          <div className="space-y-2 border-b border-[#70452F]/10 pb-4">
            <div className="text-xs font-mono text-[#70452F] tabular-nums">
              Mã định danh: {artifact.identifier} · Số đăng ký: {artifact.registrationNumber}
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#231B15]">
              {displayOrPlaceholder(artifact.title)}
            </h1>
            <p className="text-xs text-[#65564A]">
              Loại bản hiển thị: <strong className="text-[#231B15]">{artifact.displayedCopyType}</strong> · Hoàn thiện hồ sơ:{' '}
              <strong className="text-[#231B15] tabular-nums">{completeness.percentage}%</strong>
            </p>
          </div>

          <dl className="divide-y divide-[#70452F]/10 text-sm">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Loại kỷ vật</dt>
              <dd className="font-medium text-right">{displayOrPlaceholder(artifact.artifactCategory)}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Chất liệu</dt>
              <dd className="font-medium text-right">{displayOrPlaceholder(artifact.material)}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Kích thước</dt>
              <dd className="font-medium text-right">{displayOrPlaceholder(artifact.dimensions)}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Niên đại & Kiểm chứng</dt>
              <dd className="font-medium text-right">
                {displayOrPlaceholder(artifact.date)} ({artifact.verificationStatus})
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Tình trạng bản gốc</dt>
              <dd className="font-medium text-right">{artifact.originalCondition}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Chủ sở hữu / Người tạo lập</dt>
              <dd className="font-medium text-right">{displayOrPlaceholder(artifact.creator)}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Nơi lưu giữ hiện tại</dt>
              <dd className="font-medium text-right">
                {artifact.permissionStatus === 'Đã được phép'
                  ? displayOrPlaceholder(artifact.currentStorageLocation)
                  : 'Ẩn đến khi được cấp quyền công bố'}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Người cho phép công bố</dt>
              <dd className="font-medium text-right">
                {displayOrPlaceholder(artifact.permissionGrantedBy)} ({displayOrPlaceholder(artifact.permissionRole)})
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Trạng thái & Phạm vi quyền</dt>
              <dd className="font-medium text-right">
                {artifact.permissionStatus} — {displayOrPlaceholder(artifact.permissionScope)}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Editorial Description & Family Story + Web Speech + Gemini On-Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-7 bg-white rounded-2xl border border-[#70452F]/15 p-6 sm:p-8 space-y-6 print-only-clean">
          <div className="space-y-3">
            <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
              Đặc điểm mô tả & Niên đại
            </h2>
            <p className="text-sm sm:text-base text-[#231B15] leading-relaxed">
              {displayOrPlaceholder(artifact.description)}
            </p>
            <p className="text-xs text-[#65564A]">
              Lịch sử lưu truyền / Tiếp nhận: {displayOrPlaceholder(artifact.acquisitionHistory)}
            </p>
          </div>

          <div className="border-t border-[#70452F]/15 pt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
                Câu chuyện gắn với kỷ vật
              </h2>
              <button
                type="button"
                onClick={toggleSpeakStory}
                className={`no-print inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  speaking
                    ? 'bg-[#70452F] text-white border-[#70452F]'
                    : 'bg-[#F8F4EC] text-[#70452F] border-[#70452F]/25 hover:bg-[#EFE8DA]'
                }`}
              >
                {speaking ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Dừng nghe</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Nghe câu chuyện</span>
                  </>
                )}
              </button>
            </div>

            {speechError && (
              <p className="text-xs text-[#70452F] bg-[#F8F4EC] p-3 rounded-lg">
                {speechError}
              </p>
            )}

            <p className="text-sm sm:text-base text-[#231B15] leading-relaxed whitespace-pre-line">
              {displayOrPlaceholder(artifact.familyStory)}
            </p>

            <div className="text-xs text-[#65564A] flex flex-wrap gap-x-6 gap-y-1">
              <span>
                Người kể chuyện: <strong className="text-[#231B15]">{displayOrPlaceholder(artifact.storyTeller)}</strong>
              </span>
              <span>
                Thời điểm ghi nhận: <strong className="text-[#231B15]">{displayOrPlaceholder(artifact.storyRecordedDate)}</strong>
              </span>
              <span>
                Kiểm chứng câu chuyện: <strong className="text-[#231B15]">{artifact.storyVerificationStatus}</strong>
              </span>
            </div>
          </div>

          {/* On-demand Gemini Description Assistant */}
          {!isPublicPreview && (
            <div className="no-print border-t border-[#70452F]/15 pt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#231B15]">
                    Chuẩn hóa mô tả với Google Gemini
                  </h3>
                  <p className="text-xs text-[#65564A]">
                    Chỉ hoạt động khi bạn chủ động nhấn nút. Không gửi nội dung bị hạn chế hay ảnh chưa cấp phép.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRequestGeminiDescription}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#52624B] text-white text-xs font-medium hover:bg-[#3F4D39] disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {aiLoading ? 'Đang xử lý...' : 'Nhờ Gemini hỗ trợ viết mô tả'}
                  </span>
                </button>
              </div>

              {aiError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  {aiError}
                </div>
              )}

              {aiSuggestion && (
                <div className="p-4 rounded-xl bg-[#F8F4EC] border border-[#C59A54]/60 space-y-3">
                  <p className="text-xs font-semibold text-[#70452F]">
                    NỘI DUNG AI ĐỀ XUẤT – CHƯA KIỂM CHỨNG
                  </p>
                  <textarea
                    rows={5}
                    value={aiEditedText}
                    onChange={(e) => setAiEditedText(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white border border-[#70452F]/20 text-sm text-[#231B15] focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    {!artifact.isDemo && (
                      <button
                        type="button"
                        onClick={handleSaveAiNoteToDraft}
                        className="px-3.5 py-1.5 rounded-lg bg-[#70452F] text-white text-xs font-medium hover:bg-[#543220]"
                      >
                        Lưu vào ghi chú quản lý (chưa công bố)
                      </button>
                    )}
                    {aiSavedMsg && (
                      <span className="text-xs text-[#52624B] font-medium">
                        {aiSavedMsg}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right: Sources, Verification, Related & 15 Dublin Core Table */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-4 print-only-clean">
            <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
              Nguồn tư liệu & Mức kiểm chứng
            </h2>
            <p className="text-xs text-[#65564A]">
              Nguồn tóm tắt (dc:source): {displayOrPlaceholder(artifact.source)}
            </p>
            {artifact.referenceSources.length === 0 ? (
              <p className="text-xs text-[#70452F]">
                Chưa có nguồn đối chiếu chi tiết nào được liên kết cho hồ sơ này.
              </p>
            ) : (
              <ul className="space-y-3">
                {artifact.referenceSources.map((src) => (
                  <li
                    key={src.id}
                    className="p-3 rounded-lg bg-[#F8F4EC]/70 border border-[#70452F]/10 text-xs space-y-1"
                  >
                    <p className="font-semibold text-[#231B15]">{src.sourceName}</p>
                    <p className="text-[#65564A]">
                      {src.sourceType} · Cung cấp: {displayOrPlaceholder(src.authorOrProvider)} · Ngày: {displayOrPlaceholder(src.recordedDate)}
                    </p>
                    {src.verifiedContent && (
                      <p className="text-[#231B15]">Xác nhận: {src.verifiedContent}</p>
                    )}
                    {src.urlOrCode && src.urlOrCode.startsWith('http') && (
                      <a
                        href={src.urlOrCode}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#70452F] hover:underline inline-block"
                      >
                        Mở liên kết nguồn ↗
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {artifact.unresolvedQuestions && (
              <div className="pt-2 border-t border-[#70452F]/10 text-xs">
                <p className="font-semibold text-[#231B15]">Vấn đề cần tiếp tục xác minh:</p>
                <p className="text-[#65564A] mt-1">{artifact.unresolvedQuestions}</p>
              </div>
            )}
          </div>

          {/* Related Artifacts */}
          <div className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-3 print-only-clean">
            <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
              Kỷ vật có liên quan
            </h2>
            {relatedArtifacts.length === 0 ? (
              <p className="text-xs text-[#65564A]">
                Chưa có kỷ vật liên quan được gắn kết ({displayOrPlaceholder(artifact.relation)}).
              </p>
            ) : (
              <ul className="space-y-2">
                {relatedArtifacts.map((rel) => (
                  <li key={rel.id}>
                    <Link
                      to={`/ky-vat/${encodeURIComponent(rel.id)}`}
                      className="block p-3 rounded-lg border border-[#70452F]/15 hover:bg-[#F8F4EC] text-sm"
                    >
                      <span className="font-mono text-xs text-[#70452F] mr-2">
                        {rel.identifier}
                      </span>
                      <span className="font-medium text-[#231B15]">{rel.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Full 15 Dublin Core Metadata Table */}
      <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 sm:p-8 space-y-4 print-only-clean">
        <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
          Bảng siêu dữ liệu 15 trường chuẩn Dublin Core
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#70452F]/20 text-[#65564A]">
                <th className="py-2.5 pr-4 font-medium">Trường chuẩn</th>
                <th className="py-2.5 pr-4 font-medium">Thuật ngữ</th>
                <th className="py-2.5 font-medium">Giá trị ghi nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#70452F]/10">
              {DUBLIN_CORE_FIELDS.map((field) => (
                <tr key={field.key}>
                  <td className="py-2.5 pr-4 font-medium text-[#231B15] whitespace-nowrap">
                    {field.labelVi}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-[#70452F] whitespace-nowrap">
                    {field.dcTerm}
                  </td>
                  <td className="py-2.5 text-[#231B15]">
                    {displayOrPlaceholder(String(artifact[field.key] ?? ''))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
};
