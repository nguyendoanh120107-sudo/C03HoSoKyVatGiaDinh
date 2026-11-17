import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  ExternalLink,
  Eye,
  FilePlus2,
  FlaskConical,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ArtifactPlaceholder } from '../components/ArtifactPlaceholder';
import { SkeletonCards } from '../components/SkeletonCards';
import { useArchive } from '../context/ArchiveContext';
import { PROJECT_INFO } from '../data/constants';
import {
  displayOrPlaceholder,
  extractYearFromDateText,
  getPublicPermittedImages,
  isArtifactPubliclyVisible,
} from '../utils/completeness';

export const HomePage: React.FC = () => {
  const {
    isLoading,
    activeViewArtifacts,
    familyProfile,
    updateFamilyProfile,
    realStats,
    sourceStats,
    isDemoMode,
    setIsDemoMode,
    isPublicPreview,
    setIsPublicPreview,
  } = useArchive();

  const [quickSearch, setQuickSearch] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(familyProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickSearch.trim();
    navigate(q ? `/kho-ky-vat?q=${encodeURIComponent(q)}` : '/kho-ky-vat');
  };

  const openProfileEditor = () => {
    setProfileForm(familyProfile);
    setEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateFamilyProfile(profileForm);
      setEditingProfile(false);
    } finally {
      setSavingProfile(false);
    }
  };

  const publicArtifacts = useMemo(() => {
    return activeViewArtifacts.filter((a) => isArtifactPubliclyVisible(a));
  }, [activeViewArtifacts]);

  const featuredArtifacts = useMemo(() => {
    return publicArtifacts.slice(0, 3);
  }, [publicArtifacts]);

  const verifiedTimelineArtifacts = useMemo(() => {
    return publicArtifacts
      .filter(
        (a) =>
          a.verificationStatus === 'Đã xác minh' ||
          a.verificationStatus === 'Đã kiểm chứng'
      )
      .map((a) => ({
        artifact: a,
        year: extractYearFromDateText(a.date),
      }))
      .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
  }, [publicArtifacts]);

  const progressPct = Math.min(
    100,
    Math.round((realStats.verifiedCount / PROJECT_INFO.targetArtifactCount) * 100)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10"
    >
      {/* Hero Section */}
      <section className="bg-white rounded-2xl border border-[#70452F]/15 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-5">
            <div className="text-xs font-medium tracking-wider text-[#70452F] uppercase">
              Mã đề tài {PROJECT_INFO.projectCode} · {PROJECT_INFO.program} · {PROJECT_INFO.organization}
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#231B15] leading-tight">
              {PROJECT_INFO.appName}
            </h1>

            <p className="text-base sm:text-lg font-medium text-[#52624B]">
              Chuyên đề đề xuất: {PROJECT_INFO.proposedThemeName}
            </p>

            <p className="text-sm sm:text-base text-[#65564A] max-w-2xl leading-relaxed">
              “{PROJECT_INFO.slogan}”. {PROJECT_INFO.purpose} Dự án xã hội phi lợi nhuận: không quảng cáo, không thu phí, không mua bán hay định giá hiện vật.
            </p>

            <form onSubmit={handleSearchSubmit} className="max-w-xl pt-1">
              <label htmlFor="home-quick-search" className="sr-only">
                Tìm kiếm nhanh hiện vật theo tên hoặc mã định danh
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#65564A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="home-quick-search"
                    type="text"
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    placeholder="Tìm nhanh theo tên hiện vật, mã C03-00001 hoặc BTBN..."
                    className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#F8F4EC]/70 border border-[#70452F]/20 text-sm text-[#231B15] placeholder:text-[#65564A]/70 focus:outline-none focus:ring-2 focus:ring-[#C59A54] focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 px-5 rounded-lg bg-[#52624B] text-white text-sm font-medium hover:bg-[#3F4D39] transition-colors whitespace-nowrap shrink-0"
                >
                  Tìm kiếm
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/kho-ky-vat"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#70452F] text-white text-sm font-medium hover:bg-[#543220] transition-colors"
              >
                <span>Khám phá 15 hồ sơ hiện vật</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/nghiem-thu"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F8F4EC] border border-[#70452F]/25 text-[#70452F] text-sm font-medium hover:bg-[#EFE8DA] transition-colors"
              >
                <span>Dashboard nghiệm thu</span>
              </Link>
            </div>
          </div>

          {/* Workspace Controls */}
          <div className="lg:col-span-4 bg-[#F8F4EC] rounded-xl border border-[#70452F]/15 p-5 space-y-4">
            <h2 className="font-editorial text-lg font-semibold text-[#231B15]">
              Chế độ hiển thị & kiểm thử
            </h2>
            <p className="text-xs text-[#65564A] leading-relaxed">
              15 hồ sơ siêu dữ liệu công khai từ Bảo tàng Bắc Ninh được phục vụ qua máy chủ (/api/public/*). Bản nháp cục bộ lưu tại IndexedDB.
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsPublicPreview(!isPublicPreview)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  isPublicPreview
                    ? 'bg-[#52624B] text-white border-[#52624B]'
                    : 'bg-white text-[#231B15] border-[#70452F]/20 hover:bg-[#EFE8DA]/50'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>Xem trước giao diện công khai</span>
                </span>
                <span className="text-xs opacity-90">
                  {isPublicPreview ? 'Đang bật' : 'Đang tắt'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsDemoMode(!isDemoMode)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  isDemoMode
                    ? 'bg-[#C59A54] text-[#231B15] border-[#C59A54]'
                    : 'bg-white text-[#231B15] border-[#70452F]/20 hover:bg-[#EFE8DA]/50'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  <span>Chế độ DEMO (dữ liệu mẫu)</span>
                </span>
                <span className="text-xs font-semibold">
                  {isDemoMode ? 'Đang bật' : 'Đang tắt'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mandatory Scope Confirmation Notice */}
      <section className="bg-white rounded-xl border border-[#C59A54]/60 p-5 sm:p-6 space-y-2">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#C59A54] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[#543220]">
              Phạm vi đề tài cần xác nhận
            </h2>
            <p className="text-xs sm:text-sm text-[#65564A] leading-relaxed">
              {PROJECT_INFO.scopeConfirmationNotice}
            </p>
          </div>
        </div>
      </section>

      {/* Real Stats Grid */}
      <section aria-label="Thống kê hồ sơ và nguồn" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-[#70452F]/12 p-5 space-y-1.5">
            <p className="text-xs font-medium text-[#65564A]">Hồ sơ thật đã xác minh nguồn</p>
            <p className="text-3xl font-semibold text-[#70452F] tabular-nums">
              {realStats.verifiedCount}
              <span className="text-base font-normal text-[#65564A]"> / 15</span>
            </p>
            <p className="text-xs text-[#65564A]">Lưu giữ tại Bảo tàng Bắc Ninh</p>
          </div>

          <div className="bg-white rounded-xl border border-[#70452F]/12 p-5 space-y-1.5">
            <p className="text-xs font-medium text-[#65564A]">Nguồn tư liệu / Chính thống</p>
            <p className="text-3xl font-semibold text-[#52624B] tabular-nums">
              {sourceStats.totalSources}
              <span className="text-base font-normal text-[#65564A]">
                {' '}
                (Chính thống: {sourceStats.officialSources})
              </span>
            </p>
            <p className="text-xs text-[#65564A] tabular-nums">
              Hồ sơ đủ ≥2 nguồn: {sourceStats.artifactsWithTwoSources}/15
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#70452F]/12 p-5 space-y-1.5">
            <p className="text-xs font-medium text-[#65564A]">Trạng thái quyền đăng lại ảnh</p>
            <p className="text-3xl font-semibold text-[#231B15] tabular-nums">
              {realStats.permittedCount}
              <span className="text-base font-normal text-[#65564A]"> / 15</span>
            </p>
            <p className="text-xs text-[#70452F]">
              Chưa xác minh quyền đăng lại ảnh bảo tàng
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#70452F]/12 p-5 space-y-1.5">
            <p className="text-xs font-medium text-[#65564A]">Ảnh được phép công khai</p>
            <p className="text-3xl font-semibold text-[#C59A54] tabular-nums">
              {realStats.permittedRealImages}
            </p>
            <p className="text-xs text-[#65564A]">
              Không sao chép ảnh chưa được cấp phép
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#70452F]/12 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#231B15]">
                Tiến độ xác minh nguồn 15 hồ sơ từ Bảo tàng Bắc Ninh
              </h2>
              <p className="text-xs text-[#65564A]">
                Đủ 15 hồ sơ có số kiểm kê và nguồn trích dẫn; các thông số khuyết được ghi trung thực là “Chưa xác định theo tài liệu đã tra cứu”.
              </p>
            </div>
            <span className="text-sm font-mono font-medium text-[#70452F] tabular-nums">
              {realStats.verifiedCount} / 15 ({progressPct}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#EFE8DA] overflow-hidden">
            <div
              className="h-full bg-[#70452F] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Collection & Management Unit Metadata */}
      <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#70452F]/10 pb-4">
          <div>
            <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
              Đơn vị lưu giữ & phạm vi quyền sử dụng bộ sưu tập
            </h2>
            <p className="text-sm text-[#65564A] mt-1">
              Tập trung vào một đơn vị lưu giữ thống nhất (Bảo tàng Bắc Ninh), không ghép tùy tiện hiện vật nhiều đình chùa khác nhau.
            </p>
          </div>
          {!isPublicPreview && (
            <button
              type="button"
              onClick={openProfileEditor}
              className="px-4 py-2 rounded-lg border border-[#70452F]/25 text-sm font-medium text-[#70452F] hover:bg-[#F8F4EC] transition-colors"
            >
              Chỉnh sửa ghi chú quản lý
            </button>
          )}
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div>
            <dt className="text-xs text-[#65564A] mb-1">Chủ thể / Nhóm tư liệu</dt>
            <dd className="font-medium text-[#231B15]">
              {displayOrPlaceholder(familyProfile.familyName)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#65564A] mb-1">Khối hiện vật lựa chọn</dt>
            <dd className="font-medium text-[#231B15]">
              {displayOrPlaceholder(familyProfile.artifactCollectionTheme)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#65564A] mb-1">Nơi lưu giữ xác minh</dt>
            <dd className="font-medium text-[#231B15]">
              {displayOrPlaceholder(familyProfile.verifiedStorageLocation)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#65564A] mb-1">Trạng thái cấp phép ảnh</dt>
            <dd className="font-medium text-[#70452F]">
              {displayOrPlaceholder(familyProfile.authorizingPerson)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-[#65564A] mb-1">Phạm vi công bố hiện tại</dt>
            <dd className="font-medium text-[#231B15]">
              {displayOrPlaceholder(familyProfile.allowedScope)}
            </dd>
          </div>
        </dl>

        {editingProfile && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-4 pt-6 border-t border-[#70452F]/15 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-medium text-[#231B15] mb-1">
                Chủ thể / Gia đình / Bộ sưu tập
              </label>
              <input
                type="text"
                value={profileForm.familyName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, familyName: e.target.value })
                }
                className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#231B15] mb-1">
                Nơi lưu giữ xác minh
              </label>
              <input
                type="text"
                value={profileForm.verifiedStorageLocation}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    verifiedStorageLocation: e.target.value,
                  })
                }
                className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 rounded-lg bg-[#70452F] text-white text-sm font-medium hover:bg-[#543220]"
              >
                {savingProfile ? 'Đang lưu...' : 'Lưu cập nhật cục bộ'}
              </button>
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="px-4 py-2 rounded-lg border border-[#70452F]/25 text-sm text-[#65564A]"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Featured Artifacts */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#231B15]">
              Hiện vật tiêu biểu trong bộ sưu tập Bắc Ninh
            </h2>
            <p className="text-sm text-[#65564A] mt-1">
              Hiển thị thông tin đã đối chiếu nguồn; không sao chép ảnh từ cổng thông tin bảo tàng khi chưa có văn bản cấp phép.
            </p>
          </div>
          <Link
            to="/kho-ky-vat"
            className="text-sm font-medium text-[#70452F] hover:underline inline-flex items-center gap-1"
          >
            <span>Xem toàn bộ 15 hồ sơ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <SkeletonCards count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArtifacts.map((artifact) => {
              const permittedPhotos = getPublicPermittedImages(artifact);
              const cover = permittedPhotos[0];
              const officialSourceUrl =
                artifact.referenceSources[0]?.urlOrCode ||
                artifact.imageSources[0] ||
                'https://www.baotangbacninh.vn/ds-hien-vat';

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
                      <ArtifactPlaceholder
                        className="w-full h-full border-0"
                        reason="Chưa xác minh quyền đăng lại ảnh"
                      />
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="text-xs text-[#65564A] font-mono tabular-nums">
                        {artifact.identifier} · {artifact.registrationNumber}
                      </div>
                      <h3 className="font-editorial text-xl font-semibold text-[#231B15] line-clamp-2">
                        {artifact.title}
                      </h3>
                      <p className="text-xs text-[#65564A]">
                        {artifact.currentStorageLocation} · {artifact.displayedCopyType}
                      </p>
                      <p className="text-sm text-[#65564A] line-clamp-2 leading-relaxed">
                        {artifact.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#70452F]/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <a
                        href={officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#52624B] font-medium hover:underline"
                      >
                        <span>Mở nguồn gốc</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <Link
                        to={`/ky-vat/${encodeURIComponent(artifact.id)}`}
                        className="font-medium text-[#70452F] hover:underline"
                      >
                        Chi tiết hồ sơ →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Verified Timeline */}
      {verifiedTimelineArtifacts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#70452F]" />
            <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
              Dòng thời gian hiện vật đã xác minh niên đại
            </h2>
          </div>
          <div className="bg-white rounded-xl border border-[#70452F]/15 p-5 overflow-x-auto">
            <div className="flex gap-5 min-w-max">
              {verifiedTimelineArtifacts.map(({ artifact }) => (
                <Link
                  key={artifact.id}
                  to={`/ky-vat/${encodeURIComponent(artifact.id)}`}
                  className="w-64 p-4 rounded-lg bg-[#F8F4EC]/70 border border-[#70452F]/15 hover:border-[#C59A54] transition-colors space-y-1.5"
                >
                  <p className="text-xs font-mono text-[#70452F] tabular-nums">
                    {artifact.identifier} · {artifact.registrationNumber}
                  </p>
                  <p className="text-sm font-semibold text-[#231B15] line-clamp-2">
                    {artifact.title}
                  </p>
                  <p className="text-xs text-[#65564A] line-clamp-1">{artifact.date}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
};
