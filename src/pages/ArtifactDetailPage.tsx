import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
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
import {
  DESCRIPTION_RIGHTS_NOTICE,
  DUBLIN_CORE_FIELDS,
  IMAGE_RIGHTS_UNVERIFIED_NOTICE,
} from '../data/constants';
import { getOriginalImageBlob } from '../services/db';
import { requestGeminiAssist } from '../services/geminiService';
import {
  displayOrPlaceholder,
  evaluateArtifactCompleteness,
  getEffectivePermissionStatus,
  getPrimarySourceInfo,
  getPublicPermittedImages,
  isArtifactPubliclyVisible,
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
          Không tìm thấy hồ sơ hiện vật
        </h1>
        <Link
          to="/kho-ky-vat"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#70452F] text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Kho hiện vật
        </Link>
      </div>
    );
  }

  if (isPublicPreview && !isArtifactPubliclyVisible(artifact)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-editorial text-2xl font-semibold text-[#231B15]">
          Hồ sơ đang bị hạn chế hoặc thu hồi quyền công bố
        </h1>
        <p className="text-sm text-[#65564A]">
          Mã hồ sơ <span className="font-mono">{artifact.identifier}</span> hiện không hiển thị trên giao diện công khai.
        </p>
        <Link
          to="/kho-ky-vat"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#70452F] text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Kho hiện vật
        </Link>
      </div>
    );
  }

  const effectivePermission = getEffectivePermissionStatus(artifact);
  const visibleImages =
    effectivePermission === 'Đã được phép'
      ? getPublicPermittedImages(artifact)
      : isPublicPreview
        ? []
        : artifact.imageFiles;

  const currentImg = visibleImages[activeImgIdx];
  const completeness = evaluateArtifactCompleteness(artifact);
  const sourceInfo = getPrimarySourceInfo(artifact);
  const officialSourceUrl = sourceInfo.sourceUrl;

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

    const storyText = artifact.familyStory?.trim() || artifact.description?.trim();
    if (!storyText) {
      setSpeechError('Hiện vật này chưa có nội dung câu chuyện để đọc.');
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
    if (!isArtifactPubliclyVisible(artifact)) {
      setAiError('Chỉ hỗ trợ gửi các hồ sơ công khai đã xác minh hoặc được cấp phép.');
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
    setAiSavedMsg('Đã lưu vào ghi chú đề xuất cục bộ (chưa tự động công bố).');
  };

  const handleDownloadOriginalImage = async () => {
    if (!currentImg?.originalImageId) return;
    if (effectivePermission !== 'Đã được phép' || !currentImg.isPermittedForPublic) {
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
          <span>Quay lại Kho hiện vật</span>
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

      {artifact.isDemo && (
        <div className="bg-[#C59A54]/20 border border-[#C59A54]/50 rounded-xl p-4 text-sm text-[#543220] font-medium">
          Dữ liệu minh họa, không dùng nghiệm thu — bản ghi trình diễn trong chế độ DEMO.
        </div>
      )}

      {/* Gallery + Accession Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-7 bg-white rounded-2xl border border-[#70452F]/15 p-5 space-y-4 print-only-clean">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#231B15]">
              Hình ảnh tư liệu ({visibleImages.length} ảnh được cấp phép)
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
                  aria-label="Đặt lại kích thước"
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

              <div className="bg-[#F8F4EC]/70 rounded-xl p-4 space-y-2 text-xs">
                <p className="text-sm font-medium text-[#231B15]">
                  {artifact.title} — {displayOrPlaceholder(currentImg.caption)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#65564A]">
                  <div>
                    <span className="font-medium text-[#231B15]">Nguồn / Người chụp:</span>{' '}
                    {displayOrPlaceholder(currentImg.photographerOrSource)}
                  </div>
                  <div>
                    <span className="font-medium text-[#231B15]">Quyền sử dụng:</span>{' '}
                    {displayOrPlaceholder(currentImg.usagePermission)}
                  </div>
                  <div>
                    <span className="font-medium text-[#231B15]">Ngày chụp:</span>{' '}
                    {displayOrPlaceholder(currentImg.captureDate)}
                  </div>
                  <div>
                    <span className="font-medium text-[#231B15]">Tên tệp:</span>{' '}
                    <span className="font-mono">{currentImg.fileName}</span>
                  </div>
                </div>
                {!isPublicPreview &&
                  effectivePermission === 'Đã được phép' &&
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
            </>
          ) : (
            <div className="space-y-4">
              <ArtifactPlaceholder
                className="aspect-[4/3] rounded-xl"
                reason={IMAGE_RIGHTS_UNVERIFIED_NOTICE}
              />
              <div className="no-print p-4 rounded-xl bg-[#F8F4EC] border border-[#70452F]/15 space-y-2 text-xs">
                <p className="font-medium text-[#231B15]">
                  {IMAGE_RIGHTS_UNVERIFIED_NOTICE}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[#65564A]">
                  <span>
                    Đơn vị lưu giữ: <strong className="text-[#231B15]">{sourceInfo.custodian}</strong> · Mã nguồn:{' '}
                    <strong className="font-mono text-[#70452F]">{sourceInfo.registrationNumber}</strong>
                  </span>
                  <a
                    href={officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#52624B] text-white font-medium hover:bg-[#3F4D39]"
                  >
                    <span>Xem ảnh tại nguồn chính thức</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="font-mono text-[11px] text-[#52624B] break-all">
                  URL tư liệu: {officialSourceUrl}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Right: Accession Core Metadata */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-5 print-only-clean">
          <div className="space-y-2 border-b border-[#70452F]/10 pb-4">
            <div className="text-xs font-mono text-[#70452F] tabular-nums">
              Mã hồ sơ: {artifact.identifier} · Số đăng ký / kiểm kê: {artifact.registrationNumber}
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#231B15]">
              {displayOrPlaceholder(artifact.title)}
            </h1>
            <p className="text-xs text-[#65564A]">
              Loại bản hiển thị: <strong className="text-[#231B15]">{artifact.displayedCopyType}</strong> · Mức kiểm chứng:{' '}
              <strong className="text-[#52624B]">{artifact.verificationStatus}</strong> · Hoàn thiện:{' '}
              <strong className="tabular-nums">{completeness.percentage}%</strong>
            </p>
          </div>

          <dl className="divide-y divide-[#70452F]/10 text-sm">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Nơi lưu giữ hiện nay</dt>
              <dd className="font-medium text-right">{displayOrPlaceholder(artifact.currentStorageLocation)}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Nơi lưu giữ thời điểm tư liệu</dt>
              <dd className="font-medium text-right">{displayOrPlaceholder(artifact.historicalStorageLocation)}</dd>
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
              <dt className="text-[#65564A]">Niên đại & căn cứ</dt>
              <dd className="font-medium text-right">{displayOrPlaceholder(artifact.date)}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Tình trạng bản gốc</dt>
              <dd className="font-medium text-right">{artifact.originalCondition}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Người số hóa / Ngày số hóa</dt>
              <dd className="font-medium text-right">
                {displayOrPlaceholder(artifact.digitizedBy)} ({displayOrPlaceholder(artifact.digitizedDate)})
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Đơn vị lưu giữ & Mã nguồn</dt>
              <dd className="font-medium text-right">
                {sourceInfo.custodian} ({sourceInfo.registrationNumber})
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">URL trang tư liệu</dt>
              <dd className="text-right">
                <a
                  href={officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[#52624B] hover:underline break-all"
                >
                  {officialSourceUrl}
                </a>
              </dd>
            </div>
            <div className="py-2.5 space-y-1">
              <dt className="text-[#65564A]">Quyền sử dụng thông tin mô tả</dt>
              <dd className="text-xs font-medium text-[#231B15] leading-relaxed">
                {artifact.descriptionRightsNote || DESCRIPTION_RIGHTS_NOTICE}
              </dd>
            </div>
            <div className="py-2.5 space-y-1">
              <dt className="text-[#65564A]">Quyền đăng lại ảnh hoặc bản số</dt>
              <dd className="text-xs font-semibold text-[#70452F] leading-relaxed">
                {effectivePermission === 'Đã được phép'
                  ? `Đã được phép (Phạm vi: ${artifact.permissionScope})`
                  : IMAGE_RIGHTS_UNVERIFIED_NOTICE}
              </dd>
              {artifact.permissionGrantedBy?.trim() && (
                <dd className="text-xs text-[#231B15]">
                  Người/Đơn vị xác nhận: {artifact.permissionGrantedBy}
                  {artifact.permissionDate ? ` · Ngày: ${artifact.permissionDate}` : ''}
                </dd>
              )}
              {artifact.permissionEvidence?.trim() && (
                <dd className="text-xs text-[#52624B]">
                  Bằng chứng: {artifact.permissionEvidence}
                </dd>
              )}
              {!artifact.permissionGrantedBy?.trim() && (
                <dd className="text-xs text-[#65564A]">
                  Người cho phép & ngày đồng ý: Chưa cập nhật (không tự điền khi chưa có bằng chứng)
                </dd>
              )}
            </div>
          </dl>
        </section>
      </div>

      {/* Story + Web Speech + On-Demand Gemini */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-7 bg-white rounded-2xl border border-[#70452F]/15 p-6 sm:p-8 space-y-6 print-only-clean">
          <div className="space-y-3">
            <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
              Mô tả đối chiếu & Lịch sử tiếp nhận
            </h2>
            <p className="text-xs text-[#52624B] bg-[#F8F4EC] p-3 rounded-lg border border-[#70452F]/10">
              {artifact.descriptionRightsNote || DESCRIPTION_RIGHTS_NOTICE}
            </p>
            <p className="text-sm sm:text-base text-[#231B15] leading-relaxed">
              {displayOrPlaceholder(artifact.description)}
            </p>
            <p className="text-xs text-[#65564A]">
              Nguồn gốc tiếp nhận: {displayOrPlaceholder(artifact.acquisitionHistory)}
            </p>
          </div>

          <div className="border-t border-[#70452F]/15 pt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
                Giá trị ký ức & Câu chuyện gắn với hiện vật
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
                Nguồn kể / ghi nhận: <strong className="text-[#231B15]">{displayOrPlaceholder(artifact.storyTeller)}</strong>
              </span>
              <span>
                Ngày ghi nhận: <strong className="text-[#231B15]">{displayOrPlaceholder(artifact.storyRecordedDate)}</strong>
              </span>
              <span>
                Kiểm chứng: <strong className="text-[#231B15]">{artifact.storyVerificationStatus}</strong>
              </span>
            </div>
          </div>

          {!isPublicPreview && (
            <div className="no-print border-t border-[#70452F]/15 pt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#231B15]">
                    Chuẩn hóa mô tả với Google Gemini
                  </h3>
                  <p className="text-xs text-[#65564A]">
                    Chỉ hoạt động khi bạn chủ động yêu cầu. Không tự xác nhận tính đúng sai thay cho tư liệu.
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
                    className="w-full p-3 rounded-lg bg-white border border-[#70452F]/20 text-sm text-[#231B15]"
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

        {/* Right: Sources, Unresolved Questions & Related */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-4 print-only-clean">
            <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
              Nguồn dẫn chứng & Những điểm chưa rõ
            </h2>
            <p className="text-xs text-[#65564A]">
              Nguồn tóm tắt: {displayOrPlaceholder(artifact.source)}
            </p>
            <ul className="space-y-3">
              {artifact.referenceSources.map((src) => (
                <li
                  key={src.id}
                  className="p-3 rounded-lg bg-[#F8F4EC]/70 border border-[#70452F]/10 text-xs space-y-1"
                >
                  <p className="font-semibold text-[#231B15]">{src.sourceName}</p>
                  <p className="text-[#65564A]">
                    {src.sourceType} · {displayOrPlaceholder(src.authorOrProvider)} · Truy cập: {displayOrPlaceholder(src.recordedDate)}
                  </p>
                  {src.verifiedContent && (
                    <p className="text-[#231B15]">Xác nhận: {src.verifiedContent}</p>
                  )}
                  {src.urlOrCode && src.urlOrCode.startsWith('http') && (
                    <a
                      href={src.urlOrCode}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#70452F] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Mở liên kết nguồn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </li>
              ))}
            </ul>

            <div className="pt-2 border-t border-[#70452F]/10 text-xs">
              <p className="font-semibold text-[#231B15]">Những điểm chưa rõ cần tiếp tục tra cứu:</p>
              <p className="text-[#65564A] mt-1">
                {displayOrPlaceholder(artifact.unresolvedQuestions)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-3 print-only-clean">
            <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
              Hiện vật liên quan
            </h2>
            {relatedArtifacts.length === 0 ? (
              <p className="text-xs text-[#65564A]">
                Chưa có hiện vật liên quan ({displayOrPlaceholder(artifact.relation)}).
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

      {/* 15 Dublin Core Metadata Table */}
      <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 sm:p-8 space-y-4 print-only-clean">
        <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
          Bảng 15 trường chuẩn Dublin Core
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#70452F]/20 text-[#65564A]">
                <th className="py-2.5 pr-4 font-medium">Trường tiếng Việt</th>
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
