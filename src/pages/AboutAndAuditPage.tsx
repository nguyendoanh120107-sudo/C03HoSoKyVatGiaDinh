import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ClipboardCheck, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { useArchive } from '../context/ArchiveContext';
import { PROJECT_INFO } from '../data/constants';
import { displayOrPlaceholder } from '../utils/completeness';

export const AboutAndAuditPage: React.FC = () => {
  const {
    familyProfile,
    sourceStats,
    realStats,
  } = useArchive();

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
          Màn hình 8 · Giới thiệu dự án & Hồ sơ thực hiện
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#231B15]">
          {PROJECT_INFO.appName}
        </h1>
        <p className="text-sm font-medium text-[#52624B]">
          Chuyên đề đề xuất: {PROJECT_INFO.proposedThemeName}
        </p>
        <p className="text-sm text-[#65564A]">
          {PROJECT_INFO.purpose}
        </p>
      </div>

      {/* Mandatory Scope Confirmation Notice */}
      <section className="rounded-2xl bg-[#F8F4EC] border border-[#C59A54] p-6 space-y-2.5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#70452F] shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
              Phạm vi đề tài cần xác nhận
            </h2>
            <p className="text-sm text-[#231B15] leading-relaxed">
              {PROJECT_INFO.scopeConfirmationNotice}
            </p>
            <p className="text-xs text-[#65564A]">
              Dự án xã hội phi lợi nhuận — Không quảng cáo, không thu phí, không mua bán hoặc định giá hiện vật.
            </p>
          </div>
        </div>
      </section>

      {/* Academic Identity & Collection Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
            Thông tin sinh viên & Đề tài thực hiện
          </h2>
          <dl className="divide-y divide-[#70452F]/10 text-sm">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Tên ứng dụng</dt>
              <dd className="font-semibold text-right">{PROJECT_INFO.appName}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Chuyên đề đề xuất</dt>
              <dd className="font-medium text-right">{PROJECT_INFO.proposedThemeName}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Sinh viên thực hiện</dt>
              <dd className="font-medium text-right">{PROJECT_INFO.studentName}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Mã sinh viên</dt>
              <dd className="font-mono font-medium text-right">{PROJECT_INFO.studentId}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Nhóm</dt>
              <dd className="font-medium text-right">{PROJECT_INFO.groupNumber}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Mã đề tài & Nhóm ý tưởng</dt>
              <dd className="font-medium text-right">
                <span className="font-mono">{PROJECT_INFO.projectCode}</span> · {PROJECT_INFO.ideaGroup}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Đơn vị & Chương trình</dt>
              <dd className="font-medium text-right">
                {PROJECT_INFO.organization} · {PROJECT_INFO.program}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Chủ đề tuần</dt>
              <dd className="font-medium text-right">{PROJECT_INFO.weeklyTopic}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Website tham chiếu</dt>
              <dd className="text-right">
                <a
                  href={PROJECT_INFO.currentWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#52624B] font-medium hover:underline break-all"
                >
                  <span>{PROJECT_INFO.currentWebsiteUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
            Hiện trạng bộ sưu tập 15 hiện vật tra cứu
          </h2>
          <dl className="divide-y divide-[#70452F]/10 text-sm">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Đơn vị lưu giữ thống nhất</dt>
              <dd className="font-medium text-right">
                {displayOrPlaceholder(familyProfile.verifiedStorageLocation)}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Chủ đề tư liệu đã chọn</dt>
              <dd className="font-medium text-right">
                {displayOrPlaceholder(familyProfile.artifactCollectionTheme)}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Hồ sơ có nguồn đối chiếu công khai</dt>
              <dd className="font-semibold text-[#52624B] tabular-nums text-right">
                {realStats.withSourcesCount} / 15 hồ sơ (Xác minh: {realStats.verifiedCount})
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Hồ sơ được phép công bố ảnh</dt>
              <dd className="font-semibold text-[#70452F] tabular-nums text-right">
                {realStats.permittedImageArtifactsCount} / 15 hồ sơ ({realStats.permittedRealImages} ảnh)
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Nguồn tư liệu đối chiếu</dt>
              <dd className="font-semibold text-[#52624B] tabular-nums text-right">
                {sourceStats.totalSources} nguồn ({sourceStats.officialSources} chính thống)
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Người / Đơn vị cho phép đăng ảnh</dt>
              <dd className="font-medium text-right">
                {familyProfile.authorizingPerson?.trim()
                  ? familyProfile.authorizingPerson
                  : 'Chưa cập nhật (không tự điền)'}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Phạm vi công bố hiện tại</dt>
              <dd className="font-medium text-right">
                {displayOrPlaceholder(familyProfile.allowedScope)}
              </dd>
            </div>
          </dl>

          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              to="/nghiem-thu"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#70452F] text-white text-xs font-medium hover:bg-[#543220]"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Mở Dashboard nghiệm thu 20 tiêu chí</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-[#70452F]/25 text-xs font-medium text-[#70452F] hover:bg-[#F8F4EC]"
            >
              <span>Về Trang chủ</span>
            </Link>
          </div>
        </section>
      </div>

      {/* Completed Features & Honest Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#52624B]">
            <CheckCircle2 className="w-5 h-5" />
            <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
              Những phần đã làm được
            </h2>
          </div>
          <ul className="list-disc pl-5 text-sm text-[#65564A] space-y-1.5 leading-relaxed">
            <li>Hoàn thiện đầy đủ 9 màn hình liên kết mượt mà trên máy tính và điện thoại.</li>
            <li>Tổng hợp 15 hồ sơ hiện vật có thật (C03-00001 đến C03-00015) cùng một đơn vị lưu giữ thống nhất là Bảo tàng Bắc Ninh, có số kiểm kê và đường dẫn nguồn cụ thể.</li>
            <li>Áp dụng đủ 15 trường chuẩn Dublin Core kèm trường lưu giữ, loại bản hiển thị, tình trạng bản gốc, quyền và câu chuyện.</li>
            <li>Phân loại 13 nguồn tư liệu thành Nhóm A (trực tiếp tới hiện vật), Nhóm B (quy định/chuẩn), Nhóm C (bổ trợ) và có bảng quyền riêng (permissions.json).</li>
            <li>Cung cấp API máy chủ (/api/public/artifacts, /api/public/sources, /api/public/permissions, /api/gemini/assist) và đọc giọng nói tiếng Việt.</li>
            <li>Xuất đầy đủ JSON, CSV UTF-8 BOM, phiếu in, danh sách nguồn, báo cáo thống kê và danh sách hồ sơ chưa đủ điều kiện.</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-3">
          <div className="flex items-center gap-2 text-[#70452F]">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
              Những phần chưa hoàn thành & Cần tiếp tục
            </h2>
          </div>
          <ul className="list-disc pl-5 text-sm text-[#65564A] space-y-1.5 leading-relaxed">
            <li>
              <strong>Chờ phê duyệt phạm vi đề tài C03:</strong> Cần Trưởng nhóm xác nhận giữ chuyên đề “Kỷ vật và ký ức cộng đồng Bắc Ninh” hay quay về khảo sát 15 kỷ vật trong một gia đình cụ thể.
            </li>
            <li>
              <strong>Chưa có ảnh hiện vật được cấp phép đăng lại:</strong> Vì tuân thủ bản quyền, hệ thống không sao chép ảnh từ website Bảo tàng Bắc Ninh nên tiêu chí ảnh công bố đang ở trạng thái “Chưa đạt” (0 ảnh cấp phép); người dùng có thể mở URL nguồn gốc hoặc tự chụp/tải ảnh có quyền tại màn hình Quản lý.
            </li>
            <li>
              <strong>Một số trường kích thước và tình trạng gốc chưa công bố:</strong> Nguồn công khai chưa nêu kích thước chính xác hoặc tình trạng bảo quản vật lý của một vài hiện vật, hệ thống ghi trung thực là “Chưa xác định theo tài liệu đã tra cứu” và không tự bịa số đo.
            </li>
            <li>
              <strong>Chỉnh sửa cục bộ lưu trên trình duyệt:</strong> Các chỉnh sửa mới thêm của người dùng lưu tại IndexedDB cục bộ trên thiết bị đang dùng.
            </li>
          </ul>
        </section>
      </div>
    </motion.div>
  );
};
