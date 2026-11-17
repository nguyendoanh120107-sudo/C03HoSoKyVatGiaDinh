import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useArchive } from '../context/ArchiveContext';
import {
  DESCRIPTION_RIGHTS_NOTICE,
  IMAGE_RIGHTS_UNVERIFIED_NOTICE,
  PERMISSION_STATUSES,
  PRESERVATION_GUIDELINES,
} from '../data/constants';
import { FamilyArtifact, PermissionStatus } from '../types/artifact';
import {
  displayOrPlaceholder,
  getEffectivePermissionStatus,
  getPrimarySourceInfo,
  hasValidPermissionEvidence,
} from '../utils/completeness';

interface EvidenceDraft {
  permissionGrantedBy: string;
  permissionRole: string;
  permissionEvidence: string;
  permissionScope: string;
  permissionDate: string;
}

export const RightsAndPreservationPage: React.FC = () => {
  const { realArtifacts, permissions, realStats, upsertArtifact } = useArchive();
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | PermissionStatus | 'CONSERVATION'
  >('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingEvidenceId, setEditingEvidenceId] = useState<string | null>(null);
  const [evidenceDraft, setEvidenceDraft] = useState<EvidenceDraft>({
    permissionGrantedBy: '',
    permissionRole: '',
    permissionEvidence: '',
    permissionScope: '',
    permissionDate: '',
  });

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
      return getEffectivePermissionStatus(item) === statusFilter;
    });
  }, [realArtifacts, statusFilter]);

  const openEvidenceForm = (artifact: FamilyArtifact) => {
    setErrorMsg(null);
    setFeedback(null);
    setEditingEvidenceId(artifact.id);
    setEvidenceDraft({
      permissionGrantedBy: artifact.permissionGrantedBy ?? '',
      permissionRole: artifact.permissionRole ?? '',
      permissionEvidence: artifact.permissionEvidence ?? '',
      permissionScope: artifact.permissionScope ?? '',
      permissionDate: artifact.permissionDate ?? '',
    });
  };

  const handleConfirmEvidenceAndGrant = async (artifact: FamilyArtifact) => {
    setErrorMsg(null);
    setFeedback(null);

    const candidate: FamilyArtifact = {
      ...artifact,
      permissionGrantedBy: evidenceDraft.permissionGrantedBy.trim(),
      permissionRole: evidenceDraft.permissionRole.trim(),
      permissionEvidence: evidenceDraft.permissionEvidence.trim(),
      permissionScope: evidenceDraft.permissionScope.trim(),
      permissionDate: evidenceDraft.permissionDate.trim(),
      permissionStatus: 'Đã được phép',
      imageRightsStatus: `Đã xác nhận quyền sử dụng ảnh (${evidenceDraft.permissionScope.trim()})`,
      updatedAt: new Date().toISOString(),
    };

    if (!hasValidPermissionEvidence(candidate)) {
      setErrorMsg(
        `Không thể xác nhận "Đã được phép" cho ${artifact.identifier}. Người quản lý phải nhập đầy đủ tên người/đơn vị cho phép, bằng chứng cấp phép, phạm vi sử dụng và ngày xác nhận hợp lệ (hệ thống không tự điền).`
      );
      return;
    }

    await upsertArtifact(candidate);
    setEditingEvidenceId(null);
    setFeedback(
      `Đã lưu bằng chứng cấp phép và xác nhận quyền công bố ảnh cho hồ sơ ${artifact.identifier}.`
    );
  };

  const handleUpdatePermissionStatus = async (
    artifact: FamilyArtifact,
    nextStatus: PermissionStatus
  ) => {
    setErrorMsg(null);
    setFeedback(null);

    if (nextStatus === 'Đã được phép' && !hasValidPermissionEvidence(artifact)) {
      openEvidenceForm(artifact);
      setErrorMsg(
        `Hồ sơ ${artifact.identifier} chưa có bằng chứng, phạm vi và ngày xác nhận hợp lệ. Vui lòng nhập đầy đủ thông tin xác nhận quyền trước khi công bố.`
      );
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const updated: FamilyArtifact = {
      ...artifact,
      permissionStatus: nextStatus,
      revocationDate:
        nextStatus === 'Đã thu hồi quyền' ? today : artifact.revocationDate,
      imageRightsStatus:
        nextStatus === 'Đã được phép'
          ? artifact.imageRightsStatus
          : IMAGE_RIGHTS_UNVERIFIED_NOTICE,
      updatedAt: new Date().toISOString(),
    };

    if (nextStatus !== 'Đã được phép') {
      updated.imageFiles = updated.imageFiles.map((img) => ({
        ...img,
        isPermittedForPublic: false,
      }));
    }

    await upsertArtifact(updated);
    setFeedback(
      nextStatus === 'Đã thu hồi quyền'
        ? `Đã thu hồi quyền công bố của ${artifact.identifier} (ngày ${today}). Hình ảnh liên quan đã ngừng hiển thị công khai ngay lập tức.`
        : `Đã cập nhật trạng thái quyền ảnh của ${artifact.identifier} thành "${nextStatus}".`
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
        <p className="text-sm text-[#65564A] max-w-4xl">
          Hệ thống tách bạch rõ <strong className="text-[#231B15]">Quyền sử dụng thông tin mô tả</strong> và{' '}
          <strong className="text-[#231B15]">Quyền đăng lại ảnh hoặc bản số</strong>. Hệ thống không tự xác nhận quyền thay người sở hữu hoặc đơn vị lưu giữ, không tự điền tên người cho phép hay ngày đồng ý, và chỉ cho phép đánh dấu “Đã được phép” khi có bằng chứng, phạm vi và ngày xác nhận hợp lệ.
        </p>
      </div>

      {/* Dual-rights explicit rule card */}
      <section className="rounded-2xl bg-[#F8F4EC] border border-[#70452F]/20 p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
        <div className="space-y-1.5">
          <p className="font-semibold text-[#231B15]">
            1. Quyền sử dụng thông tin mô tả (dữ kiện tra cứu)
          </p>
          <p className="text-[#65564A] leading-relaxed">
            {DESCRIPTION_RIGHTS_NOTICE}
          </p>
        </div>
        <div className="space-y-1.5">
          <p className="font-semibold text-[#70452F]">
            2. Quyền đăng lại ảnh hoặc bản số
          </p>
          <p className="text-[#65564A] leading-relaxed">
            {IMAGE_RIGHTS_UNVERIFIED_NOTICE} Nếu có quyền hợp lệ, người quản lý nhập bằng chứng, phạm vi và ngày xác nhận trước khi công bố ảnh.
          </p>
        </div>
      </section>

      {/* Permissions Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Hồ sơ có nguồn đối chiếu công khai</p>
          <p className="text-2xl font-semibold text-[#52624B] tabular-nums mt-1">
            {realStats.withSourcesCount} / {realStats.totalReal}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">
            Hồ sơ được phép công bố ảnh (có bằng chứng)
          </p>
          <p className="text-2xl font-semibold text-[#231B15] tabular-nums mt-1">
            {realStats.permittedImageArtifactsCount} / {realStats.totalReal}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Chưa xác minh quyền đăng lại ảnh</p>
          <p className="text-2xl font-semibold text-[#70452F] tabular-nums mt-1">
            {realStats.totalReal - realStats.permittedImageArtifactsCount}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#70452F]/15 p-4">
          <p className="text-xs text-[#65564A]">Ảnh thật đã cấp phép công khai</p>
          <p className="text-2xl font-semibold text-[#52624B] tabular-nums mt-1">
            {realStats.permittedRealImages}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

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
              const sourceInfo = getPrimarySourceInfo(artifact);
              const effectiveStatus = getEffectivePermissionStatus(artifact);
              const hasEvidence = hasValidPermissionEvidence(artifact);
              const isEditing = editingEvidenceId === artifact.id;

              return (
                <article
                  key={artifact.id}
                  className="bg-white rounded-xl border border-[#70452F]/15 p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#70452F]/10 pb-3">
                    <div className="space-y-1">
                      <p className="text-xs font-mono text-[#70452F]">
                        {artifact.identifier} · Mã nguồn: {sourceInfo.registrationNumber} · Tình trạng gốc: {artifact.originalCondition}
                      </p>
                      <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
                        {displayOrPlaceholder(artifact.title)}
                      </h2>
                      <p className="text-xs text-[#65564A]">
                        Đơn vị lưu giữ: <strong className="text-[#231B15]">{sourceInfo.custodian}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold">
                      {effectiveStatus === 'Đã được phép' && hasEvidence ? (
                        <span className="inline-flex items-center gap-1 text-[#52624B]">
                          <ShieldCheck className="w-4 h-4" />
                          Đã được phép (có bằng chứng)
                        </span>
                      ) : effectiveStatus === 'Đã thu hồi quyền' ? (
                        <span className="inline-flex items-center gap-1 text-red-700">
                          <ShieldOff className="w-4 h-4" />
                          Đã thu hồi quyền
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#70452F]">
                          <ShieldAlert className="w-4 h-4" />
                          {effectiveStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual rights separation per artifact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-[#F8F4EC]/70 border border-[#70452F]/10 rounded-lg p-3.5">
                    <div>
                      <p className="font-semibold text-[#231B15]">
                        Quyền sử dụng thông tin mô tả:
                      </p>
                      <p className="text-[#65564A] mt-0.5 leading-relaxed">
                        {artifact.descriptionRightsNote || DESCRIPTION_RIGHTS_NOTICE}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#70452F]">
                        Quyền đăng lại ảnh hoặc bản số:
                      </p>
                      <p className="text-[#65564A] mt-0.5 leading-relaxed">
                        {effectiveStatus === 'Đã được phép' && hasEvidence
                          ? `Đã xác nhận quyền công bố ảnh (${artifact.permissionScope}).`
                          : permEntry?.imageRightsStatus || IMAGE_RIGHTS_UNVERIFIED_NOTICE}
                      </p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <dt className="text-[#65564A]">Người / Đơn vị cho phép</dt>
                      <dd className="font-medium text-[#231B15] mt-0.5">
                        {artifact.permissionGrantedBy?.trim()
                          ? `${artifact.permissionGrantedBy}${artifact.permissionRole ? ` (${artifact.permissionRole})` : ''}`
                          : 'Chưa cập nhật (không tự điền)'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#65564A]">Bằng chứng xác nhận</dt>
                      <dd className="font-medium text-[#231B15] mt-0.5">
                        {artifact.permissionEvidence?.trim() || 'Chưa có bằng chứng'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#65564A]">Ngày xác nhận / Thu hồi</dt>
                      <dd className="font-medium text-[#231B15] mt-0.5">
                        {artifact.permissionDate?.trim()
                          ? `Xác nhận: ${artifact.permissionDate}`
                          : 'Chưa có ngày xác nhận'}
                        {artifact.revocationDate
                          ? ` · Thu hồi: ${artifact.revocationDate}`
                          : ''}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#65564A]">Phạm vi & Hạn chế</dt>
                      <dd className="font-medium text-[#231B15] mt-0.5">
                        {displayOrPlaceholder(artifact.permissionScope)}
                        {artifact.restrictedContent
                          ? ` (Hạn chế: ${artifact.restrictedContent})`
                          : ''}
                      </dd>
                    </div>
                  </dl>

                  {/* Explicit Evidence Entry Form */}
                  {isEditing && (
                    <div className="p-4 rounded-xl bg-[#F8F4EC] border border-[#70452F]/20 space-y-3 text-xs">
                      <p className="font-semibold text-[#231B15]">
                        Nhập bằng chứng cấp phép sử dụng ảnh / bản số cho {artifact.identifier}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-medium text-[#231B15] mb-1">
                            Tên người / đơn vị cho phép *
                          </label>
                          <input
                            type="text"
                            value={evidenceDraft.permissionGrantedBy}
                            onChange={(e) =>
                              setEvidenceDraft((d) => ({
                                ...d,
                                permissionGrantedBy: e.target.value,
                              }))
                            }
                            placeholder="Không tự điền nếu chưa có văn bản"
                            className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-[#231B15] mb-1">
                            Vai trò / Chức danh
                          </label>
                          <input
                            type="text"
                            value={evidenceDraft.permissionRole}
                            onChange={(e) =>
                              setEvidenceDraft((d) => ({
                                ...d,
                                permissionRole: e.target.value,
                              }))
                            }
                            placeholder="Ví dụ: Đại diện đơn vị lưu giữ"
                            className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-[#231B15] mb-1">
                            Ngày xác nhận hợp lệ *
                          </label>
                          <input
                            type="date"
                            value={evidenceDraft.permissionDate}
                            onChange={(e) =>
                              setEvidenceDraft((d) => ({
                                ...d,
                                permissionDate: e.target.value,
                              }))
                            }
                            className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block font-medium text-[#231B15] mb-1">
                            Bằng chứng cấp phép (Số văn bản / Email / Biên bản) *
                          </label>
                          <input
                            type="text"
                            value={evidenceDraft.permissionEvidence}
                            onChange={(e) =>
                              setEvidenceDraft((d) => ({
                                ...d,
                                permissionEvidence: e.target.value,
                              }))
                            }
                            placeholder="Ví dụ: Công văn số .../BTBN ngày ... hoặc Biên bản đồng ý gia đình"
                            className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-[#231B15] mb-1">
                            Phạm vi công bố *
                          </label>
                          <input
                            type="text"
                            value={evidenceDraft.permissionScope}
                            onChange={(e) =>
                              setEvidenceDraft((d) => ({
                                ...d,
                                permissionScope: e.target.value,
                              }))
                            }
                            placeholder="Ví dụ: Đăng ảnh phi lợi nhuận kèm dẫn nguồn"
                            className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleConfirmEvidenceAndGrant(artifact)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#52624B] text-white font-medium hover:bg-[#3F4D39]"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Xác nhận quyền & công bố ảnh</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEvidenceId(null)}
                          className="px-3.5 py-2 rounded-lg border border-[#70452F]/25 text-[#65564A] hover:bg-white"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#70452F]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-[#65564A] font-medium">
                        Trạng thái quyền ảnh:
                      </label>
                      <select
                        aria-label={`Trạng thái quyền của ${artifact.identifier}`}
                        value={effectiveStatus}
                        onChange={(e) =>
                          handleUpdatePermissionStatus(
                            artifact,
                            e.target.value as PermissionStatus
                          )
                        }
                        className="h-8 px-2.5 rounded-lg border border-[#70452F]/25 bg-white text-xs"
                      >
                        {PERMISSION_STATUSES.map((st) => (
                          <option
                            key={st}
                            value={st}
                            disabled={st === 'Đã được phép' && !hasEvidence}
                          >
                            {st === 'Đã được phép' && !hasEvidence
                              ? `${st} (cần nhập bằng chứng)`
                              : st}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => openEvidenceForm(artifact)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#52624B]/40 text-[#52624B] hover:bg-[#52624B]/10 font-medium"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Nhập bằng chứng cấp phép</span>
                      </button>
                      {effectiveStatus !== 'Đã thu hồi quyền' && (
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
                      <a
                        href={permEntry?.officialSourceUrl || sourceInfo.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[#52624B] hover:underline"
                      >
                        <span>Xem ảnh tại nguồn chính thức</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
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
