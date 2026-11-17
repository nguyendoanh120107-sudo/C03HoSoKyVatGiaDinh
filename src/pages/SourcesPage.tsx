import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useArchive } from '../context/ArchiveContext';
import { ReferenceSourceRegistryItem } from '../types/artifact';
import { displayOrPlaceholder } from '../utils/completeness';

export const SourcesPage: React.FC = () => {
  const { sources, realArtifacts, upsertSource, removeSource } = useArchive();

  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] =
    useState<ReferenceSourceRegistryItem['sourceType']>('Khảo sát thực tế từ gia đình');
  const [isOfficial, setIsOfficial] = useState(false);
  const [url, setUrl] = useState('');
  const [authorOrProvider, setAuthorOrProvider] = useState('');
  const [role, setRole] = useState('');
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().slice(0, 10));
  const [artifactName, setArtifactName] = useState('');
  const [verifiedContent, setVerifiedContent] = useState('');
  const [allowedScope, setAllowedScope] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const officialCount = useMemo(
    () => sources.filter((s) => s.isOfficial).length,
    [sources]
  );

  const artifactsUnderTwoSources = useMemo(
    () => realArtifacts.filter((a) => a.referenceSources.length < 2),
    [realArtifacts]
  );

  const handleLoadForEdit = (src: ReferenceSourceRegistryItem) => {
    setEditingId(src.id);
    setSourceName(src.sourceName);
    setSourceType(src.sourceType);
    setIsOfficial(src.isOfficial);
    setUrl(src.url);
    setAuthorOrProvider(src.authorOrProvider);
    setRole(src.role);
    setSurveyDate(src.surveyDate);
    setArtifactName(src.artifactName);
    setVerifiedContent(src.verifiedContent);
    setAllowedScope(src.allowedScope);
    setFeedback(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setSourceName('');
    setSourceType('Khảo sát thực tế từ gia đình');
    setIsOfficial(false);
    setUrl('');
    setAuthorOrProvider('');
    setRole('');
    setSurveyDate(new Date().toISOString().slice(0, 10));
    setArtifactName('');
    setVerifiedContent('');
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
      isOfficial,
      isPreSuggested: existing?.isPreSuggested ?? false,
      url: url.trim(),
      authorOrProvider: authorOrProvider.trim(),
      role: role.trim(),
      surveyDate: surveyDate.trim(),
      artifactName: artifactName.trim(),
      verifiedContent: verifiedContent.trim(),
      allowedScope: allowedScope.trim(),
      verificationNote:
        existing?.verificationNote ??
        'Nguồn do người quản lý bổ sung hoặc cập nhật sau khảo sát.',
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
          Màn hình 6 · Quản lý và trích dẫn nguồn tư liệu
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#231B15]">
          Nguồn Tư Liệu & Đối Chiếu
        </h1>
        <p className="text-sm text-[#65564A] max-w-3xl">
          Tối thiểu 7 mục nguồn tham khảo (trong đó có ít nhất 3 nguồn chính thống). Các địa chỉ trang web gợi ý là nguồn tra cứu dự kiến — không tự khẳng định đã xác minh từng kỷ vật cụ thể. Mỗi kỷ vật cần có ít nhất 2 nguồn đối chiếu.
        </p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Tổng số mục nguồn</p>
          <p className="text-2xl font-semibold text-[#70452F] tabular-nums mt-1">
            {sources.length} <span className="text-sm font-normal text-[#65564A]">/ tối thiểu 7</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Nguồn chính thống / chuẩn quốc tế</p>
          <p className="text-2xl font-semibold text-[#52624B] tabular-nums mt-1">
            {officialCount} <span className="text-sm font-normal text-[#65564A]">/ tối thiểu 3</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Hồ sơ chưa đủ 2 nguồn đối chiếu</p>
          <p className="text-2xl font-semibold text-[#231B15] tabular-nums mt-1">
            {artifactsUnderTwoSources.length}
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-[#52624B]/12 border border-[#52624B]/30 text-sm text-[#2E3B29] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Add / Edit Source Form (covers Family Field Survey & Books/Interviews) */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-4"
      >
        <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
          {editingId
            ? 'Hoàn thiện / Cập nhật thông tin nguồn'
            : 'Bổ sung nguồn sách, tài liệu hoặc khảo sát phỏng vấn thực tế'}
        </h2>

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
              placeholder="Ví dụ: Khảo sát phỏng vấn bà Nguyễn Thị ..."
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Loại nguồn
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
              <option value="Khảo sát thực tế từ gia đình">
                Khảo sát thực tế từ gia đình
              </option>
              <option value="Cơ quan chính thống">Cơ quan chính thống</option>
              <option value="Chuẩn quốc tế">Chuẩn quốc tế</option>
              <option value="Sách / Tài liệu khác">Sách / Tài liệu / Phỏng vấn</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Người cung cấp / Tác giả
            </label>
            <input
              type="text"
              value={authorOrProvider}
              onChange={(e) => setAuthorOrProvider(e.target.value)}
              placeholder="Họ tên người cung cấp hoặc tác giả sách"
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
              placeholder="Ví dụ: Ông nội / Chủ sở hữu hiện vật"
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Ngày khảo sát / Ghi nhận
            </label>
            <input
              type="date"
              value={surveyDate}
              onChange={(e) => setSurveyDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Tên kỷ vật liên quan
            </label>
            <input
              type="text"
              value={artifactName}
              onChange={(e) => setArtifactName(e.target.value)}
              placeholder="Tên hoặc mã kỷ vật (ví dụ: C03-00001)"
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              URL tra cứu (nếu có)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Phạm vi cho phép
            </label>
            <input
              type="text"
              value={allowedScope}
              onChange={(e) => setAllowedScope(e.target.value)}
              placeholder="Ví dụ: Được trích dẫn trong hồ sơ số C03"
              className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25"
            />
          </div>

          <div className="flex items-end pb-2">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#231B15] cursor-pointer">
              <input
                type="checkbox"
                checked={isOfficial}
                onChange={(e) => setIsOfficial(e.target.checked)}
              />
              <span>Đánh dấu là nguồn chính thống</span>
            </label>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-[#231B15] mb-1">
              Nội dung xác nhận cụ thể
            </label>
            <textarea
              rows={2}
              value={verifiedContent}
              onChange={(e) => setVerifiedContent(e.target.value)}
              placeholder="Ghi rõ thông tin nào đã được nguồn này đối chiếu hoặc xác nhận..."
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

      {/* Sources Directory */}
      <section className="space-y-4">
        <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
          Danh mục nguồn tham khảo & khảo sát ({sources.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((src) => (
            <article
              key={src.id}
              className="bg-white rounded-xl border border-[#70452F]/15 p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="text-xs text-[#70452F] font-medium">
                  {src.sourceType}
                  {src.isOfficial ? ' · Nguồn chính thống' : ''}
                  {src.isPreSuggested ? ' · Nguồn gợi ý cần rà soát' : ''}
                </div>
                <h3 className="font-editorial text-lg font-semibold text-[#231B15]">
                  {src.sourceName}
                </h3>

                <dl className="space-y-1 text-xs text-[#65564A]">
                  <div>
                    <dt className="inline font-medium text-[#231B15]">Người cung cấp / Cơ quan: </dt>
                    <dd className="inline">{displayOrPlaceholder(src.authorOrProvider)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-[#231B15]">Vai trò: </dt>
                    <dd className="inline">{displayOrPlaceholder(src.role)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-[#231B15]">Ngày khảo sát: </dt>
                    <dd className="inline">{displayOrPlaceholder(src.surveyDate)}</dd>
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

                {src.verificationNote && (
                  <p className="text-[11px] text-[#70452F] bg-[#F8F4EC] p-2.5 rounded-lg">
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
                    className="inline-flex items-center gap-1 font-medium text-[#52624B] hover:underline"
                  >
                    <span>Mở liên kết nguồn</span>
                    <ExternalLink className="w-3.5 h-3.5" />
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
                    Hoàn thiện / Sửa
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
