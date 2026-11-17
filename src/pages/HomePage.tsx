import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FilePlus2,
  FlaskConical,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ArtifactPlaceholder } from '../components/ArtifactPlaceholder';
import { SkeletonCards } from '../components/SkeletonCards';
import { useArchive } from '../context/ArchiveContext';
import { FIFTEEN_INTAKE_TEMPLATES, PROJECT_INFO } from '../data/constants';
import {
  displayOrPlaceholder,
  evaluateArtifactCompleteness,
  extractYearFromDateText,
  getPublicPermittedImages,
  isArtifactPubliclyVisible,
} from '../utils/completeness';

export const HomePage: React.FC = () => {
  const {
    isLoading,
    realArtifacts,
    activeViewArtifacts,
    familyProfile,
    updateFamilyProfile,
    realStats,
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
      .filter((a) => a.verificationStatus === 'Đã kiểm chứng')
      .map((a) => ({
        artifact: a,
        year: extractYearFromDateText(a.date),
      }))
      .sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
  }, [publicArtifacts]);

  const alerts = useMemo(() => {
    let missingPermission = 0;
    let missingSources = 0;
    let needConservation = 0;

    for (const item of realArtifacts) {
      if (item.permissionStatus !== 'Đã được phép') missingPermission += 1;
      const rep = evaluateArtifactCompleteness(item);
      if (!rep.hasSufficientSources) missingSources += 1;
      if (rep.needsConservation) needConservation += 1;
    }

    return { missingPermission, missingSources, needConservation };
  }, [realArtifacts]);

  const progressPct = Math.min(
    100,
    Math.round((realStats.totalReal / PROJECT_INFO.targetArtifactCount) * 100)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12"
    >
      {/* Hero Section */}
      <section className="bg-white rounded-2xl border border-[#70452F]/15 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-5">
            <div className="text-xs font-medium tracking-wider text-[#70452F] uppercase">
              Mã đề tài {PROJECT_INFO.projectCode} · {PROJECT_INFO.weeklyTopic} · Dự án phi lợi nhuận
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#231B15] leading-tight">
              {PROJECT_INFO.appName}
            </h1>

            <p className="text-lg sm:text-xl font-medium text-[#70452F]">
              “{PROJECT_INFO.slogan}”
            </p>

            <p className="text-sm sm:text-base text-[#65564A] max-w-2xl leading-relaxed">
              Bảo tàng số phi lợi nhuận phục vụ số hóa, lập hồ sơ chuẩn 15 trường Dublin Core và lưu truyền ký ức về những kỷ vật thực tế đang được gìn giữ trong gia đình. Không kinh doanh, không quảng cáo, tôn trọng tuyệt đối quyền riêng tư và tính xác thực tư liệu.
            </p>

            {/* Quick Search */}
            <form onSubmit={handleSearchSubmit} className="max-w-xl pt-1">
              <label htmlFor="home-quick-search" className="sr-only">
                Tìm kiếm nhanh kỷ vật theo tên hoặc mã định danh
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#65564A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="home-quick-search"
                    type="text"
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    placeholder="Tìm nhanh theo tên kỷ vật hoặc mã C03-00001..."
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

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/kho-ky-vat"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#70452F] text-white text-sm font-medium hover:bg-[#543220] transition-colors"
              >
                <span>Khám phá kỷ vật</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/quan-ly?new=1"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F8F4EC] border border-[#70452F]/25 text-[#70452F] text-sm font-medium hover:bg-[#EFE8DA] transition-colors"
              >
                <FilePlus2 className="w-4 h-4" />
                <span>Thêm kỷ vật</span>
              </Link>
            </div>
          </div>

          {/* Workspace Mode Controls (Public Preview & Isolated Demo) */}
          <div className="lg:col-span-4 bg-[#F8F4EC] rounded-xl border border-[#70452F]/15 p-5 space-y-4">
            <h2 className="font-editorial text-lg font-semibold text-[#231B15]">
              Chế độ hiển thị & kiểm thử
            </h2>
            <p className="text-xs text-[#65564A] leading-relaxed">
              Dữ liệu thật lưu cục bộ tại trình duyệt (IndexedDB). Các mục chưa nhập hiển thị trung thực là “Chưa cập nhật”.
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
              <p className="text-[11px] text-[#65564A]">
                Lưu ý: Dữ liệu DEMO có nhãn riêng “Dữ liệu minh họa, không dùng nghiệm thu” và không tính vào thống kê thật.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Archive Statistics (4 KPIs, strictly honest, no fake numbers) */}
      <section aria-label="Thống kê hồ sơ thực tế" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-[#70452F]/12 p-5 space-y-1.5">
            <p className="text-xs font-medium text-[#65564A]">Số kỷ vật thật đã nhập</p>
            <p className="text-3xl font-semibold text-[#70452F] tabular-nums">
              {realStats.totalReal}
              <span className="text-base font-normal text-[#65564A]">
                {' '}
                / {PROJECT_INFO.targetArtifactCount}
              </span>
            </p>
            <p className="text-xs text-[#65564A]">Không bao gồm bản ghi DEMO</p>
          </div>

          <div className="bg-white rounded-xl border border-[#70452F]/12 p-5 space-y-1.5">
            <p className="text-xs font-medium text-[#65564A]">Kỷ vật được phép công bố</p>
            <p className="text-3xl font-semibold text-[#52624B] tabular-nums">
              {realStats.permittedCount}
            </p>
            <p className="text-xs text-[#65564A]">Đã xác nhận quyền sử dụng</p>
          </div>

          <div className="bg-white rounded-xl border border-[#70452F]/12 p-5 space-y-1.5">
            <p className="text-xs font-medium text-[#65564A]">Bản ghi đủ 15 trường chuẩn</p>
            <p className="text-3xl font-semibold text-[#231B15] tabular-nums">
              {realStats.dublinCoreCompleteCount}
            </p>
            <p className="text-xs text-[#65564A]">Theo chuẩn Dublin Core</p>
          </div>

          <div className="bg-white rounded-xl border border-[#70452F]/12 p-5 space-y-1.5">
            <p className="text-xs font-medium text-[#65564A]">Số ảnh tư liệu thật</p>
            <p className="text-3xl font-semibold text-[#C59A54] tabular-nums">
              {realStats.totalRealImages}
            </p>
            <p className="text-xs text-[#65564A] tabular-nums">
              Được phép công khai: {realStats.permittedRealImages} ảnh
            </p>
          </div>
        </div>

        {/* Progress Bar to 15 Real Records */}
        <div className="bg-white rounded-xl border border-[#70452F]/12 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#231B15]">
                Tiến độ lập tối thiểu 15 hồ sơ kỷ vật thực tế
              </h2>
              <p className="text-xs text-[#65564A]">
                Hệ thống đã chuẩn bị sẵn 15 khung biểu mẫu hồ sơ để người dùng điền thông tin thực tế của gia đình.
              </p>
            </div>
            <span className="text-sm font-mono font-medium text-[#70452F] tabular-nums">
              {realStats.totalReal} / {PROJECT_INFO.targetArtifactCount} ({progressPct}%)
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

      {/* Family & Verified Storage Metadata Block */}
      <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#70452F]/10 pb-4">
          <div>
            <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
              Thông tin gia đình và nơi lưu giữ xác nhận
            </h2>
            <p className="text-sm text-[#65564A] mt-1">
              Mục nào gia đình chưa cung cấp sẽ hiển thị trung thực là “Chưa cập nhật”. Không công khai địa chỉ nhà riêng chi tiết.
            </p>
          </div>
          {!isPublicPreview && (
            <button
              type="button"
              onClick={openProfileEditor}
              className="px-4 py-2 rounded-lg border border-[#70452F]/25 text-sm font-medium text-[#70452F] hover:bg-[#F8F4EC] transition-colors"
            >
              Cập nhật thông tin gia đình
            </button>
          )}
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div>
            <dt className="text-xs text-[#65564A] mb-1">Gia đình / Người đang lưu giữ</dt>
            <dd className="font-medium text-[#231B15]">
              {displayOrPlaceholder(familyProfile.familyName)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#65564A] mb-1">Khối kỷ vật thực tế lựa chọn</dt>
            <dd className="font-medium text-[#231B15]">
              {displayOrPlaceholder(familyProfile.artifactCollectionTheme)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#65564A] mb-1">Nơi lưu giữ đã xác nhận (mức an toàn)</dt>
            <dd className="font-medium text-[#231B15]">
              {displayOrPlaceholder(familyProfile.verifiedStorageLocation)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#65564A] mb-1">Người cho phép công bố</dt>
            <dd className="font-medium text-[#231B15]">
              {displayOrPlaceholder(familyProfile.authorizingPerson)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-[#65564A] mb-1">Phạm vi cho phép sử dụng</dt>
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
                Tên gia đình / Người lưu giữ chính
              </label>
              <input
                type="text"
                value={profileForm.familyName}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, familyName: e.target.value })
                }
                placeholder="Ví dụ: Gia đình ông Nguyễn Văn ..."
                className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#231B15] mb-1">
                Khối kỷ vật thực tế gia đình lưu giữ
              </label>
              <input
                type="text"
                value={profileForm.artifactCollectionTheme}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    artifactCollectionTheme: e.target.value,
                  })
                }
                placeholder="Ví dụ: Kỷ vật sinh hoạt, giấy tờ và ảnh gia đình 1970–2000"
                className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#231B15] mb-1">
                Địa phương / Nơi lưu giữ đã xác nhận (không ghi số nhà)
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
                placeholder="Ví dụ: Huyện Giao Thủy, tỉnh Nam Định (tủ gia đình)"
                className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#231B15] mb-1">
                Người cho phép công bố
              </label>
              <input
                type="text"
                value={profileForm.authorizingPerson}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    authorizingPerson: e.target.value,
                  })
                }
                placeholder="Họ tên người đại diện gia đình đồng ý"
                className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#231B15] mb-1">
                Phạm vi cho phép công bố
              </label>
              <input
                type="text"
                value={profileForm.allowedScope}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, allowedScope: e.target.value })
                }
                placeholder="Ví dụ: Công bố ảnh và câu chuyện chọn lọc phục vụ học tập, bảo tồn phi lợi nhuận"
                className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 rounded-lg bg-[#70452F] text-white text-sm font-medium hover:bg-[#543220] disabled:opacity-60"
              >
                {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="px-4 py-2 rounded-lg border border-[#70452F]/25 text-sm text-[#65564A] hover:bg-[#F8F4EC]"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Quality & Rights Alerts (only shown when real artifacts need attention) */}
      {!isPublicPreview &&
        realArtifacts.length > 0 &&
        (alerts.missingPermission > 0 ||
          alerts.missingSources > 0 ||
          alerts.needConservation > 0) && (
          <section className="bg-white rounded-xl border border-[#C59A54]/50 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#543220] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C59A54]" />
              <span>Cảnh báo quản lý hồ sơ cần rà soát</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#65564A]">
              {alerts.missingPermission > 0 && (
                <Link
                  to="/quyen-va-bao-quan"
                  className="p-3 rounded-lg bg-[#F8F4EC] hover:bg-[#EFE8DA] transition-colors"
                >
                  <strong className="text-[#70452F] tabular-nums">
                    {alerts.missingPermission} hồ sơ
                  </strong>{' '}
                  chưa có trạng thái “Đã được phép” — đang ẩn khỏi trang công khai.
                </Link>
              )}
              {alerts.missingSources > 0 && (
                <Link
                  to="/nguon-tu-lieu"
                  className="p-3 rounded-lg bg-[#F8F4EC] hover:bg-[#EFE8DA] transition-colors"
                >
                  <strong className="text-[#70452F] tabular-nums">
                    {alerts.missingSources} hồ sơ
                  </strong>{' '}
                  chưa đủ tối thiểu 2 nguồn đối chiếu.
                </Link>
              )}
              {alerts.needConservation > 0 && (
                <Link
                  to="/kho-ky-vat?condition=conservation"
                  className="p-3 rounded-lg bg-[#F8F4EC] hover:bg-[#EFE8DA] transition-colors"
                >
                  <strong className="text-[#70452F] tabular-nums">
                    {alerts.needConservation} kỷ vật
                  </strong>{' '}
                  đang hư hại nhẹ/nặng cần lưu ý bảo quản.
                </Link>
              )}
            </div>
          </section>
        )}

      {/* Featured Public Artifacts */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#231B15]">
              Kỷ vật được phép công bố nổi bật
            </h2>
            <p className="text-sm text-[#65564A] mt-1">
              Chỉ hiển thị các hồ sơ đã có xác nhận quyền công bố từ người giữ kỷ vật.
            </p>
          </div>
          <Link
            to="/kho-ky-vat"
            className="text-sm font-medium text-[#70452F] hover:underline inline-flex items-center gap-1"
          >
            <span>Xem toàn bộ kho kỷ vật</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <SkeletonCards count={3} />
        ) : featuredArtifacts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#70452F]/15 p-8 sm:p-10 text-center space-y-4">
            <p className="font-editorial text-xl font-semibold text-[#231B15]">
              Chưa có kỷ vật công khai nào được nhập
            </p>
            <p className="text-sm text-[#65564A] max-w-xl mx-auto leading-relaxed">
              Hệ thống khởi tạo dữ liệu rỗng để không tạo hồ sơ giả. Bạn có thể bắt đầu điền thông tin từ 15 khung biểu mẫu chuẩn bị sẵn hoặc bật thử “Chế độ DEMO” ở phía trên để tham khảo giao diện.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                to="/quan-ly?new=1"
                className="px-5 py-2.5 rounded-lg bg-[#70452F] text-white text-sm font-medium hover:bg-[#543220] transition-colors"
              >
                Nhập hồ sơ kỷ vật đầu tiên
              </Link>
              <Link
                to="/gioi-thieu"
                className="px-5 py-2.5 rounded-lg border border-[#70452F]/25 text-sm font-medium text-[#70452F] hover:bg-[#F8F4EC] transition-colors"
              >
                Xem tiêu chí nghiệm thu
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArtifacts.map((artifact) => {
              const permittedPhotos = getPublicPermittedImages(artifact);
              const cover = permittedPhotos[0];
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
                      <div className="text-xs text-[#65564A] font-mono tabular-nums">
                        {artifact.identifier} · {artifact.displayedCopyType}
                        {artifact.isDemo ? ' · Dữ liệu minh họa, không dùng nghiệm thu' : ''}
                      </div>
                      <h3 className="font-editorial text-xl font-semibold text-[#231B15] line-clamp-2">
                        {artifact.title || 'Chưa cập nhật tên kỷ vật'}
                      </h3>
                      <p className="text-xs text-[#65564A]">
                        {displayOrPlaceholder(artifact.date)} · {displayOrPlaceholder(artifact.artifactCategory)} · {artifact.originalCondition}
                      </p>
                      <p className="text-sm text-[#65564A] line-clamp-2 leading-relaxed">
                        {displayOrPlaceholder(artifact.description)}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#70452F]/10 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-[#52624B] font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Đã được phép công bố
                      </span>
                      <Link
                        to={`/ky-vat/${encodeURIComponent(artifact.id)}`}
                        className="font-medium text-[#70452F] hover:underline"
                      >
                        Xem chi tiết →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 15 Prepared Blank Intake Templates */}
      {!isPublicPreview && (
        <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
                15 biểu mẫu hồ sơ chuẩn bị sẵn cho dữ liệu thực tế
              </h2>
              <p className="text-sm text-[#65564A] mt-1">
                Chọn một khung biểu mẫu gợi ý bên dưới để bắt đầu nhập kỷ vật thật của gia đình (mã tự động cấp khi lưu).
              </p>
            </div>
            <Link
              to="/quan-ly"
              className="text-sm font-medium text-[#70452F] hover:underline"
            >
              Mở trình quản lý đầy đủ →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FIFTEEN_INTAKE_TEMPLATES.map((tpl) => {
              const matched = realArtifacts.find(
                (a) => a.identifier === tpl.suggestedCode
              );
              return (
                <Link
                  key={tpl.slotIndex}
                  to={
                    matched
                      ? `/quan-ly?edit=${encodeURIComponent(matched.id)}`
                      : `/quan-ly?new=1&category=${encodeURIComponent(tpl.suggestedCategory)}&hint=${encodeURIComponent(tpl.suggestedTitleHint)}`
                  }
                  className="p-3.5 rounded-lg border border-[#70452F]/15 bg-[#F8F4EC]/50 hover:bg-[#F8F4EC] hover:border-[#C59A54] transition-colors flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs font-mono text-[#70452F] tabular-nums">
                      Mẫu #{String(tpl.slotIndex).padStart(2, '0')} ·{' '}
                      {matched ? matched.identifier : tpl.suggestedCategory}
                    </div>
                    <p className="text-sm font-medium text-[#231B15] truncate">
                      {matched ? matched.title || '(Bản nháp chưa đặt tên)' : tpl.suggestedTitleHint}
                    </p>
                  </div>
                  {matched ? (
                    <CheckCircle2 className="w-4 h-4 text-[#52624B] shrink-0 mt-0.5" />
                  ) : (
                    <FilePlus2 className="w-4 h-4 text-[#65564A] shrink-0 mt-0.5" />
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Verified Timeline Strip */}
      {verifiedTimelineArtifacts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#70452F]" />
            <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
              Dòng thời gian kỷ vật có niên đại đã kiểm chứng
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
                    {artifact.date} · {artifact.identifier}
                  </p>
                  <p className="text-sm font-semibold text-[#231B15] line-clamp-2">
                    {artifact.title}
                  </p>
                  <p className="text-xs text-[#65564A]">{artifact.artifactCategory}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
};
