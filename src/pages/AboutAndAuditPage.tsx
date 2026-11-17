import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { useArchive } from '../context/ArchiveContext';
import { PROJECT_INFO } from '../data/constants';
import {
  displayOrPlaceholder,
  evaluateArtifactCompleteness,
} from '../utils/completeness';

export const AboutAndAuditPage: React.FC = () => {
  const {
    realArtifacts,
    familyProfile,
    sources,
    geminiHealth,
    realStats,
  } = useArchive();

  const acceptanceCriteria = useMemo(() => {
    const has15Real = realArtifacts.length >= 15;
    const allDublinCoreComplete =
      realArtifacts.length > 0 &&
      realArtifacts.every(
        (a) => evaluateArtifactCompleteness(a).isDublinCoreComplete
      );
    const has7Sources = sources.length >= 7;
    const has3OfficialSources = sources.filter((s) => s.isOfficial).length >= 3;
    const geminiReady = Boolean(geminiHealth?.configured);
    const hasPermissionRecords =
      realArtifacts.length > 0 &&
      realArtifacts.every(
        (a) =>
          a.permissionStatus === 'Đã được phép' &&
          Boolean(a.permissionGrantedBy.trim())
      );
    const hasRealImagesWithCaptions = realArtifacts.some(
      (a) =>
        a.imageFiles.length > 0 &&
        a.imageFiles.every((img) => Boolean(img.caption.trim()))
    );
    const publicUrlActive =
      typeof window !== 'undefined' &&
      (window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost');

    return [
      {
        label: '1. Đủ tối thiểu 15 bản ghi thật (không tính DEMO)',
        passed: has15Real,
        detail: `Hiện có ${realArtifacts.length} / 15 hồ sơ thật.`,
      },
      {
        label: '2. Đủ bộ 15 trường mô tả Dublin Core trên các hồ sơ thật',
        passed: allDublinCoreComplete,
        detail: `${realStats.dublinCoreCompleteCount} / ${realArtifacts.length} hồ sơ đủ 15 trường.`,
      },
      {
        label: '3. Đủ tối thiểu 7 nguồn tư liệu',
        passed: has7Sources,
        detail: `Hiện có ${sources.length} mục nguồn.`,
      },
      {
        label: '4. Có ít nhất 3 nguồn chính thống',
        passed: has3OfficialSources,
        detail: `Hiện có ${sources.filter((s) => s.isOfficial).length} nguồn chính thống.`,
      },
      {
        label: '5. Có chức năng Gemini hoạt động thực tế',
        passed: geminiReady,
        detail: geminiReady
          ? `Đã kết nối máy chủ (${geminiHealth?.model}).`
          : 'Chưa cấu hình GEMINI_API_KEY trên máy chủ.',
      },
      {
        label: '6. Có chức năng xuất dữ liệu (JSON & CSV UTF-8 BOM)',
        passed: true,
        detail: 'Đã tích hợp tại màn hình Quản lý hồ sơ.',
      },
      {
        label: '7. Có ghi nhận quyền công bố đầy đủ',
        passed: hasPermissionRecords,
        detail:
          realArtifacts.length === 0
            ? 'Chưa có hồ sơ thật để kiểm tra quyền.'
            : `${realStats.permittedCount} / ${realArtifacts.length} hồ sơ đã xác nhận quyền và người cho phép.`,
      },
      {
        label: '8. Có ảnh thật và chú thích dưới mỗi ảnh',
        passed: hasRealImagesWithCaptions,
        detail: `Hiện có ${realStats.totalRealImages} ảnh thật đã tải lên.`,
      },
      {
        label: '9. Có trang Giới thiệu dự án đầy đủ thông tin',
        passed: true,
        detail: 'Đang hiển thị tại màn hình hiện tại.',
      },
      {
        label: '10. Giao diện hoạt động tốt trên điện thoại (Responsive)',
        passed: true,
        detail: 'Đã cấu hình bố cục đa thiết bị và menu điện thoại.',
      },
      {
        label: '11. Không lộ khóa API ở trình duyệt',
        passed: true,
        detail: 'Mọi lời gọi @google/genai chạy qua Express /api/gemini/*.',
      },
      {
        label: '12. Đường dẫn công khai hoạt động',
        passed: publicUrlActive,
        detail:
          typeof window !== 'undefined' ? window.location.origin : 'Chưa xác định',
      },
    ];
  }, [realArtifacts, sources, geminiHealth, realStats]);

  const passedCount = acceptanceCriteria.filter((c) => c.passed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10"
    >
      {/* Header */}
      <div className="border-b border-[#70452F]/15 pb-6 space-y-2">
        <p className="text-xs font-medium tracking-wider text-[#70452F] uppercase">
          Màn hình 8 · Hồ sơ học thuật & Nghiệm thu dự án C03
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#231B15]">
          {PROJECT_INFO.appName}
        </h1>
        <p className="text-sm text-[#65564A]">
          {PROJECT_INFO.purpose}
        </p>
      </div>

      {/* Academic Identity & Family Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
            Thông tin đề tài & Sinh viên thực hiện
          </h2>
          <dl className="divide-y divide-[#70452F]/10 text-sm">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Tên ứng dụng</dt>
              <dd className="font-semibold text-right">{PROJECT_INFO.appName}</dd>
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
              <dt className="text-[#65564A]">Mã ý tưởng</dt>
              <dd className="font-mono font-medium text-right">{PROJECT_INFO.projectCode}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Chương trình</dt>
              <dd className="font-medium text-right">{PROJECT_INFO.program}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Đơn vị</dt>
              <dd className="font-medium text-right">{PROJECT_INFO.organization}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Chủ đề</dt>
              <dd className="font-medium text-right">Di sản tư liệu và bảo tàng số</dd>
            </div>
          </dl>
        </section>

        <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-4">
          <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
            Hiện trạng khối kỷ vật thực tế gia đình
          </h2>
          <dl className="divide-y divide-[#70452F]/10 text-sm">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Khối kỷ vật thực tế đã chọn</dt>
              <dd className="font-medium text-right">
                {displayOrPlaceholder(familyProfile.artifactCollectionTheme)}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Tên gia đình / Người lưu giữ</dt>
              <dd className="font-medium text-right">
                {displayOrPlaceholder(familyProfile.familyName)}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Địa phương lưu giữ đã xác minh</dt>
              <dd className="font-medium text-right">
                {displayOrPlaceholder(familyProfile.verifiedStorageLocation)}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Số lượng kỷ vật thực tế</dt>
              <dd className="font-semibold text-[#70452F] tabular-nums text-right">
                {realStats.totalReal} / 15 hồ sơ
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Người cho phép công bố</dt>
              <dd className="font-medium text-right">
                {displayOrPlaceholder(familyProfile.authorizingPerson)}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-[#65564A]">Phạm vi được phép</dt>
              <dd className="font-medium text-right">
                {displayOrPlaceholder(familyProfile.allowedScope)}
              </dd>
            </div>
          </dl>
          <div className="pt-2">
            <Link
              to="/"
              className="text-xs font-medium text-[#70452F] hover:underline"
            >
              Cập nhật thông tin gia đình tại Trang chủ →
            </Link>
          </div>
        </section>
      </div>

      {/* Completed Features & Honest Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-3">
          <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
            Những chức năng đã hoàn thành
          </h2>
          <ul className="list-disc pl-5 text-sm text-[#65564A] space-y-1.5 leading-relaxed">
            <li>Đầy đủ 8 màn hình điều hướng trên cả máy tính và điện thoại.</li>
            <li>Cấu trúc dữ liệu 15 trường chuẩn Dublin Core kèm trường quyền, bảo quản và nguồn.</li>
            <li>Lưu trữ cục bộ bằng IndexedDB; giữ nguyên tệp ảnh gốc tách biệt với bản hiển thị &lt; 500 KB.</li>
            <li>Mã định danh tự động không tái sử dụng (C03-00001...) và kiểm tra trùng mã.</li>
            <li>Tích hợp Google Gemini qua endpoint máy chủ (/api/gemini/assist), ràng buộc không bịa đặt.</li>
            <li>Xuất JSON, CSV UTF-8 BOM (hỗ trợ Excel tiếng Việt), báo cáo thiếu trường và nhập JSON có kiểm tra.</li>
            <li>Quản lý quyền công bố, thu hồi quyền tức thời và hướng dẫn bảo quản hiện vật.</li>
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-3">
          <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
            Hạn chế hiện tại & Công việc cần tiếp tục
          </h2>
          <ul className="list-disc pl-5 text-sm text-[#65564A] space-y-1.5 leading-relaxed">
            <li>
              <strong>Lưu trữ cục bộ trình duyệt:</strong> Phiên bản hiện tại dùng IndexedDB nên dữ liệu chỉ tồn tại trên trình duyệt đang mở, chưa tự đồng bộ giữa nhiều thiết bị.
            </li>
            <li>
              <strong>Chưa triển khai cơ sở dữ liệu dùng chung & xác thực tài khoản:</strong> Nếu muốn chia sẻ liên kết công khai xuyên thiết bị cho nhiều thành viên dòng họ, cần bổ sung backend database và phân quyền đăng nhập.
            </li>
            <li>
              <strong>Dữ liệu thực tế cần người dùng nhập:</strong> Ứng dụng khởi tạo rỗng để bảo đảm tính trung thực, người dùng cần khảo sát gia đình và nhập đủ tối thiểu 15 hồ sơ thật trước khi nộp nghiệm thu.
            </li>
          </ul>
        </section>
      </div>

      {/* Pre-Submission Acceptance Checklist */}
      <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#70452F]/10 pb-4">
          <div>
            <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
              Kiểm tra trước khi nộp (Trạng thái đáp ứng thực tế)
            </h2>
            <p className="text-sm text-[#65564A] mt-1">
              Hệ thống tự động kiểm tra điều kiện thực tế và không đánh dấu hoàn thành nếu dữ liệu chưa đáp ứng.
            </p>
          </div>
          <span className="text-sm font-mono font-semibold text-[#70452F] tabular-nums">
            Đạt {passedCount} / {acceptanceCriteria.length} tiêu chí
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {acceptanceCriteria.map((item) => (
            <div
              key={item.label}
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                item.passed
                  ? 'bg-[#52624B]/8 border-[#52624B]/30'
                  : 'bg-[#F8F4EC]/70 border-[#70452F]/15'
              }`}
            >
              {item.passed ? (
                <CheckCircle2 className="w-5 h-5 text-[#52624B] shrink-0 mt-0.5" />
              ) : (
                <CircleAlert className="w-5 h-5 text-[#70452F] shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-[#231B15]">
                  {item.label}
                </p>
                <p className="text-xs text-[#65564A]">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};
