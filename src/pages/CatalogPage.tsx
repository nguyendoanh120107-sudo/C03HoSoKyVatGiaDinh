import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Clock,
  LayoutGrid,
  List,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ArtifactPlaceholder } from '../components/ArtifactPlaceholder';
import { SkeletonCards } from '../components/SkeletonCards';
import { useArchive } from '../context/ArchiveContext';
import {
  ARTIFACT_CATEGORIES,
  DISPLAYED_COPY_TYPES,
  ORIGINAL_CONDITIONS,
} from '../data/constants';
import {
  displayOrPlaceholder,
  evaluateArtifactCompleteness,
  extractYearFromDateText,
  getPublicPermittedImages,
  isArtifactPubliclyVisible,
} from '../utils/completeness';

export const CatalogPage: React.FC = () => {
  const { isLoading, activeViewArtifacts, isPublicPreview } = useArchive();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [eraFilter, setEraFilter] = useState('ALL');
  const [conditionFilter, setConditionFilter] = useState(
    searchParams.get('condition') === 'conservation' ? 'CONSERVATION' : 'ALL'
  );
  const [copyTypeFilter, setCopyTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'date'>('createdAt');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showTimelineTab, setShowTimelineTab] = useState(false);
  const [catalogScope, setCatalogScope] = useState<'public' | 'manager'>('public');

  const effectiveScope = isPublicPreview ? 'public' : catalogScope;

  const filteredArtifacts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return activeViewArtifacts
      .filter((item) => {
        if (effectiveScope === 'public' && !isArtifactPubliclyVisible(item)) {
          return false;
        }
        if (q) {
          const hit =
            item.title.toLowerCase().includes(q) ||
            item.identifier.toLowerCase().includes(q) ||
            item.material.toLowerCase().includes(q) ||
            item.subject.toLowerCase().includes(q);
          if (!hit) return false;
        }
        if (categoryFilter !== 'ALL' && item.artifactCategory !== categoryFilter) {
          return false;
        }
        if (copyTypeFilter !== 'ALL' && item.displayedCopyType !== copyTypeFilter) {
          return false;
        }
        if (conditionFilter === 'CONSERVATION') {
          if (
            item.originalCondition !== 'Hư hại nhẹ' &&
            item.originalCondition !== 'Hư hại nặng'
          ) {
            return false;
          }
        } else if (
          conditionFilter !== 'ALL' &&
          item.originalCondition !== conditionFilter
        ) {
          return false;
        }
        if (eraFilter !== 'ALL') {
          const yr = extractYearFromDateText(item.date);
          if (eraFilter === 'BEFORE_1975' && (yr === null || yr >= 1975)) return false;
          if (eraFilter === '1975_1990' && (yr === null || yr < 1975 || yr > 1990))
            return false;
          if (eraFilter === 'AFTER_1990' && (yr === null || yr <= 1990)) return false;
          if (eraFilter === 'UNKNOWN' && yr !== null) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title, 'vi');
        if (sortBy === 'date') {
          const ya = extractYearFromDateText(a.date) ?? 9999;
          const yb = extractYearFromDateText(b.date) ?? 9999;
          return ya - yb;
        }
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [
    activeViewArtifacts,
    effectiveScope,
    query,
    categoryFilter,
    copyTypeFilter,
    conditionFilter,
    eraFilter,
    sortBy,
  ]);

  const timelineItems = useMemo(() => {
    return filteredArtifacts
      .filter((a) => a.verificationStatus === 'Đã kiểm chứng')
      .map((a) => ({ artifact: a, year: extractYearFromDateText(a.date) }))
      .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
  }, [filteredArtifacts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8"
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#70452F]/15 pb-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium tracking-wider text-[#70452F] uppercase">
            Màn hình 2 · Tra cứu bộ sưu tập
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#231B15]">
            Kho Kỷ Vật Gia Đình
          </h1>
          <p className="text-sm text-[#65564A]">
            Trang công khai chỉ hiển thị các kỷ vật đã được cấp quyền công bố.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isPublicPreview && (
            <div className="flex items-center p-1 rounded-lg bg-[#EFE8DA] border border-[#70452F]/15">
              <button
                type="button"
                onClick={() => setCatalogScope('public')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  catalogScope === 'public'
                    ? 'bg-white text-[#70452F] shadow-sm'
                    : 'text-[#65564A] hover:text-[#231B15]'
                }`}
              >
                Bản công khai
              </button>
              <button
                type="button"
                onClick={() => setCatalogScope('manager')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  catalogScope === 'manager'
                    ? 'bg-white text-[#70452F] shadow-sm'
                    : 'text-[#65564A] hover:text-[#231B15]'
                }`}
              >
                Tất cả (Quản lý)
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowTimelineTab((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
              showTimelineTab
                ? 'bg-[#70452F] text-white border-[#70452F]'
                : 'bg-white text-[#231B15] border-[#70452F]/20 hover:bg-[#EFE8DA]/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Dòng thời gian đã kiểm chứng</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <section className="bg-white rounded-xl border border-[#70452F]/15 p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#65564A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên kỷ vật hoặc mã định danh (C03-00001)..."
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-[#F8F4EC]/60 border border-[#70452F]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
            />
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="Lọc theo loại kỷ vật"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white border border-[#70452F]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
            >
              <option value="ALL">Tất cả loại kỷ vật</option>
              {ARTIFACT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="Lọc theo thời gian"
              value={eraFilter}
              onChange={(e) => setEraFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-white border border-[#70452F]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
            >
              <option value="ALL">Mọi thời kỳ</option>
              <option value="BEFORE_1975">Trước năm 1975</option>
              <option value="1975_1990">Giai đoạn 1975 – 1990</option>
              <option value="AFTER_1990">Sau năm 1990</option>
              <option value="UNKNOWN">Chưa rõ năm cụ thể</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Xem dạng lưới"
              className={`h-10 w-10 inline-flex items-center justify-center rounded-lg border transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#70452F] text-white border-[#70452F]'
                  : 'bg-white text-[#65564A] border-[#70452F]/20 hover:bg-[#F8F4EC]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Xem dạng danh sách"
              className={`h-10 w-10 inline-flex items-center justify-center rounded-lg border transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#70452F] text-white border-[#70452F]'
                  : 'bg-white text-[#65564A] border-[#70452F]/20 hover:bg-[#F8F4EC]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <select
            aria-label="Lọc theo tình trạng bảo quản"
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-white border border-[#70452F]/20 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
          >
            <option value="ALL">Mọi tình trạng bảo quản</option>
            <option value="CONSERVATION">Cần ưu tiên bảo quản (Hư hại nhẹ / nặng)</option>
            {ORIGINAL_CONDITIONS.map((cond) => (
              <option key={cond} value={cond}>
                {cond}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo loại bản hiển thị"
            value={copyTypeFilter}
            onChange={(e) => setCopyTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-white border border-[#70452F]/20 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
          >
            <option value="ALL">Mọi loại bản hiển thị</option>
            {DISPLAYED_COPY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            aria-label="Sắp xếp danh sách"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'createdAt' | 'title' | 'date')
            }
            className="h-9 px-3 rounded-lg bg-white border border-[#70452F]/20 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
          >
            <option value="createdAt">Sắp xếp: Ngày nhập mới nhất</option>
            <option value="title">Sắp xếp: Tên kỷ vật (A–Z)</option>
            <option value="date">Sắp xếp: Niên đại</option>
          </select>
        </div>
      </section>

      {/* Timeline View if enabled */}
      {showTimelineTab && (
        <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
            Dòng thời gian kỷ vật có niên đại đã kiểm chứng ({timelineItems.length})
          </h2>
          {timelineItems.length === 0 ? (
            <p className="text-sm text-[#65564A]">
              Chưa có kỷ vật nào trong bộ lọc hiện tại đạt trạng thái “Đã kiểm chứng” niên đại.
            </p>
          ) : (
            <ol className="space-y-3 border-t border-[#70452F]/10 pt-4">
              {timelineItems.map(({ artifact }) => (
                <li
                  key={artifact.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-2.5 border-b border-[#70452F]/10 last:border-b-0"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono text-[#70452F] tabular-nums">
                      {artifact.date} · {artifact.identifier}
                    </div>
                    <Link
                      to={`/ky-vat/${encodeURIComponent(artifact.id)}`}
                      className="text-sm font-semibold text-[#231B15] hover:text-[#70452F] hover:underline"
                    >
                      {artifact.title}
                    </Link>
                  </div>
                  <span className="text-xs text-[#65564A]">
                    {artifact.displayedCopyType} · {artifact.artifactCategory}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* Result Count */}
      <div className="flex items-center justify-between text-xs text-[#65564A]">
        <span className="tabular-nums">
          Đang hiển thị {filteredArtifacts.length} kỷ vật
          {effectiveScope === 'public' ? ' (đã được phép công bố)' : ' (bao gồm hồ sơ nội bộ)'}
        </span>
      </div>

      {/* Main Grid / List */}
      {isLoading ? (
        <SkeletonCards count={6} />
      ) : filteredArtifacts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#70452F]/15 p-10 text-center space-y-3">
          <p className="font-editorial text-xl font-semibold text-[#231B15]">
            Không tìm thấy kỷ vật phù hợp
          </p>
          <p className="text-sm text-[#65564A] max-w-lg mx-auto">
            {effectiveScope === 'public'
              ? 'Chỉ các hồ sơ có trạng thái quyền “Đã được phép” và không ở dạng bản nháp mới xuất hiện công khai. Bạn có thể thêm hồ sơ mới hoặc chuyển sang chế độ Quản lý để kiểm tra.'
              : 'Thử xóa bớt bộ lọc tìm kiếm hoặc thêm hồ sơ kỷ vật mới.'}
          </p>
          <div className="pt-2">
            <Link
              to="/quan-ly?new=1"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[#70452F] text-white text-sm font-medium hover:bg-[#543220]"
            >
              Thêm kỷ vật mới
            </Link>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtifacts.map((artifact) => {
            const permittedPhotos = getPublicPermittedImages(artifact);
            const cover = permittedPhotos[0];
            const completeness = evaluateArtifactCompleteness(artifact);

            return (
              <article
                key={artifact.id}
                className="bg-white rounded-xl border border-[#70452F]/15 overflow-hidden flex flex-col hover:border-[#C59A54] transition-colors"
              >
                <div className="aspect-[4/3] bg-[#EFE8DA]/50 relative overflow-hidden">
                  {cover ? (
                    <img
                      src={cover.displayDataUrl}
                      alt={cover.caption || artifact.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ArtifactPlaceholder className="w-full h-full border-0" />
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-[#70452F] tabular-nums">
                      {artifact.identifier} · {artifact.displayedCopyType}
                      {artifact.isDemo ? ' · Dữ liệu minh họa, không dùng nghiệm thu' : ''}
                    </div>
                    <h2 className="font-editorial text-xl font-semibold text-[#231B15] line-clamp-2">
                      {displayOrPlaceholder(artifact.title)}
                    </h2>
                    <dl className="space-y-1 text-xs text-[#65564A] pt-1">
                      <div className="flex justify-between gap-2">
                        <dt>Niên đại:</dt>
                        <dd className="font-medium text-[#231B15] text-right">
                          {displayOrPlaceholder(artifact.date)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Chất liệu:</dt>
                        <dd className="font-medium text-[#231B15] text-right truncate max-w-[60%]">
                          {displayOrPlaceholder(artifact.material)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Loại kỷ vật:</dt>
                        <dd className="font-medium text-[#231B15] text-right truncate max-w-[60%]">
                          {displayOrPlaceholder(artifact.artifactCategory)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Tình trạng gốc:</dt>
                        <dd className="font-medium text-[#231B15] text-right">
                          {artifact.originalCondition}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt>Nơi lưu giữ:</dt>
                        <dd className="font-medium text-[#231B15] text-right truncate max-w-[60%]">
                          {artifact.permissionStatus === 'Đã được phép'
                            ? displayOrPlaceholder(artifact.currentStorageLocation)
                            : 'Ẩn theo quyền bảo mật'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="pt-3 border-t border-[#70452F]/10 flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        artifact.permissionStatus === 'Đã được phép'
                          ? 'text-[#52624B]'
                          : 'text-[#70452F]'
                      }`}
                    >
                      {artifact.permissionStatus === 'Đã được phép' ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      )}
                      {artifact.permissionStatus}
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="text-[#65564A] tabular-nums">
                        {completeness.percentage}%
                      </span>
                      <Link
                        to={`/ky-vat/${encodeURIComponent(artifact.id)}`}
                        className="font-semibold text-[#70452F] hover:underline whitespace-nowrap"
                      >
                        Xem chi tiết →
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#70452F]/15 divide-y divide-[#70452F]/10">
          {filteredArtifacts.map((artifact) => {
            const permittedPhotos = getPublicPermittedImages(artifact);
            const cover = permittedPhotos[0];
            const completeness = evaluateArtifactCompleteness(artifact);
            return (
              <article
                key={artifact.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-24 h-20 rounded-lg overflow-hidden shrink-0 bg-[#EFE8DA]/50 border border-[#70452F]/10">
                    {cover ? (
                      <img
                        src={cover.displayDataUrl}
                        alt={cover.caption || artifact.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ArtifactPlaceholder
                        compact
                        reason="Chưa có ảnh"
                        className="w-full h-full border-0 text-[10px]"
                      />
                    )}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-mono text-[#70452F] tabular-nums">
                      {artifact.identifier} · {artifact.displayedCopyType} ·{' '}
                      {artifact.permissionStatus}
                    </p>
                    <h2 className="font-editorial text-lg font-semibold text-[#231B15] truncate">
                      {displayOrPlaceholder(artifact.title)}
                    </h2>
                    <p className="text-xs text-[#65564A]">
                      Niên đại: {displayOrPlaceholder(artifact.date)} · Chất liệu:{' '}
                      {displayOrPlaceholder(artifact.material)} · Tình trạng:{' '}
                      {artifact.originalCondition} · Hoàn thiện: {completeness.percentage}%
                    </p>
                  </div>
                </div>

                <Link
                  to={`/ky-vat/${encodeURIComponent(artifact.id)}`}
                  className="px-4 py-2 rounded-lg border border-[#70452F]/25 text-xs font-medium text-[#70452F] hover:bg-[#F8F4EC] whitespace-nowrap shrink-0"
                >
                  Xem chi tiết
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
