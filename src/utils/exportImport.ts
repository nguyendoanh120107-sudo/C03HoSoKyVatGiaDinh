import {
  DESCRIPTION_RIGHTS_NOTICE,
  DUBLIN_CORE_FIELDS,
  IMAGE_RIGHTS_UNVERIFIED_NOTICE,
  PROJECT_INFO,
} from '../data/constants';
import {
  FamilyArchiveProfile,
  FamilyArtifact,
  ReferenceSourceRegistryItem,
} from '../types/artifact';
import {
  evaluateArtifactCompleteness,
  getEffectivePermissionStatus,
  hasValidPermissionEvidence,
  isArtifactPubliclyVisible,
  sanitizeArtifactForPublic,
} from './completeness';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportArtifactsToJson(
  artifacts: FamilyArtifact[],
  profile: FamilyArchiveProfile,
  includePrivateManagerData: boolean
): { count: number; filename: string } {
  const realOnly = artifacts.filter((a) => !a.isDemo);

  const exportRecords = includePrivateManagerData
    ? realOnly
    : realOnly.filter(isArtifactPubliclyVisible).map(sanitizeArtifactForPublic);

  const payload = {
    schema: 'C03-HoSoKyVatGiaDinh-v2',
    exportedAt: new Date().toISOString(),
    exportMode: includePrivateManagerData
      ? 'QUAN_LY_SAO_LUU_NOI_BO'
      : 'CONG_KHAI_CHUAN_NGUON',
    project: {
      code: PROJECT_INFO.projectCode,
      name: PROJECT_INFO.appName,
      proposedTheme: PROJECT_INFO.proposedThemeName,
      student: PROJECT_INFO.studentName,
      studentId: PROJECT_INFO.studentId,
    },
    familyProfile: profile,
    recordCount: exportRecords.length,
    artifacts: exportRecords,
  };

  const filename = `C03-HoSoKyVatGiaDinh-${todayIsoDate()}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerDownload(blob, filename);
  return { count: exportRecords.length, filename };
}

function escapeCsvCell(val: unknown): string {
  const str = String(val ?? '').replace(/\r?\n/g, ' ');
  if (str.includes(',') || str.includes('"') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportArtifactsToCsv(
  artifacts: FamilyArtifact[],
  includePrivateManagerData: boolean
): { count: number; filename: string } {
  const realOnly = artifacts.filter((a) => !a.isDemo);
  const rowsData = includePrivateManagerData
    ? realOnly
    : realOnly.filter(isArtifactPubliclyVisible).map(sanitizeArtifactForPublic);

  const dcKeys = DUBLIN_CORE_FIELDS.map((f) => f.key);
  const extraKeys: Array<keyof FamilyArtifact> = [
    'registrationNumber',
    'artifactCategory',
    'material',
    'dimensions',
    'displayedCopyType',
    'originalCondition',
    'verificationStatus',
    'currentStorageLocation',
    'historicalStorageLocation',
    'familyStory',
    'storyTeller',
    'storyRecordedDate',
    'storyVerificationStatus',
    'acquisitionHistory',
    'permissionGrantedBy',
    'permissionRole',
    'permissionDate',
    'permissionScope',
    'permissionEvidence',
    'permissionStatus',
    'descriptionRightsNote',
    'imageRightsStatus',
    'revocationDate',
    'restrictedContent',
    'digitizedBy',
    'digitizedDate',
    'unresolvedQuestions',
    'createdAt',
    'updatedAt',
  ];

  const headers = [
    ...dcKeys.map((k) => `dc_${k}`),
    ...extraKeys,
    'imageCount',
    'imageFileNames',
    'referenceSourceCount',
    'referenceSourcesSummary',
  ];

  const csvLines: string[] = [headers.join(',')];

  for (const item of rowsData) {
    const values = [
      ...dcKeys.map((k) => escapeCsvCell(item[k])),
      ...extraKeys.map((k) => escapeCsvCell(item[k])),
      escapeCsvCell(item.imageFiles.length),
      escapeCsvCell(item.imageFiles.map((i) => i.fileName).join(' | ')),
      escapeCsvCell(item.referenceSources.length),
      escapeCsvCell(
        item.referenceSources
          .map((s) => `${s.sourceName} (${s.authorOrProvider})`)
          .join(' | ')
      ),
    ];
    csvLines.push(values.join(','));
  }

  const bom = '\uFEFF';
  const filename = `C03-HoSoKyVatGiaDinh-${todayIsoDate()}.csv`;
  const blob = new Blob([bom + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  triggerDownload(blob, filename);
  return { count: rowsData.length, filename };
}

export function exportSourcesList(sources: ReferenceSourceRegistryItem[]): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    projectCode: PROJECT_INFO.projectCode,
    totalSources: sources.length,
    officialSources: sources.filter((s) => s.isOfficial).length,
    sources,
  };
  const filename = `C03-DanhSachNguon-${todayIsoDate()}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerDownload(blob, filename);
  return filename;
}

export function exportMissingFieldsReport(artifacts: FamilyArtifact[]): string {
  const realOnly = artifacts.filter((a) => !a.isDemo);
  const lines: string[] = [
    'DANH SÁCH HỒ SƠ CHƯA ĐỦ ĐIỀU KIỆN / THIẾU TRƯỜNG THÔNG TIN — DỰ ÁN C03',
    `Ngày xuất: ${new Date().toLocaleString('vi-VN')}`,
    `Tổng số hồ sơ thực tế kiểm tra: ${realOnly.length}`,
    '------------------------------------------------------------',
  ];

  for (const item of realOnly) {
    const report = evaluateArtifactCompleteness(item);
    const eligible =
      report.isDublinCoreComplete &&
      report.hasSufficientSources &&
      report.hasPermission &&
      item.imageFiles.some((i) => i.isPermittedForPublic);

    lines.push(
      `[${item.identifier}] ${item.title || '(Chưa có tên)'} — Trạng thái: ${
        eligible ? 'ĐỦ ĐIỀU KIỆN' : 'CHƯA ĐỦ ĐIỀU KIỆN'
      } (${report.percentage}%, DC: ${report.dublinCoreFilled}/15, Quyền ảnh: ${getEffectivePermissionStatus(item)})`
    );
    if (report.missingFields.length > 0) {
      lines.push(`  • Cần bổ sung / xác minh: ${report.missingFields.join(', ')}`);
    }
    lines.push('');
  }

  const filename = `C03-HoSoChuaDuDieuKien-${todayIsoDate()}.txt`;
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/plain;charset=utf-8;',
  });
  triggerDownload(blob, filename);
  return filename;
}

export function exportStatsReport(
  artifacts: FamilyArtifact[],
  profile: FamilyArchiveProfile
): string {
  const realOnly = artifacts.filter((a) => !a.isDemo);
  const withSources = realOnly.filter(
    (a) => (a.referenceSources?.length ?? 0) > 0
  );
  const permitted = realOnly.filter(
    (a) =>
      getEffectivePermissionStatus(a) === 'Đã được phép' &&
      hasValidPermissionEvidence(a)
  );
  const dcComplete = realOnly.filter(
    (a) => evaluateArtifactCompleteness(a).isDublinCoreComplete
  );
  const totalImages = realOnly.reduce((sum, a) => sum + a.imageFiles.length, 0);
  const permittedImages = realOnly.reduce(
    (sum, a) =>
      getEffectivePermissionStatus(a) === 'Đã được phép'
        ? sum + a.imageFiles.filter((i) => i.isPermittedForPublic).length
        : sum,
    0
  );
  const needConservation = realOnly.filter(
    (a) => a.originalCondition === 'Hư hại nhẹ' || a.originalCondition === 'Hư hại nặng'
  );

  const report = {
    generatedAt: new Date().toISOString(),
    project: PROJECT_INFO,
    familyProfile: profile,
    statistics: {
      totalRealArtifacts: realOnly.length,
      targetArtifacts: PROJECT_INFO.targetArtifactCount,
      artifactsWithSourcesCount: withSources.length,
      permittedForPublicCount: permitted.length,
      permittedImageArtifactsCount: permitted.length,
      dublinCoreCompleteCount: dcComplete.length,
      totalRealImagesCount: totalImages,
      permittedPublicImagesCount: permittedImages,
      needConservationCount: needConservation.length,
    },
  };

  const filename = `C03-BaoCaoThongKe-${todayIsoDate()}.json`;
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerDownload(blob, filename);
  return filename;
}

export interface ImportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  artifacts: FamilyArtifact[];
  duplicateIds: string[];
}

export function validateImportedJson(
  rawText: string,
  existingIds: Set<string>
): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const duplicateIds: string[] = [];
  const parsedArtifacts: FamilyArtifact[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      valid: false,
      errors: ['Tệp không đúng định dạng JSON hợp lệ.'],
      warnings: [],
      artifacts: [],
      duplicateIds: [],
    };
  }

  let candidateList: unknown[] = [];
  if (Array.isArray(parsed)) {
    candidateList = parsed;
  } else if (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray((parsed as { artifacts?: unknown[] }).artifacts)
  ) {
    candidateList = (parsed as { artifacts: unknown[] }).artifacts;
  } else {
    return {
      valid: false,
      errors: ['Cấu trúc JSON phải là danh sách kỷ vật hoặc đối tượng có trường "artifacts".'],
      warnings: [],
      artifacts: [],
      duplicateIds: [],
    };
  }

  if (candidateList.length === 0) {
    warnings.push('Tệp JSON không chứa bản ghi kỷ vật nào.');
  }

  for (let i = 0; i < candidateList.length; i += 1) {
    const raw = candidateList[i] as Partial<FamilyArtifact>;
    if (!raw || typeof raw !== 'object') {
      errors.push(`Bản ghi thứ ${i + 1} không phải đối tượng hợp lệ.`);
      continue;
    }
    if (raw.isDemo) {
      warnings.push(`Bỏ qua bản ghi DEMO (${raw.identifier ?? i + 1}) vì không nhập dữ liệu minh họa vào kho thật.`);
      continue;
    }
    if (!raw.identifier || typeof raw.identifier !== 'string') {
      errors.push(`Bản ghi thứ ${i + 1} thiếu mã định danh (identifier).`);
      continue;
    }
    if (!raw.title || typeof raw.title !== 'string') {
      warnings.push(`Bản ghi ${raw.identifier} chưa có tên kỷ vật (title).`);
    }
    if (existingIds.has(raw.identifier)) {
      duplicateIds.push(raw.identifier);
    }

    const normalized: FamilyArtifact = {
      id: raw.identifier,
      title: raw.title ?? '',
      creator: raw.creator ?? '',
      subject: raw.subject ?? '',
      description: raw.description ?? '',
      publisher: raw.publisher ?? '',
      contributor: raw.contributor ?? '',
      date: raw.date ?? '',
      type: raw.type ?? 'Hiện vật vật lý',
      format: raw.format ?? '',
      identifier: raw.identifier,
      source: raw.source ?? '',
      language: raw.language ?? 'Tiếng Việt',
      relation: raw.relation ?? '',
      coverage: raw.coverage ?? '',
      rights: raw.rights ?? '',
      currentStorageLocation: raw.currentStorageLocation ?? '',
      historicalStorageLocation: raw.historicalStorageLocation ?? '',
      displayedCopyType: raw.displayedCopyType ?? 'Bản số của gốc',
      originalCondition: raw.originalCondition ?? 'Không rõ – nguồn chưa công bố tình trạng',
      registrationNumber: raw.registrationNumber ?? raw.identifier,
      permissionGrantedBy: raw.permissionGrantedBy ?? '',
      permissionRole: raw.permissionRole ?? '',
      permissionDate: raw.permissionDate ?? '',
      permissionScope: raw.permissionScope ?? '',
      permissionEvidence: raw.permissionEvidence ?? '',
      permissionStatus: raw.permissionStatus ?? 'Chưa xin phép',
      descriptionRightsNote:
        raw.descriptionRightsNote ?? DESCRIPTION_RIGHTS_NOTICE,
      imageRightsStatus:
        raw.imageRightsStatus ?? IMAGE_RIGHTS_UNVERIFIED_NOTICE,
      restrictedContent: raw.restrictedContent ?? '',
      revocationDate: raw.revocationDate ?? '',
      verificationStatus: raw.verificationStatus ?? 'Chưa kiểm chứng',
      material: raw.material ?? '',
      dimensions: raw.dimensions ?? '',
      artifactCategory: raw.artifactCategory ?? 'Khác',
      familyStory: raw.familyStory ?? '',
      storyTeller: raw.storyTeller ?? '',
      storyRecordedDate: raw.storyRecordedDate ?? '',
      storyVerificationStatus: raw.storyVerificationStatus ?? 'Chưa kiểm chứng',
      acquisitionHistory: raw.acquisitionHistory ?? '',
      digitizedBy: raw.digitizedBy ?? '',
      digitizedDate: raw.digitizedDate ?? '',
      imageFiles: Array.isArray(raw.imageFiles) ? raw.imageFiles : [],
      imageCaptions: Array.isArray(raw.imageCaptions) ? raw.imageCaptions : [],
      imageSources: Array.isArray(raw.imageSources) ? raw.imageSources : [],
      relatedArtifactIds: Array.isArray(raw.relatedArtifactIds) ? raw.relatedArtifactIds : [],
      referenceSources: Array.isArray(raw.referenceSources) ? raw.referenceSources : [],
      unresolvedQuestions: raw.unresolvedQuestions ?? '',
      createdAt: raw.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDraft: Boolean(raw.isDraft),
      isDemo: false,
      aiDraftNotes: raw.aiDraftNotes ?? '',
    };
    parsedArtifacts.push(normalized);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    artifacts: parsedArtifacts,
    duplicateIds,
  };
}
