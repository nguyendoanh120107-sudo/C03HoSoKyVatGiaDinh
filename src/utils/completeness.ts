import { DUBLIN_CORE_FIELDS } from '../data/constants';
import { FamilyArtifact, PermissionStatus } from '../types/artifact';

const UNVERIFIED_PLACEHOLDER_PATTERNS = [
  'chưa cập nhật',
  'chưa có văn bản',
  'chưa xác nhận',
  'chưa xác minh',
  'không áp dụng',
  'demo',
];

function isRealNonPlaceholderText(value?: string | null): boolean {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  return !UNVERIFIED_PLACEHOLDER_PATTERNS.some((p) => lower.includes(p));
}

export function hasValidPermissionEvidence(artifact: FamilyArtifact): boolean {
  return (
    isRealNonPlaceholderText(artifact.permissionGrantedBy) &&
    isRealNonPlaceholderText(artifact.permissionDate) &&
    isRealNonPlaceholderText(artifact.permissionScope) &&
    isRealNonPlaceholderText(artifact.permissionEvidence)
  );
}

export function getEffectivePermissionStatus(
  artifact: FamilyArtifact
): PermissionStatus {
  if (
    artifact.permissionStatus === 'Đã được phép' &&
    !hasValidPermissionEvidence(artifact)
  ) {
    return 'Chưa xin phép';
  }
  return artifact.permissionStatus;
}

export function getPrimarySourceInfo(artifact: FamilyArtifact): {
  custodian: string;
  registrationNumber: string;
  sourceUrl: string;
} {
  const firstRefUrl = artifact.referenceSources.find((s) =>
    s.urlOrCode?.trim().startsWith('http')
  )?.urlOrCode;
  const fallbackImgSource = artifact.imageSources.find((u) =>
    u?.trim().startsWith('http')
  );
  return {
    custodian: artifact.currentStorageLocation?.trim() || 'Chưa cập nhật',
    registrationNumber: artifact.registrationNumber?.trim() || artifact.identifier,
    sourceUrl:
      firstRefUrl ||
      fallbackImgSource ||
      'https://www.baotangbacninh.vn/ds-hien-vat',
  };
}

export interface CompletenessReport {
  dublinCoreFilled: number;
  dublinCoreTotal: number;
  isDublinCoreComplete: boolean;
  overallFilled: number;
  overallTotal: number;
  percentage: number;
  missingFields: string[];
  hasSufficientSources: boolean;
  hasPermission: boolean;
  needsConservation: boolean;
}

const REQUIRED_EXTENDED_LABELS: Array<{ key: keyof FamilyArtifact; label: string }> = [
  { key: 'material', label: 'Chất liệu' },
  { key: 'dimensions', label: 'Kích thước' },
  { key: 'artifactCategory', label: 'Loại kỷ vật' },
  { key: 'currentStorageLocation', label: 'Nơi lưu giữ hiện nay' },
  { key: 'displayedCopyType', label: 'Loại bản hiển thị' },
  { key: 'originalCondition', label: 'Tình trạng bản gốc' },
  { key: 'familyStory', label: 'Câu chuyện / giá trị lịch sử' },
  { key: 'storyTeller', label: 'Người cung cấp / nguồn kể chuyện' },
  { key: 'permissionGrantedBy', label: 'Người cho phép công bố' },
  { key: 'permissionScope', label: 'Phạm vi được phép sử dụng' },
];

export function evaluateArtifactCompleteness(artifact: FamilyArtifact): CompletenessReport {
  const missingFields: string[] = [];

  let dcFilled = 0;
  for (const field of DUBLIN_CORE_FIELDS) {
    const val = String(artifact[field.key] ?? '').trim();
    if (
      val.length > 0 &&
      val.toLowerCase() !== 'chưa cập nhật' &&
      !val.toLowerCase().includes('chưa xác định theo tài liệu')
    ) {
      dcFilled += 1;
    } else {
      missingFields.push(field.labelVi);
    }
  }

  let extFilled = 0;
  for (const item of REQUIRED_EXTENDED_LABELS) {
    const val = String(artifact[item.key] ?? '').trim();
    if (
      val.length > 0 &&
      val.toLowerCase() !== 'chưa cập nhật' &&
      !val.toLowerCase().includes('chưa xác định theo tài liệu') &&
      !val.toLowerCase().includes('không rõ – nguồn chưa công bố') &&
      !val.toLowerCase().includes('chưa có văn bản xác nhận')
    ) {
      extFilled += 1;
    } else {
      missingFields.push(item.label);
    }
  }

  const hasSources = (artifact.referenceSources?.length ?? 0) >= 2;
  if (!hasSources) {
    missingFields.push('Tối thiểu 2 nguồn đối chiếu');
  }

  const hasPermission =
    artifact.permissionStatus === 'Đã được phép' &&
    hasValidPermissionEvidence(artifact);

  const hasPermittedImages =
    hasPermission &&
    artifact.imageFiles.some((img) => img.isPermittedForPublic);
  if (!hasPermittedImages) {
    missingFields.push('Bằng chứng & ảnh thật được phép công bố');
  }

  const totalItems = DUBLIN_CORE_FIELDS.length + REQUIRED_EXTENDED_LABELS.length + 2;
  const filledItems =
    dcFilled + extFilled + (hasSources ? 1 : 0) + (hasPermittedImages ? 1 : 0);
  const percentage = Math.round((filledItems / totalItems) * 100);

  return {
    dublinCoreFilled: dcFilled,
    dublinCoreTotal: DUBLIN_CORE_FIELDS.length,
    isDublinCoreComplete: dcFilled === DUBLIN_CORE_FIELDS.length,
    overallFilled: filledItems,
    overallTotal: totalItems,
    percentage,
    missingFields,
    hasSufficientSources: hasSources,
    hasPermission,
    needsConservation:
      artifact.originalCondition === 'Hư hại nhẹ' ||
      artifact.originalCondition === 'Hư hại nặng',
  };
}

export function isArtifactPubliclyVisible(artifact: FamilyArtifact): boolean {
  if (artifact.isDraft || artifact.permissionStatus === 'Đã thu hồi quyền') {
    return false;
  }
  if (getEffectivePermissionStatus(artifact) === 'Đã được phép') {
    return true;
  }
  // Verified public museum metadata records are visible for catalog inspection (without unpermitted photos!)
  return (
    Boolean(artifact.isPackagedPublic) &&
    (artifact.verificationStatus === 'Đã xác minh' ||
      artifact.verificationStatus === 'Đã kiểm chứng')
  );
}

export function getPublicPermittedImages(artifact: FamilyArtifact) {
  if (getEffectivePermissionStatus(artifact) !== 'Đã được phép') {
    return [];
  }
  return artifact.imageFiles.filter((img) => img.isPermittedForPublic);
}

export function sanitizeArtifactForPublic(artifact: FamilyArtifact): FamilyArtifact {
  const permittedImages = getPublicPermittedImages(artifact);
  const hasRestricted = Boolean(artifact.restrictedContent?.trim());

  return {
    ...artifact,
    currentStorageLocation:
      artifact.permissionStatus !== 'Đã thu hồi quyền'
        ? artifact.currentStorageLocation || 'Chưa cập nhật'
        : 'Thông tin hạn chế công bố',
    restrictedContent: hasRestricted
      ? 'Đã ẩn nội dung hạn chế theo yêu cầu quyền sử dụng'
      : '',
    imageFiles: permittedImages,
    imageCaptions: permittedImages.map((img) => img.caption),
    imageSources: permittedImages.map((img) => img.photographerOrSource),
  };
}

export function sanitizeArtifactsForGemini(artifacts: FamilyArtifact[]) {
  return artifacts
    .filter((a) => isArtifactPubliclyVisible(a))
    .map((a) => ({
      identifier: a.identifier,
      title: a.title || 'Chưa cập nhật',
      creator: a.creator || 'Chưa xác định theo tài liệu đã tra cứu',
      subject: a.subject || 'Chưa cập nhật',
      description: a.description || 'Chưa cập nhật',
      date: a.date || 'Chưa cập nhật',
      type: a.type || 'Chưa cập nhật',
      material: a.material || 'Chưa xác định theo tài liệu đã tra cứu',
      dimensions: a.dimensions || 'Chưa xác định theo tài liệu đã tra cứu',
      artifactCategory: a.artifactCategory || 'Chưa cập nhật',
      originalCondition: a.originalCondition,
      displayedCopyType: a.displayedCopyType,
      currentStorageLocation: a.currentStorageLocation || 'Chưa cập nhật',
      historicalStorageLocation: a.historicalStorageLocation || 'Chưa cập nhật',
      familyStory: a.familyStory || 'Chưa cập nhật',
      storyTeller: a.storyTeller || 'Chưa cập nhật',
      storyRecordedDate: a.storyRecordedDate || 'Chưa cập nhật',
      storyVerificationStatus: a.storyVerificationStatus,
      acquisitionHistory: a.acquisitionHistory || 'Chưa cập nhật',
      permissionStatus: a.permissionStatus,
      permissionScope: a.permissionScope || 'Chưa cập nhật',
      verificationStatus: a.verificationStatus,
      unresolvedQuestions: a.unresolvedQuestions || 'Không có',
      sourcesSummary:
        a.referenceSources.length > 0
          ? a.referenceSources
              .map(
                (s) =>
                  `${s.sourceName} (${s.sourceType}${s.urlOrCode ? ` - ${s.urlOrCode}` : ''})`
              )
              .join('; ')
          : a.source || 'Chưa cập nhật nguồn đối chiếu',
    }));
}

export function extractYearFromDateText(dateText: string): number | null {
  const match = /\b(18\d{2}|19\d{2}|20\d{2})\b/.exec(dateText);
  return match ? parseInt(match[1], 10) : null;
}

export function displayOrPlaceholder(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'Chưa cập nhật';
}
