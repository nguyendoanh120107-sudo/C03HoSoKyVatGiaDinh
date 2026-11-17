import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useArchive } from '../context/ArchiveContext';
import {
  ReferenceSourceRegistryItem,
  SourceCategory,
} from '../types/artifact';
import { displayOrPlaceholder } from '../utils/completeness';

const CATEGORY_LABELS: Record<SourceCategory, string> = {
  A: 'Nhóm A · Trực tiếp tới hiện vật (Chính thống)',
  B: 'Nhóm B · Quy định, luật & chuẩn mô tả',
  C: 'Nhóm C · Tư liệu bổ trợ / Khảo sát thực tế',
};

export const SourcesPage: React.FC = () => {
  const { sources, sourceStats, upsertSource, removeSource } = useArchive();

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | SourceCategory>('ALL');

  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] =
    useState<ReferenceSourceRegistryItem['sourceType']>('Cơ quan chính thống');
  const [sourceCategory, setSourceCategory] = useState<SourceCategory>('A');
  const [publisher, setPublisher] = useState('');
  const [isOfficial, setIsOfficial] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [url, setUrl] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [accessedDate, setAccessedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [authorOrProvider, setAuthorOrProvider] = useState('');
  const [role, setRole] = useState('');
  const [surveyDate, setSurveyDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [artifactName, setArtifactName] = useState('');
  const [verifiedContent, setVerifiedContent] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [allowedScope, setAllowedScope] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredSources = useMemo(() => {
    if (categoryFilter === 'ALL') return sources;
    return sources.filter((s) => s.sourceCategory === categoryFilter);
  }, [sources, categoryFilter]);

  const handleLoadForEdit = (src: ReferenceSourceRegistryItem) => {
    setEditingId(src.id);
    setSourceName(src.sourceName);
    setSourceType(src.sourceType);
    setSourceCategory(src.sourceCategory ?? 'C');
    setPublisher(src.publisher ?? '');
    setIsOfficial(src.isOfficial);
    setIsVerified(src.isVerified ?? false);
    setUrl(src.url);
    setPublishedDate(src.publishedDate ?? '');
    setAccessedDate(src.accessedDate ?? src.surveyDate ?? '');
    setAuthorOrProvider(src.authorOrProvider);
    setRole(src.role);
    setSurveyDate(src.surveyDate);
    setArtifactName(src.artifactName);
    setVerifiedContent(src.verifiedContent);
    setExtractedText(src.extractedText ?? '');
    setAllowedScope(src.allowedScope);
    setFeedback(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setSourceName('');
    setSourceType('Cơ quan chính thống');
    setSourceCategory('A');
    setPublisher('');
    setIsOfficial(true);
    setIsVerified(false);
    setUrl('');
    setPublishedDate('');
    setAccessedDate(new Date().toISOString().slice(0, 10));
    setAuthorOrProvider('');
    setRole('');
    setSurveyDate(new Date().toISOString().slice(0, 10));
    setArtifactName('');
    setVerifiedContent('');
    setExtractedText('');
    setAllowedScope('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim()) return;

    const existing = editingId ? sources.find((s) => s.id === editingId) : undefined;
    const item: ReferenceSourceRegistryItem = {
      id: editingId ?? `src-${Date.now()}`,
      sourceName: sourceName.trim(),
      sourceType,
      sourceCategory,
      publisher: publisher.trim() || authorOrProvider.trim(),
      isOfficial,
      isVerified,
      isPreSuggested: existing?.isPreSuggested ?? false,
      url: url.trim(),
      publishedDate: publishedDate.trim(),
      accessedDate: accessedDate.trim(),
      authorOrProvider: authorOrProvider.trim(),
      role: role.trim(),
      surveyDate: surveyDate.trim(),
      artifactName: artifactName.trim(),
      verifiedContent: verifiedContent.trim(),
      extractedText: extractedText.trim() || undefined,
      allowedScope: allowedScope.trim(),
      verificationNote:
        existing?.verificationNote ??
        (isVerified
          ? 'Đã đối chiếu từ URL và văn bản trích thực tế.'
          : 'Nguồn mới bổ sung — chờ đối chiếu văn bản trích thực tế trước khi xác nhận.'),
      linkedArtifactIds: existing?.linkedArtifactIds ?? [],
    };
    await upsertSource(item);
    setFeedback(
      editingId
        ? `Đã cập nhật nguồn "${item.sourceName}".`
        : `Đã bổ sung nguồn mới "${item.sourceName}".`
    );
    resetForm();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8"
    >
      {/* Header */}
      <div className="border-b border-[#70452F]/15 pb-6 space-y-2">
        <p className="text-xs font-medium tracking-wider text-[#70452F] uppercase">
          Màn hình 6 · Quản lý và trích dẫn nguồn tư liệu (Nhóm A / B / C)
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#231B15]">
          Nguồn Tư Liệu & Đối Chiếu
        </h1>
        <p className="text-sm text-[#65564A] max-w-3xl">
          Phân tách rõ nguồn chính thống trỏ trực tiếp tới hiện vật (Nhóm A), khung pháp lý và chuẩn mô tả di sản (Nhóm B), cùng tư liệu bổ trợ hoặc khảo sát thực tế (Nhóm C). Không tự tạo URL giả và chỉ xác nhận hồ sơ khi có văn bản trích dẫn kiểm chứng.
        </p>
      </div>

      {/* 5 Required Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Tổng số nguồn</p>
          <p className="text-2xl font-semibold text-[#70452F] tabular-nums mt-1">
            {sourceStats.totalSources}{' '}
            <span className="text-xs font-normal text-[#65564A]">/ tối thiểu 7</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Nguồn chính thống</p>
          <p className="text-2xl font-semibold text-[#52624B] tabular-nums mt-1">
            {sourceStats.officialSources}{' '}
            <span className="text-xs font-normal text-[#65564A]">/ tối thiểu 3</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Nguồn trực tiếp hiện vật (A)</p>
          <p className="text-2xl font-semibold text-[#231B15] tabular-nums mt-1">
            {sourceStats.directArtifactSources}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Nguồn chưa kiểm chứng</p>
          <p className="text-2xl font-semibold text-[#70452F] tabular-nums mt-1">
            {sourceStats.unverifiedSources}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Hồ sơ có ≥ 2 nguồn</p>
          <p className="text-2xl font-semibold text-[#52624B] tabular-nums mt-1">
            {sourceStats.artifactsWithTwoSources} / 15
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-[#52624B]/12 border border-[#52624B]/30 text-sm text-[#2E3B29] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Add / Edit Source Form with URL & Extracted Source Text */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-4"
      >
        <div>
          <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
            {editingId
              ? 'Cập nhật nguồn & văn bản trích đối chiếu'
              : 'Nhập URL nguồn & văn bản trích từ nguồn thực tế'}
          </h2>
          <p className="text-xs text-[#65564A] mt-1">
            Nếu một địa chỉ tra cứu chưa tải được trực tiếp hoặc cần kiểm chứng bổ sung từ gia đình/bảo tàng, dán URL thực tế và đoạn văn bản trích nguyên văn trước khi đánh dấu đã kiểm chứng.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Tên nguồn tư liệu *
            </label>
            <input
              type="text"
              required
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="Ví dụ: Hồ sơ hiện vật tại Bảo tàng Bắc Ninh..."
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Phân nhóm nguồn (A / B / C)
            </label>
            <select
              value={sourceCategory}
              onChange={(e) => setSourceCategory(e.target.value as SourceCategory)}
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 bg-white"
            >
              <option value="A">Nhóm A — Trực tiếp tới hiện vật</option>
              <option value="B">Nhóm B — Quy định, chuẩn mô tả</option>
              <option value="C">Nhóm C — Tham khảo bổ trợ / Khảo sát</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Loại hình nguồn
            </label>
            <select
              value={sourceType}
              onChange={(e) =>
                setSourceType(
                  e.target.value as ReferenceSourceRegistryItem['sourceType']
                )
              }
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 bg-white"
            >
              <option value="Cơ quan chính thống">Cơ quan chính thống</option>
              <option value="Chuẩn quốc tế">Chuẩn quốc tế</option>
              <option value="Khảo sát thực tế từ gia đình">
                Khảo sát thực tế từ gia đình
              </option>
              <option value="Sách / Tài liệu khác">Sách / Tài liệu khác</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              URL nguồn thực tế (bắt đầu bằng https://)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.baotangbacninh.vn/..."
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Cơ quan phát hành / Đơn vị công bố
            </label>
            <input
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="Ví dụ: Bảo tàng tỉnh Bắc Ninh"
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Tác giả / Người cung cấp
            </label>
            <input
              type="text"
              value={authorOrProvider}
              onChange={(e) => setAuthorOrProvider(e.target.value)}
              placeholder="Tên tác giả bài viết hoặc người kể"
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Ngày công bố trên nguồn
            </label>
            <input
              type="text"
              value={publishedDate}
              onChange={(e) => setPublishedDate(e.target.value)}
              placeholder="Ví dụ: 2024-05-12 hoặc Chưa rõ"
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Ngày truy cập / Ghi nhận
            </label>
            <input
              type="date"
              value={accessedDate}
              onChange={(e) => {
                setAccessedDate(e.target.value);
                setSurveyDate(e.target.value);
              }}
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Kỷ vật / Hồ sơ liên quan
            </label>
            <input
              type="text"
              value={artifactName}
              onChange={(e) => setArtifactName(e.target.value)}
              placeholder="Mã C03-00001 hoặc tên hiện vật"
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Vai trò
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ví dụ: Đơn vị lưu giữ / Người hiến tặng"
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Phạm vi cho phép trích dẫn
            </label>
            <input
              type="text"
              value={allowedScope}
              onChange={(e) => setAllowedScope(e.target.value)}
              placeholder="Ví dụ: Trích dẫn siêu dữ liệu phi lợi nhuận"
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div className="flex flex-col justify-end gap-1.5 pb-1">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#231B15] cursor-pointer">
              <input
                type="checkbox"
                checked={isOfficial}
                onChange={(e) => setIsOfficial(e.target.checked)}
              />
              <span>Nguồn chính thống / cơ quan nhà nước</span>
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#52624B] cursor-pointer">
              <input
                type="checkbox"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
              />
              <span>Đã đối chiếu trích dẫn thực tế từ nguồn</span>
            </label>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Nội dung xác nhận (tóm tắt thông tin được nguồn chứng minh)
            </label>
            <input
              type="text"
              value={verifiedContent}
              onChange={(e) => setVerifiedContent(e.target.value)}
              placeholder="Ví dụ: Xác nhận tên gọi, chất liệu, số kiểm kê BTBN 451..."
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Văn bản trích từ nguồn (dán đoạn trích nguyên văn từ trang nguồn để lưu vết đối chiếu)
            </label>
            <textarea
              rows={3}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Dán đoạn văn bản trích trực tiếp từ tài liệu hoặc bài viết gốc tại đây..."
              className="w-full p-2.5 rounded-lg border border-[#70452F]/25 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#70452F] text-white text-sm font-medium hover:bg-[#543220]"
          >
            <Plus className="w-4 h-4" />
            <span>{editingId ? 'Lưu cập nhật nguồn' : 'Thêm nguồn tư liệu'}</span>
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-[#70452F]/25 text-sm text-[#65564A]"
            >
              Hủy chỉnh sửa
            </button>
          )}
        </div>
      </form>

      {/* Category Filter + Sources Directory */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
            Danh mục nguồn phân loại ({filteredSources.length})
          </h2>

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                categoryFilter === 'ALL'
                  ? 'bg-[#70452F] text-white border-[#70452F]'
                  : 'bg-white text-[#231B15] border-[#70452F]/20'
              }`}
            >
              Tất cả ({sources.length})
            </button>
            {(['A', 'B', 'C'] as SourceCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[#70452F] text-white border-[#70452F]'
                    : 'bg-white text-[#231B15] border-[#70452F]/20'
                }`}
              >
                Nhóm {cat} ({sources.filter((s) => s.sourceCategory === cat).length})
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSources.map((src) => (
            <article
              key={src.id}
              className="bg-white rounded-xl border border-[#70452F]/15 p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-[#70452F]">
                    {CATEGORY_LABELS[src.sourceCategory ?? 'C']}
                  </span>
                  <span
                    className={`font-semibold ${
                      src.isVerified ? 'text-[#52624B]' : 'text-[#70452F]'
                    }`}
                  >
                    {src.isVerified ? 'Đã đối chiếu' : 'Chờ đối chiếu thêm'}
                  </span>
                </div>
                <h3 className="font-editorial text-lg font-semibold text-[#231B15]">
                  {src.sourceName}
                </h3>

                <dl className="space-y-1 text-xs text-[#65564A]">
                  <div>
                    <dt className="inline font-medium text-[#231B15]">Đơn vị phát hành: </dt>
                    <dd className="inline">{displayOrPlaceholder(src.publisher || src.authorOrProvider)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-[#231B15]">Loại nguồn: </dt>
                    <dd className="inline">
                      {src.sourceType}
                      {src.isOfficial ? ' (Chính thống)' : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-[#231B15]">Ngày công bố / Truy cập: </dt>
                    <dd className="inline">
                      {displayOrPlaceholder(src.publishedDate)} · Truy cập:{' '}
                      {displayOrPlaceholder(src.accessedDate || src.surveyDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-[#231B15]">Kỷ vật liên quan: </dt>
                    <dd className="inline">{displayOrPlaceholder(src.artifactName)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-[#231B15]">Nội dung xác nhận: </dt>
                    <dd className="inline">{displayOrPlaceholder(src.verifiedContent)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-[#231B15]">Phạm vi cho phép: </dt>
                    <dd className="inline">{displayOrPlaceholder(src.allowedScope)}</dd>
                  </div>
                </dl>

                {src.extractedText && (
                  <blockquote className="text-xs text-[#231B15] bg-[#F8F4EC] p-3 rounded-lg border border-[#70452F]/15 leading-relaxed">
                    <span className="block text-[11px] font-semibold text-[#70452F] mb-1">
                      Văn bản trích từ nguồn:
                    </span>
                    “{src.extractedText}”
                  </blockquote>
                )}

                {src.verificationNote && (
                  <p className="text-[11px] text-[#65564A] bg-[#F8F4EC]/60 p-2.5 rounded-lg">
                    {src.verificationNote}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#70452F]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                {src.url ? (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-[#52624B] hover:underline break-all"
                  >
                    <span>Mở URL nguồn</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-[#65564A]">Nguồn phỏng vấn / tài liệu nội bộ</span>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleLoadForEdit(src)}
                    className="font-medium text-[#70452F] hover:underline"
                  >
                    Cập nhật / Dán trích dẫn
                  </button>
                  {!src.isPreSuggested && (
                    <button
                      type="button"
                      onClick={() => removeSource(src.id)}
                      className="text-red-700 hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </motion.div>
  );
};
