import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  ImagePlus,
  Plus,
  Printer,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useArchive } from '../context/ArchiveContext';
import {
  ARTIFACT_CATEGORIES,
  DISPLAYED_COPY_TYPES,
  DUBLIN_CORE_FIELDS,
  ORIGINAL_CONDITIONS,
  PERMISSION_STATUSES,
  PHOTO_ANGLES,
  VERIFICATION_STATUSES,
} from '../data/constants';
import { deleteOriginalImageBlob } from '../services/db';
import {
  ArtifactImageFile,
  ArtifactSourceDetail,
  FamilyArtifact,
  PhotoAngle,
} from '../types/artifact';
import { evaluateArtifactCompleteness } from '../utils/completeness';
import {
  exportArtifactsToCsv,
  exportArtifactsToJson,
  exportMissingFieldsReport,
  exportSourcesList,
  exportStatsReport,
  ImportValidationResult,
  validateImportedJson,
} from '../utils/exportImport';
import { formatBytes, processArtifactPhoto } from '../utils/imageProcessor';

function createEmptyArtifact(
  identifier: string,
  presetCategory?: string,
  presetTitleHint?: string
): FamilyArtifact {
  const now = new Date().toISOString();
  return {
    id: identifier,
    title: presetTitleHint ? '' : '',
    creator: '',
    subject: '',
    description: '',
    publisher: 'Lưu trữ Gia đình — Dự án C03',
    contributor: '',
    date: '',
    type: 'Hiện vật vật lý',
    format: '',
    identifier,
    source: '',
    language: 'Tiếng Việt',
    relation: '',
    coverage: '',
    rights: '',
    currentStorageLocation: '',
    historicalStorageLocation: '',
    displayedCopyType: 'Bản số của gốc',
    originalCondition: 'Không rõ',
    registrationNumber: identifier,
    permissionGrantedBy: '',
    permissionRole: '',
    permissionDate: '',
    permissionScope: '',
    permissionStatus: 'Chưa xin phép',
    restrictedContent: '',
    revocationDate: '',
    verificationStatus: 'Chưa kiểm chứng',
    material: '',
    dimensions: '',
    artifactCategory: presetCategory || ARTIFACT_CATEGORIES[0],
    familyStory: '',
    storyTeller: '',
    storyRecordedDate: '',
    storyVerificationStatus: 'Chưa kiểm chứng',
    acquisitionHistory: '',
    digitizedBy: '',
    digitizedDate: now.slice(0, 10),
    imageFiles: [],
    imageCaptions: [],
    imageSources: [],
    relatedArtifactIds: [],
    referenceSources: [],
    unresolvedQuestions: '',
    createdAt: now,
    updatedAt: now,
    isDraft: false,
    isDemo: false,
    aiDraftNotes: '',
  };
}

export const ManageArtifactsPage: React.FC = () => {
  const {
    realArtifacts,
    familyProfile,
    sources,
    upsertArtifact,
    removeArtifact,
    getNextCode,
  } = useArchive();
  const [searchParams, setSearchParams] = useSearchParams();

  const [formOpen, setFormOpen] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(true);
  const [form, setForm] = useState<FamilyArtifact | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FamilyArtifact | null>(null);

  // Photo uploader sub-state
  const [selectedAngle, setSelectedAngle] = useState<PhotoAngle>('Chính diện');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoSource, setPhotoSource] = useState('');
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().slice(0, 10));
  const [photoPermission, setPhotoPermission] = useState('Chưa xin phép');
  const [photoPublicPermitted, setPhotoPublicPermitted] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Source sub-form state
  const [srcName, setSrcName] = useState('');
  const [srcType, setSrcType] = useState('Khảo sát gia đình');
  const [srcAuthor, setSrcAuthor] = useState('');
  const [srcDate, setSrcDate] = useState(new Date().toISOString().slice(0, 10));
  const [srcUrl, setSrcUrl] = useState('');
  const [srcVerified, setSrcVerified] = useState('');
  const [srcExtractedText, setSrcExtractedText] = useState('');

  // Export & Import state
  const [exportIncludePrivate, setExportIncludePrivate] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportValidationResult | null>(
    null
  );
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Handle query params (?new=1 or ?edit=C03-00001)
  useEffect(() => {
    const newFlag = searchParams.get('new');
    const editId = searchParams.get('edit');
    const category = searchParams.get('category') ?? undefined;
    const hint = searchParams.get('hint') ?? undefined;

    if (editId) {
      const found = realArtifacts.find((a) => a.id === editId);
      if (found) {
        setForm({ ...found });
        setIsNewRecord(false);
        setFormOpen(true);
        setPreviewMode(false);
      }
    } else if (newFlag === '1') {
      getNextCode().then((code) => {
        setForm(createEmptyArtifact(code, category, hint));
        setIsNewRecord(true);
        setFormOpen(true);
        setPreviewMode(false);
      });
    }
  }, [searchParams, realArtifacts, getNextCode]);

  const startNewArtifact = async () => {
    const code = await getNextCode();
    setForm(createEmptyArtifact(code));
    setIsNewRecord(true);
    setFormOpen(true);
    setPreviewMode(false);
    setFeedback(null);
    setFormError(null);
    setSearchParams({});
  };

  const startEditArtifact = (artifact: FamilyArtifact) => {
    setForm({ ...artifact });
    setIsNewRecord(false);
    setFormOpen(true);
    setPreviewMode(false);
    setFeedback(null);
    setFormError(null);
  };

  const duplicateIdWarning = useMemo(() => {
    if (!form) return null;
    const conflict = realArtifacts.find(
      (a) => a.identifier === form.identifier && (isNewRecord || a.id !== form.id)
    );
    return conflict
      ? `Mã định danh ${form.identifier} đã tồn tại cho kỷ vật "${conflict.title || 'Chưa đặt tên'}". Hệ thống không cho phép trùng hoặc tái sử dụng mã.`
      : null;
  }, [form, realArtifacts, isNewRecord]);

  const liveCompleteness = useMemo(() => {
    return form ? evaluateArtifactCompleteness(form) : null;
  }, [form]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!form || !e.target.files || e.target.files.length === 0) return;
    setUploadingPhoto(true);
    setFormError(null);
    try {
      const files = Array.from(e.target.files);
      const nextImages: ArtifactImageFile[] = [...form.imageFiles];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const processed = await processArtifactPhoto({
          file,
          artifactIdentifier: form.identifier,
          sequenceIndex: nextImages.length + 1,
          angle: selectedAngle,
          caption:
            photoCaption.trim() ||
            `${form.title || form.identifier} — Góc chụp: ${selectedAngle}`,
          photographerOrSource: photoSource.trim() || 'Thành viên gia đình',
          captureDate: photoDate,
          usagePermission: photoPermission.trim() || form.permissionScope || 'Theo quyền hồ sơ',
          isPermittedForPublic: photoPublicPermitted,
        });
        nextImages.push(processed);
      }

      setForm({
        ...form,
        imageFiles: nextImages,
        imageCaptions: nextImages.map((img) => img.caption),
        imageSources: nextImages.map((img) => img.photographerOrSource),
      });
      setPhotoCaption('');
      if (photoInputRef.current) photoInputRef.current.value = '';
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Lỗi xử lý ảnh tải lên từ thiết bị.'
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async (img: ArtifactImageFile) => {
    if (!form) return;
    if (img.originalImageId) {
      await deleteOriginalImageBlob(img.originalImageId).catch(() => undefined);
    }
    const updated = form.imageFiles.filter((i) => i.id !== img.id);
    setForm({
      ...form,
      imageFiles: updated,
      imageCaptions: updated.map((i) => i.caption),
      imageSources: updated.map((i) => i.photographerOrSource),
    });
  };

  const handleAddSourceToArtifact = () => {
    if (!form || !srcName.trim()) return;
    const newSrc: ArtifactSourceDetail = {
      id: `asrc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sourceName: srcName.trim(),
      sourceType: srcType,
      authorOrProvider: srcAuthor.trim(),
      recordedDate: srcDate,
      urlOrCode: srcUrl.trim(),
      verifiedContent: srcVerified.trim(),
      extractedText: srcExtractedText.trim() || undefined,
    };
    setForm({
      ...form,
      referenceSources: [...form.referenceSources, newSrc],
    });
    setSrcName('');
    setSrcAuthor('');
    setSrcUrl('');
    setSrcVerified('');
    setSrcExtractedText('');
  };

  const handleSaveForm = async (asDraft: boolean) => {
    if (!form) return;
    setFormError(null);
    setFeedback(null);

    if (duplicateIdWarning) {
      setFormError(duplicateIdWarning);
      return;
    }

    if (!asDraft && !form.title.trim()) {
      setFormError('Vui lòng nhập Tên kỷ vật trước khi lưu hồ sơ chính thức (hoặc chọn Lưu bản nháp).');
      return;
    }

    setSaving(true);
    try {
      const toSave: FamilyArtifact = {
        ...form,
        id: form.identifier,
        registrationNumber: form.registrationNumber || form.identifier,
        isDraft: asDraft,
        isDemo: false,
        updatedAt: new Date().toISOString(),
      };
      await upsertArtifact(toSave);
      setFeedback(
        asDraft
          ? `Đã lưu bản nháp hồ sơ ${toSave.identifier} vào IndexedDB.`
          : `Đã lưu hồ sơ ${toSave.identifier} thành công.`
      );
      setIsNewRecord(false);
      setForm(toSave);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Không thể lưu hồ sơ vào IndexedDB.'
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteArtifact = async () => {
    if (!deleteTarget) return;
    await removeArtifact(deleteTarget.id);
    if (form?.id === deleteTarget.id) {
      setForm(null);
      setFormOpen(false);
    }
    setFeedback(`Đã xóa hồ sơ ${deleteTarget.identifier}. Mã này sẽ không được cấp lại.`);
    setDeleteTarget(null);
  };

  const handleImportFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const existingIds = new Set(realArtifacts.map((a) => a.identifier));
    const result = validateImportedJson(text, existingIds);
    setImportPreview(result);
    if (importInputRef.current) importInputRef.current.value = '';
  };

  const handleCommitImport = async (overwriteDuplicates: boolean) => {
    if (!importPreview || !importPreview.valid) return;
    setImporting(true);
    try {
      const existingIds = new Set(realArtifacts.map((a) => a.identifier));
      let importedCount = 0;
      for (const item of importPreview.artifacts) {
        if (existingIds.has(item.identifier) && !overwriteDuplicates) {
          continue;
        }
        await upsertArtifact(item);
        importedCount += 1;
      }
      setFeedback(`Đã nhập thành công ${importedCount} hồ sơ từ tệp JSON.`);
      setImportPreview(null);
    } finally {
      setImporting(false);
    }
  };

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
            Màn hình 4 · Nhập liệu, xử lý ảnh và xuất nhập dữ liệu
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#231B15]">
            Thêm & Quản Lý Hồ Sơ Kỷ Vật
          </h1>
          <p className="text-sm text-[#65564A]">
            Mỗi hồ sơ được cấp mã định danh tự động không tái sử dụng (C03-00001, C03-00002...). Ảnh gốc được lưu riêng tại IndexedDB.
          </p>
        </div>

        <button
          type="button"
          onClick={startNewArtifact}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#70452F] text-white text-sm font-medium hover:bg-[#543220] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo hồ sơ mới</span>
        </button>
      </div>

      {/* Local IndexedDB Explanation */}
      <div className="bg-white rounded-xl border border-[#70452F]/15 p-4 text-xs sm:text-sm text-[#65564A] leading-relaxed">
        <strong className="text-[#231B15]">Lưu ý về lưu trữ cục bộ:</strong> Dữ liệu và ảnh bạn nhập được lưu trực tiếp trong IndexedDB của trình duyệt hiện tại và chưa tự động đồng bộ sang thiết bị khác. Để công khai hoặc dùng chung nhiều thiết bị, cần triển khai cơ sở dữ liệu máy chủ và xác thực phân quyền phù hợp. Hãy thường xuyên dùng chức năng xuất JSON/CSV để sao lưu.
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-[#52624B]/12 border border-[#52624B]/30 text-sm text-[#2E3B29] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Export & Import Backup Section */}
      <section className="bg-white rounded-2xl border border-[#70452F]/15 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
              Xuất, nhập và sao lưu dữ liệu (JSON / CSV UTF-8 BOM)
            </h2>
            <p className="text-xs text-[#65564A] mt-1">
              Mặc định chỉ xuất dữ liệu đã được phép công bố. Chỉ chọn chế độ quản lý khi cần sao lưu nội bộ.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-[#231B15] cursor-pointer">
            <input
              type="checkbox"
              checked={exportIncludePrivate}
              onChange={(e) => setExportIncludePrivate(e.target.checked)}
              className="rounded border-[#70452F]/30 text-[#70452F] focus:ring-[#C59A54]"
            />
            <span>Chế độ quản lý: Xuất cả hồ sơ riêng tư / nháp để sao lưu cục bộ</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              const res = exportArtifactsToJson(
                realArtifacts,
                familyProfile,
                exportIncludePrivate
              );
              setFeedback(`Đã xuất ${res.count} hồ sơ ra tệp ${res.filename}.`);
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#70452F]/25 bg-[#F8F4EC]/70 hover:bg-[#EFE8DA] text-xs font-medium text-[#231B15]"
          >
            <Download className="w-4 h-4 text-[#70452F]" />
            <span>Xuất JSON</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const res = exportArtifactsToCsv(realArtifacts, exportIncludePrivate);
              setFeedback(`Đã xuất ${res.count} hồ sơ ra tệp CSV chuẩn Excel (${res.filename}).`);
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#70452F]/25 bg-[#F8F4EC]/70 hover:bg-[#EFE8DA] text-xs font-medium text-[#231B15]"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#52624B]" />
            <span>Xuất CSV (Excel UTF-8 BOM)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const fname = exportSourcesList(sources);
              setFeedback(`Đã xuất danh sách nguồn tư liệu: ${fname}`);
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#70452F]/25 bg-[#F8F4EC]/70 hover:bg-[#EFE8DA] text-xs font-medium text-[#231B15]"
          >
            <FileText className="w-4 h-4 text-[#52624B]" />
            <span>Xuất danh sách nguồn</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const fname = exportMissingFieldsReport(realArtifacts);
              setFeedback(`Đã xuất danh sách hồ sơ chưa đủ điều kiện / thiếu trường: ${fname}`);
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#70452F]/25 bg-[#F8F4EC]/70 hover:bg-[#EFE8DA] text-xs font-medium text-[#231B15]"
          >
            <FileText className="w-4 h-4 text-[#70452F]" />
            <span>Xuất DS hồ sơ chưa đủ điều kiện</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const fname = exportStatsReport(realArtifacts, familyProfile);
              setFeedback(`Đã xuất báo cáo thống kê: ${fname}`);
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#70452F]/25 bg-[#F8F4EC]/70 hover:bg-[#EFE8DA] text-xs font-medium text-[#231B15]"
          >
            <Download className="w-4 h-4 text-[#C59A54]" />
            <span>Xuất báo cáo thống kê</span>
          </button>

          <label className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-[#52624B]/40 bg-[#52624B]/10 hover:bg-[#52624B]/20 text-xs font-medium text-[#2E3B29] cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Nhập từ JSON</span>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFileSelect}
              className="hidden"
            />
          </label>
        </div>

        {/* Pre-import Validation Preview */}
        {importPreview && (
          <div className="p-4 rounded-xl bg-[#F8F4EC] border border-[#70452F]/20 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#231B15]">
                Kiểm tra dữ liệu trước khi nhập ({importPreview.artifacts.length} bản ghi hợp lệ)
              </p>
              <button
                type="button"
                onClick={() => setImportPreview(null)}
                className="text-[#65564A] hover:underline"
              >
                Đóng
              </button>
            </div>
            {importPreview.errors.length > 0 && (
              <ul className="list-disc pl-5 text-red-700 space-y-1">
                {importPreview.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
            {importPreview.warnings.length > 0 && (
              <ul className="list-disc pl-5 text-[#70452F] space-y-1">
                {importPreview.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
            {importPreview.duplicateIds.length > 0 && (
              <p className="text-[#70452F] font-medium">
                Phát hiện {importPreview.duplicateIds.length} mã trùng với dữ liệu hiện tại:{' '}
                {importPreview.duplicateIds.join(', ')}
              </p>
            )}
            {importPreview.valid && importPreview.artifacts.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => handleCommitImport(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#52624B] text-white font-medium hover:bg-[#3F4D39]"
                >
                  Chỉ nhập mã mới (bỏ qua mã trùng)
                </button>
                {importPreview.duplicateIds.length > 0 && (
                  <button
                    type="button"
                    disabled={importing}
                    onClick={() => handleCommitImport(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#70452F] text-white font-medium hover:bg-[#543220]"
                  >
                    Nhập tất cả (ghi đè mã trùng)
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Artifact Form (Create / Edit) */}
      {formOpen && form && (
        <section className="bg-white rounded-2xl border border-[#70452F]/20 shadow-sm p-6 sm:p-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#70452F]/15 pb-4">
            <div>
              <p className="text-xs font-mono text-[#70452F]">
                {isNewRecord ? 'Tạo hồ sơ mới' : 'Chỉnh sửa hồ sơ'} · {form.identifier}
              </p>
              <h2 className="font-editorial text-2xl font-semibold text-[#231B15]">
                {form.title || 'Biểu mẫu hồ sơ kỷ vật'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {liveCompleteness && (
                <span className="text-xs font-medium text-[#65564A] tabular-nums mr-2">
                  Hoàn thiện: {liveCompleteness.percentage}% (Dublin Core:{' '}
                  {liveCompleteness.dublinCoreFilled}/15)
                </span>
              )}
              <button
                type="button"
                onClick={() => setPreviewMode((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#70452F]/25 text-xs font-medium text-[#231B15] hover:bg-[#F8F4EC]"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{previewMode ? 'Quay lại nhập liệu' : 'Xem trước hồ sơ'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#70452F]/25 text-xs font-medium text-[#231B15] hover:bg-[#F8F4EC]"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In phiếu</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false);
                  setSearchParams({});
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-[#65564A] hover:bg-[#F8F4EC]"
              >
                Đóng biểu mẫu
              </button>
            </div>
          </div>

          {duplicateIdWarning && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{duplicateIdWarning}</span>
            </div>
          )}

          {formError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {formError}
            </div>
          )}

          {previewMode ? (
            <div className="space-y-6 bg-[#F8F4EC]/50 p-6 rounded-xl border border-[#70452F]/15">
              <h3 className="font-editorial text-xl font-semibold text-[#231B15]">
                Xem trước phiếu hồ sơ: {form.title || '(Chưa có tên)'} ({form.identifier})
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-[#65564A]">Loại kỷ vật</dt>
                  <dd className="font-medium">{form.artifactCategory}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#65564A]">Loại bản hiển thị</dt>
                  <dd className="font-medium">{form.displayedCopyType}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#65564A]">Niên đại & Kiểm chứng</dt>
                  <dd className="font-medium">
                    {form.date || 'Chưa cập nhật'} ({form.verificationStatus})
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#65564A]">Quyền công bố</dt>
                  <dd className="font-medium">
                    {form.permissionStatus} — {form.permissionGrantedBy || 'Chưa cập nhật'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-[#65564A]">Mô tả</dt>
                  <dd>{form.description || 'Chưa cập nhật'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-[#65564A]">Câu chuyện gia đình</dt>
                  <dd className="whitespace-pre-line">
                    {form.familyStory || 'Chưa cập nhật'}
                  </dd>
                </div>
              </dl>
              {liveCompleteness && liveCompleteness.missingFields.length > 0 && (
                <div className="text-xs text-[#70452F]">
                  <strong>Các trường còn thiếu:</strong>{' '}
                  {liveCompleteness.missingFields.join(', ')}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Group 1: 15 Dublin Core Fields */}
              <div className="space-y-4">
                <h3 className="font-editorial text-xl font-semibold text-[#231B15]">
                  Phần A. 15 trường chuẩn Dublin Core (có chú giải hướng dẫn)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {DUBLIN_CORE_FIELDS.map((field) => {
                    const isLong = field.key === 'description' || field.key === 'rights';
                    return (
                      <div
                        key={field.key}
                        className={isLong ? 'md:col-span-2' : undefined}
                      >
                        <label className="block text-xs font-semibold text-[#231B15]">
                          {field.labelVi}
                        </label>
                        <p className="text-[11px] text-[#65564A] mt-0.5 mb-1.5">
                          {field.helper}
                        </p>
                        {isLong ? (
                          <textarea
                            rows={3}
                            value={String(form[field.key] ?? '')}
                            onChange={(e) =>
                              setForm({ ...form, [field.key]: e.target.value })
                            }
                            placeholder={field.placeholder}
                            className="w-full p-2.5 rounded-lg border border-[#70452F]/25 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54]"
                          />
                        ) : (
                          <input
                            type="text"
                            readOnly={field.key === 'identifier' && !isNewRecord}
                            value={String(form[field.key] ?? '')}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                [field.key]: e.target.value,
                                ...(field.key === 'identifier'
                                  ? { registrationNumber: e.target.value }
                                  : {}),
                              })
                            }
                            placeholder={field.placeholder}
                            className={`w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59A54] ${
                              field.key === 'identifier' && !isNewRecord
                                ? 'bg-[#F8F4EC] font-mono'
                                : 'bg-white'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Physical & Conservation Fields */}
              <div className="border-t border-[#70452F]/15 pt-6 space-y-4">
                <h3 className="font-editorial text-xl font-semibold text-[#231B15]">
                  Phần B. Thông tin hiện vật, lưu giữ & kiểm chứng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Loại kỷ vật
                    </label>
                    <select
                      value={form.artifactCategory}
                      onChange={(e) =>
                        setForm({ ...form, artifactCategory: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm bg-white"
                    >
                      {ARTIFACT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Loại bản đang hiển thị
                    </label>
                    <select
                      value={form.displayedCopyType}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          displayedCopyType: e.target.value as FamilyArtifact['displayedCopyType'],
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm bg-white"
                    >
                      {DISPLAYED_COPY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Tình trạng bản gốc
                    </label>
                    <select
                      value={form.originalCondition}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          originalCondition: e.target.value as FamilyArtifact['originalCondition'],
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm bg-white"
                    >
                      {ORIGINAL_CONDITIONS.map((cond) => (
                        <option key={cond} value={cond}>
                          {cond}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Chất liệu
                    </label>
                    <input
                      type="text"
                      value={form.material}
                      onChange={(e) => setForm({ ...form, material: e.target.value })}
                      placeholder="Ví dụ: Đồng thau, giấy dó, vải lụa..."
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Kích thước (cm / mm)
                    </label>
                    <input
                      type="text"
                      value={form.dimensions}
                      onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                      placeholder="Ví dụ: Dài 22 cm × Rộng 14 cm"
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Mức độ kiểm chứng thông tin
                    </label>
                    <select
                      value={form.verificationStatus}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          verificationStatus: e.target.value as FamilyArtifact['verificationStatus'],
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm bg-white"
                    >
                      {VERIFICATION_STATUSES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Nơi lưu giữ hiện tại (mức an toàn, không ghi vị trí cất giấu chi tiết)
                    </label>
                    <input
                      type="text"
                      value={form.currentStorageLocation}
                      onChange={(e) =>
                        setForm({ ...form, currentStorageLocation: e.target.value })
                      }
                      placeholder="Ví dụ: Tủ kỷ vật gia đình tại xã ..., tỉnh ..."
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Nơi lưu giữ trước đây
                    </label>
                    <input
                      type="text"
                      value={form.historicalStorageLocation}
                      onChange={(e) =>
                        setForm({ ...form, historicalStorageLocation: e.target.value })
                      }
                      placeholder="Ví dụ: Nhà thờ họ hoặc nhà cũ của ông bà"
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Mã kỷ vật liên quan (cách nhau dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={form.relatedArtifactIds.join(', ')}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          relatedArtifactIds: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Ví dụ: C03-00002, C03-00003"
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Oral History & Story */}
              <div className="border-t border-[#70452F]/15 pt-6 space-y-4">
                <h3 className="font-editorial text-xl font-semibold text-[#231B15]">
                  Phần C. Câu chuyện do người thân kể & Lịch sử tiếp nhận
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Câu chuyện gắn với kỷ vật
                    </label>
                    <textarea
                      rows={4}
                      value={form.familyStory}
                      onChange={(e) =>
                        setForm({ ...form, familyStory: e.target.value })
                      }
                      placeholder="Ghi lại trung thực lời kể của người thân, không tự thêm thắt sự kiện lịch sử..."
                      className="w-full p-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Người kể chuyện
                    </label>
                    <input
                      type="text"
                      value={form.storyTeller}
                      onChange={(e) =>
                        setForm({ ...form, storyTeller: e.target.value })
                      }
                      placeholder="Họ tên và vai trò trong gia đình"
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Ngày ghi nhận lời kể
                    </label>
                    <input
                      type="date"
                      value={form.storyRecordedDate}
                      onChange={(e) =>
                        setForm({ ...form, storyRecordedDate: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Kiểm chứng câu chuyện
                    </label>
                    <select
                      value={form.storyVerificationStatus}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          storyVerificationStatus: e.target.value as FamilyArtifact['storyVerificationStatus'],
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm bg-white"
                    >
                      {VERIFICATION_STATUSES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Lịch sử lưu truyền / Tiếp nhận trong gia đình
                    </label>
                    <input
                      type="text"
                      value={form.acquisitionHistory}
                      onChange={(e) =>
                        setForm({ ...form, acquisitionHistory: e.target.value })
                      }
                      placeholder="Ví dụ: Ông nội giữ từ năm 1979, trao lại cho con trưởng..."
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Câu hỏi còn bỏ ngỏ cần xác minh thêm
                    </label>
                    <input
                      type="text"
                      value={form.unresolvedQuestions}
                      onChange={(e) =>
                        setForm({ ...form, unresolvedQuestions: e.target.value })
                      }
                      placeholder="Những chi tiết chưa rõ..."
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Group 4: Rights & Restricted Content */}
              <div className="border-t border-[#70452F]/15 pt-6 space-y-4">
                <h3 className="font-editorial text-xl font-semibold text-[#231B15]">
                  Phần D. Quyền công bố & Đánh dấu phần không công bố
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Trạng thái quyền công bố
                    </label>
                    <select
                      value={form.permissionStatus}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          permissionStatus: e.target.value as FamilyArtifact['permissionStatus'],
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm bg-white"
                    >
                      {PERMISSION_STATUSES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Người cho phép công bố
                    </label>
                    <input
                      type="text"
                      value={form.permissionGrantedBy}
                      onChange={(e) =>
                        setForm({ ...form, permissionGrantedBy: e.target.value })
                      }
                      placeholder="Họ tên người có quyền đồng ý"
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Vai trò của người cho phép
                    </label>
                    <input
                      type="text"
                      value={form.permissionRole}
                      onChange={(e) =>
                        setForm({ ...form, permissionRole: e.target.value })
                      }
                      placeholder="Ví dụ: Chủ sở hữu / Người đang giữ"
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Ngày đồng ý
                    </label>
                    <input
                      type="date"
                      value={form.permissionDate}
                      onChange={(e) =>
                        setForm({ ...form, permissionDate: e.target.value })
                      }
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Phạm vi đồng ý
                    </label>
                    <input
                      type="text"
                      value={form.permissionScope}
                      onChange={(e) =>
                        setForm({ ...form, permissionScope: e.target.value })
                      }
                      placeholder="Ví dụ: Công bố ảnh mặt trước và câu chuyện tóm tắt"
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#231B15] mb-1">
                      Phần nội dung bị hạn chế (không công khai)
                    </label>
                    <input
                      type="text"
                      value={form.restrictedContent}
                      onChange={(e) =>
                        setForm({ ...form, restrictedContent: e.target.value })
                      }
                      placeholder="Ghi chú phần riêng tư không hiển thị công khai"
                      className="w-full h-10 px-3 rounded-lg border border-[#70452F]/25 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Group 5: Real Photo Uploader */}
              <div className="border-t border-[#70452F]/15 pt-6 space-y-4">
                <div>
                  <h3 className="font-editorial text-xl font-semibold text-[#231B15]">
                    Phần E. Tải ảnh kỷ vật thật nhiều góc chụp ({form.imageFiles.length} ảnh)
                  </h3>
                  <p className="text-xs text-[#70452F] mt-1">
                    Nguyên tắc an toàn: Không bắt buộc di chuyển hoặc lật hiện vật nếu có nguy cơ hư hại. Ảnh gốc được giữ nguyên tách biệt; hệ thống tạo bản hiển thị dưới 500 KB đặt tên theo mẫu {form.identifier}-anh-01.jpg.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8F4EC] border border-[#70452F]/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-[#231B15] mb-1">
                      Góc chụp ảnh
                    </label>
                    <select
                      value={selectedAngle}
                      onChange={(e) => setSelectedAngle(e.target.value as PhotoAngle)}
                      className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                    >
                      {PHOTO_ANGLES.map((ang) => (
                        <option key={ang} value={ang}>
                          {ang}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-[#231B15] mb-1">
                      Chú thích ảnh
                    </label>
                    <input
                      type="text"
                      value={photoCaption}
                      onChange={(e) => setPhotoCaption(e.target.value)}
                      placeholder="Mô tả góc chụp thực tế..."
                      className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#231B15] mb-1">
                      Người chụp / Nguồn ảnh
                    </label>
                    <input
                      type="text"
                      value={photoSource}
                      onChange={(e) => setPhotoSource(e.target.value)}
                      placeholder="Họ tên người chụp"
                      className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#231B15] mb-1">
                      Ngày chụp
                    </label>
                    <input
                      type="date"
                      value={photoDate}
                      onChange={(e) => setPhotoDate(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#231B15] mb-1">
                      Quyền sử dụng ảnh
                    </label>
                    <input
                      type="text"
                      value={photoPermission}
                      onChange={(e) => setPhotoPermission(e.target.value)}
                      placeholder="Ví dụ: Được phép trưng bày phi lợi nhuận"
                      className="w-full h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                    />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs text-[#231B15] cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={photoPublicPermitted}
                        onChange={(e) => setPhotoPublicPermitted(e.target.checked)}
                      />
                      <span>Cho phép ảnh này hiển thị công khai</span>
                    </label>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#70452F] text-white text-xs font-medium hover:bg-[#543220] cursor-pointer">
                      <ImagePlus className="w-4 h-4" />
                      <span>
                        {uploadingPhoto
                          ? 'Đang lưu ảnh gốc & nén bản hiển thị...'
                          : 'Chọn ảnh thật từ thiết bị'}
                      </span>
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingPhoto}
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {form.imageFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {form.imageFiles.map((img, idx) => (
                      <div
                        key={img.id}
                        className="rounded-xl border border-[#70452F]/15 overflow-hidden bg-white flex flex-col"
                      >
                        <img
                          src={img.displayDataUrl}
                          alt={img.caption}
                          className="aspect-[4/3] w-full object-cover"
                        />
                        <div className="p-3 space-y-1.5 text-xs flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <p className="font-mono text-[#70452F]">{img.fileName}</p>
                            <p className="font-medium text-[#231B15]">{img.angle}</p>
                            <p className="text-[#65564A]">{img.caption}</p>
                            <p className="text-[#65564A]">
                              Gốc: {formatBytes(img.originalSizeBytes)} → Hiển thị:{' '}
                              {formatBytes(img.displaySizeBytes)}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-[#70452F]/10 flex items-center justify-between">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={img.isPermittedForPublic}
                                onChange={(e) => {
                                  const next = [...form.imageFiles];
                                  next[idx] = {
                                    ...img,
                                    isPermittedForPublic: e.target.checked,
                                  };
                                  setForm({ ...form, imageFiles: next });
                                }}
                              />
                              <span>Công khai ảnh</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(img)}
                              className="text-red-700 hover:underline"
                            >
                              Xóa ảnh
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Group 6: Artifact Reference Sources (min 2 recommended) */}
              <div className="border-t border-[#70452F]/15 pt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-editorial text-xl font-semibold text-[#231B15]">
                    Phần F. Nguồn đối chiếu của kỷ vật ({form.referenceSources.length} / tối thiểu 2 nguồn)
                  </h3>
                  {form.referenceSources.length < 2 && (
                    <span className="text-xs font-medium text-[#70452F]">
                      Cần tối thiểu 2 nguồn thông tin có thể truy xuất hoặc đối chiếu
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-[#F8F4EC] border border-[#70452F]/15 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <input
                    type="text"
                    value={srcName}
                    onChange={(e) => setSrcName(e.target.value)}
                    placeholder="Tên nguồn (ví dụ: Phiếu phỏng vấn ông A)"
                    className="h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                  />
                  <select
                    value={srcType}
                    onChange={(e) => setSrcType(e.target.value)}
                    className="h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                  >
                    <option value="Khảo sát gia đình">Khảo sát gia đình</option>
                    <option value="Phỏng vấn">Phỏng vấn người thân</option>
                    <option value="Văn bản chính thống">Văn bản chính thống</option>
                    <option value="Sách / Tài liệu">Sách / Tài liệu</option>
                  </select>
                  <input
                    type="text"
                    value={srcAuthor}
                    onChange={(e) => setSrcAuthor(e.target.value)}
                    placeholder="Tác giả / Người cung cấp"
                    className="h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                  />
                  <input
                    type="date"
                    value={srcDate}
                    onChange={(e) => setSrcDate(e.target.value)}
                    className="h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                  />
                  <input
                    type="text"
                    value={srcUrl}
                    onChange={(e) => setSrcUrl(e.target.value)}
                    placeholder="URL hoặc mã tài liệu đối chiếu"
                    className="h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                  />
                  <input
                    type="text"
                    value={srcVerified}
                    onChange={(e) => setSrcVerified(e.target.value)}
                    placeholder="Phần nội dung được nguồn xác nhận"
                    className="h-9 px-2.5 rounded-lg bg-white border border-[#70452F]/25"
                  />
                  <textarea
                    rows={2}
                    value={srcExtractedText}
                    onChange={(e) => setSrcExtractedText(e.target.value)}
                    placeholder="Văn bản trích trực tiếp từ nguồn (dán đoạn trích thực tế từ trang nguồn để đối chiếu trước khi xác nhận)..."
                    className="sm:col-span-3 p-2.5 rounded-lg bg-white border border-[#70452F]/25"
                  />
                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddSourceToArtifact}
                      className="px-3.5 py-2 rounded-lg bg-[#52624B] text-white font-medium hover:bg-[#3F4D39]"
                    >
                      + Gắn nguồn này vào hồ sơ
                    </button>
                  </div>
                </div>

                {form.referenceSources.length > 0 && (
                  <ul className="space-y-2 text-xs">
                    {form.referenceSources.map((s) => (
                      <li
                        key={s.id}
                        className="p-3 rounded-lg border border-[#70452F]/15 flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[#231B15]">
                            {s.sourceName}
                          </span>{' '}
                          · {s.sourceType} · {s.authorOrProvider || 'Chưa rõ'} ·{' '}
                          {s.recordedDate}
                          {s.urlOrCode && (
                            <p className="text-[#52624B] break-all">
                              URL/Mã: {s.urlOrCode}
                            </p>
                          )}
                          {s.verifiedContent && (
                            <p className="text-[#65564A]">
                              Xác nhận: {s.verifiedContent}
                            </p>
                          )}
                          {s.extractedText && (
                            <p className="text-[#231B15] bg-[#F8F4EC]/80 p-2 rounded mt-1">
                              Trích dẫn: “{s.extractedText}”
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              referenceSources: form.referenceSources.filter(
                                (item) => item.id !== s.id
                              ),
                            })
                          }
                          className="text-red-700 hover:underline"
                        >
                          Gỡ nguồn
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Save Actions */}
              <div className="border-t border-[#70452F]/15 pt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveForm(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#70452F] text-white text-sm font-medium hover:bg-[#543220] disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</span>
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveForm(true)}
                  className="px-4 py-2.5 rounded-lg border border-[#70452F]/25 bg-[#F8F4EC] text-sm font-medium text-[#70452F] hover:bg-[#EFE8DA]"
                >
                  Lưu bản nháp
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Existing Real Records List */}
      <section className="bg-white rounded-2xl border border-[#70452F]/15 overflow-hidden">
        <div className="p-6 border-b border-[#70452F]/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-editorial text-xl font-semibold text-[#231B15]">
              Danh sách hồ sơ thực tế ({realArtifacts.length})
            </h2>
            <p className="text-xs text-[#65564A]">
              Theo dõi mức độ hoàn thiện, cảnh báo thiếu nguồn hoặc chưa có quyền công bố.
            </p>
          </div>
        </div>

        {realArtifacts.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-[#65564A]">
              Chưa có hồ sơ thực tế nào được lưu. Nhấn “Tạo hồ sơ mới” để bắt đầu nhập.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#F8F4EC]/70 border-b border-[#70452F]/15 text-[#65564A]">
                  <th className="py-3 px-4 font-medium">Mã</th>
                  <th className="py-3 px-4 font-medium">Tên kỷ vật</th>
                  <th className="py-3 px-4 font-medium">Hoàn thiện</th>
                  <th className="py-3 px-4 font-medium">Quyền công bố</th>
                  <th className="py-3 px-4 font-medium">Nguồn / Ảnh</th>
                  <th className="py-3 px-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#70452F]/10">
                {realArtifacts.map((item) => {
                  const rep = evaluateArtifactCompleteness(item);
                  return (
                    <tr key={item.id} className="hover:bg-[#F8F4EC]/40">
                      <td className="py-3 px-4 font-mono text-xs text-[#70452F] whitespace-nowrap tabular-nums">
                        {item.identifier}
                        {item.isDraft ? ' (Nháp)' : ''}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#231B15] max-w-xs truncate">
                        {item.title || '(Chưa đặt tên)'}
                      </td>
                      <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                        {rep.percentage}% (DC {rep.dublinCoreFilled}/15)
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={
                            item.permissionStatus === 'Đã được phép'
                              ? 'text-[#52624B] font-medium'
                              : 'text-[#70452F]'
                          }
                        >
                          {item.permissionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 tabular-nums whitespace-nowrap text-[#65564A]">
                        {item.referenceSources.length} nguồn · {item.imageFiles.length} ảnh
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-3">
                        <Link
                          to={`/ky-vat/${encodeURIComponent(item.id)}`}
                          className="text-[#52624B] font-medium hover:underline"
                        >
                          Xem
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEditArtifact(item)}
                          className="text-[#70452F] font-medium hover:underline"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="text-red-700 font-medium hover:underline inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-[#70452F]/20 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-editorial text-xl font-semibold text-[#231B15]">
              Xác nhận xóa hồ sơ kỷ vật
            </h3>
            <p className="text-sm text-[#65564A] leading-relaxed">
              Bạn có chắc chắn muốn xóa hồ sơ{' '}
              <strong className="font-mono text-[#70452F]">
                {deleteTarget.identifier}
              </strong>{' '}
              ({deleteTarget.title || 'Chưa đặt tên'}) và các tệp ảnh lưu cục bộ? Mã định danh đã cấp sẽ không được tái sử dụng cho hồ sơ khác.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-[#70452F]/25 text-sm text-[#65564A] hover:bg-[#F8F4EC]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDeleteArtifact}
                className="px-4 py-2 rounded-lg bg-red-700 text-white text-sm font-medium hover:bg-red-800"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
