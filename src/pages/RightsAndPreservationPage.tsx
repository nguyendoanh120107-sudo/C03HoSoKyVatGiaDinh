import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useArchive } from '../context/ArchiveContext';
import {
  PERMISSION_STATUSES,
  PRESERVATION_GUIDELINES,
} from '../data/constants';
import { FamilyArtifact, PermissionStatus } from '../types/artifact';
import { displayOrPlaceholder } from '../utils/completeness';

export const RightsAndPreservationPage: React.FC = () => {
  const { realArtifacts, permissions, upsertArtifact } = useArchive();
  const [statusFilter, setStatusFilter] = useState<'ALL' | PermissionStatus | 'CONSERVATION'>('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);

  const permissionMap = useMemo(() => {
    const map = new Map<string, (typeof permissions)[number]>();
    for (const entry of permissions) {
      map.set(entry.identifier, entry);
    }
    return map;
  }, [permissions]);

  const filteredList = useMemo(() => {
    return realArtifacts.filter((item) => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'CONSERVATION') {
        return (
          item.originalCondition === 'Hư hại nhẹ' ||
          item.originalCondition === 'Hư hại nặng'
        );
      }
      return item.permissionStatus === statusFilter;
    });
  }, [realArtifacts, statusFilter]);

  const handleUpdatePermissionStatus = async (
    artifact: FamilyArtifact,
    nextStatus: PermissionStatus
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const updated: FamilyArtifact = {
      ...artifact,
      permissionStatus: nextStatus,
      permissionDate:
        nextStatus === 'Đã được phép' && !artifact.permissionDate
          ? today
          : artifact.permissionDate,
      revocationDate:
        nextStatus === 'Đã thu hồi quyền' ? today : artifact.revocationDate,
      updatedAt: new Date().toISOString(),
    };

    // If revoked, also mark individual image public flags false to enforce strict privacy
    if (nextStatus === 'Đã thu hồi quyền') {
      updated.imageFiles = updated.imageFiles.map((img) => ({
        ...img,
        isPermittedForPublic: false,
      }));
    }

    await upsertArtifact(updated);
    setFeedback(
      nextStatus === 'Đã thu hồi quyền'
        ? `Đã thu hồi quyền công bố của ${artifact.identifier} (ngày ${today}). Hình ảnh và dữ liệu liên quan đã ngừng hiển thị công khai ngay lập tức.`
        : `Đã cập nhật trạng thái quyền của ${artifact.identifier} thành "${nextStatus}".`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10"
    >
      {/* Header */}
      <div className="border-b border-[#70452F]/15 pb-6 space-y-2">
        <p className="text-xs font-medium tracking-wider text-[#70452F] uppercase">
          Màn hình 7 · Quyền sử dụng tư liệu (permissions.json) & Hướng dẫn bảo quản
        </p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#231B15]">
          Quyền Công Bố & Bảo Quản Hiện Vật
        </h1>
        <p className="text-sm text-[#65564A] max-w-3xl">
          Kiểm soát chặt chẽ sự đồng ý của đơn vị lưu giữ hoặc người giữ kỷ vật. Đối với 15 hiện vật Bảo tàng Bắc Ninh chưa có văn bản cấp phép đăng lại ảnh, hệ thống tuyệt đối không sao chép ảnh về máy chủ và chỉ hiển thị liên kết mở trang nguồn chính thức.
        </p>
      </div>

      {/* Permissions Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Hồ sơ trong bảng quyền (permissions.json)</p>
          <p className="text-2xl font-semibold text-[#231B15] tabular-nums mt-1">
            {permissions.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Chưa xác minh quyền đăng lại ảnh</p>
          <p className="text-2xl font-semibold text-[#70452F] tabular-nums mt-1">
            {
              permissions.filter((p) => p.permissionStatus !== 'Đã được phép')
                .length
            }
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Đã cấp phép đăng ảnh công khai</p>
          <p className="text-2xl font-semibold text-[#52624B] tabular-nums mt-1">
            {realArtifacts.filter((a) => a.permissionStatus === 'Đã được phép').length}
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-[#52624B]/12 border border-[#52624B]/30 text-sm text-[#2E3B29] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
            statusFilter === 'ALL'
              ? 'bg-[#70452F] text-white border-[#70452F]'
              : 'bg-white text-[#231B15] border-[#70452F]/20'
          }`}
        >
          Tất cả hồ sơ ({realArtifacts.length})
        </button>
        {PERMISSION_STATUSES.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === st
                ? 'bg-[#70452F] text-white border-[#70452F]'
                : 'bg-white text-[#231B15] border-[#70452F]/20'
            }`}
          >
            {st}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setStatusFilter('CONSERVATION')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
            statusFilter === 'CONSERVATION'
              ? 'bg-[#C59A54] text-[#231B15] border-[#C59A54]'
              : 'bg-white text-[#70452F] border-[#70452F]/20'
          }`}
        >
          Kỷ vật cần bảo quản (Hư hại)
        </button>
      </div>

      {/* Rights Registry List */}
      <section className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#70452F]/15 p-8 text-center text-sm text-[#65564A]">
            Chưa có hồ sơ thực tế nào trong nhóm lọc này.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredList.map((artifact) => {
              const permEntry = permissionMap.get(artifact.identifier);
              return (
              <article
                key={artifact.id}
                className="bg-white rounded-xl border border-[#70452F]/15 p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#70452F]/10 pb-3">
                  <div>
                    <p className="text-xs font-mono text-[#70452F]">
                      {artifact.identifier} · Tình trạng gốc: {artifact.originalCondition}
                    </p>
                    <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
                      {displayOrPlaceholder(artifact.title)}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {artifact.permissionStatus === 'Đã được phép' && (
                      <span className="inline-flex items-center gap-1 text-[#52624B]">
                        <ShieldCheck className="w-4 h-4" />
                        Đã được phép
                      </span>
                    )}
                    {artifact.permissionStatus === 'Đã thu hồi quyền' && (
                      <span className="inline-flex items-center gap-1 text-red-700">
                        <ShieldOff className="w-4 h-4" />
                        Đã thu hồi quyền
                      </span>
                    )}
                    {(artifact.permissionStatus === 'Chưa xin phép' ||
                      artifact.permissionStatus === 'Đang chờ xác nhận') && (
                      <span className="inline-flex items-center gap-1 text-[#70452F]">
                        <ShieldAlert className="w-4 h-4" />
                        {artifact.permissionStatus}
                      </span>
                    )}
                  </div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <dt className="text-[#65564A]">Người giữ kỷ vật</dt>
                    <dd className="font-medium text-[#231B15] mt-0.5">
                      {displayOrPlaceholder(artifact.creator)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#65564A]">Người có quyền cho phép (Vai trò)</dt>
                    <dd className="font-medium text-[#231B15] mt-0.5">
                      {displayOrPlaceholder(artifact.permissionGrantedBy)} (
                      {displayOrPlaceholder(artifact.permissionRole)})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#65564A]">Ngày đồng ý / Ngày thu hồi</dt>
                    <dd className="font-medium text-[#231B15] mt-0.5">
                      Đồng ý: {displayOrPlaceholder(artifact.permissionDate)}
                      {artifact.revocationDate
                        ? ` · Thu hồi: ${artifact.revocationDate}`
                        : ''}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#65564A]">Phạm vi đồng ý & Hạn chế</dt>
                    <dd className="font-medium text-[#231B15] mt-0.5">
                      {displayOrPlaceholder(artifact.permissionScope)}
                      {artifact.restrictedContent
                        ? ` (Hạn chế: ${artifact.restrictedContent})`
                        : ''}
                    </dd>
                  </div>
                </dl>

                <div className="pt-3 border-t border-[#70452F]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-[#65564A] font-medium">
                      Cập nhật trạng thái:
                    </label>
                    <select
                      aria-label={`Trạng thái quyền của ${artifact.identifier}`}
                      value={artifact.permissionStatus}
                      onChange={(e) =>
                        handleUpdatePermissionStatus(
                          artifact,
                          e.target.value as PermissionStatus
                        )
                      }
                      className="h-8 px-2.5 rounded-lg border border-[#70452F]/25 bg-white text-xs"
                    >
                      {PERMISSION_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    {artifact.permissionStatus !== 'Đã thu hồi quyền' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdatePermissionStatus(artifact, 'Đã thu hồi quyền')
                        }
                        className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 font-medium"
                      >
                        Thu hồi quyền ngay
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {permEntry?.imageRightsStatus && (
                      <span className="text-[#65564A]">
                        Ảnh: <strong className="text-[#231B15]">{permEntry.imageRightsStatus}</strong>
                      </span>
                    )}
                    {permEntry?.officialSourceUrl && (
                      <a
                        href={permEntry.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[#52624B] hover:underline"
                      >
                        <span>Trang nguồn gốc</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Link
                      to={`/quan-ly?edit=${encodeURIComponent(artifact.id)}`}
                      className="font-medium text-[#70452F] hover:underline"
                    >
                      Chỉnh sửa chi tiết hồ sơ →
                    </Link>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Preservation Guide */}
      <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#C59A54] shrink-0 mt-1" />
          <div>
            <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
              Hướng dẫn bảo quản hiện vật vật lý & tư liệu số
            </h2>
            <p className="text-sm text-[#65564A] mt-1">
              Áp dụng bắt buộc trong quá trình khảo sát, chụp ảnh và lưu giữ kỷ vật gia đình.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRESERVATION_GUIDELINES.map((guide, i) => (
            <div
              key={guide.title}
              className="p-4 rounded-xl bg-[#F8F4EC]/70 border border-[#70452F]/12 space-y-1.5"
            >
              <p className="text-xs font-mono text-[#70452F]">
                Nguyên tắc 0{i + 1}
              </p>
              <h3 className="text-sm font-semibold text-[#231B15]">
                {guide.title}
              </h3>
              <p className="text-xs text-[#65564A] leading-relaxed">
                {guide.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};
