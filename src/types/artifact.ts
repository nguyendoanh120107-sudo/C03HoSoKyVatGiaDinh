export type DisplayedCopyType =
  | 'Bản gốc'
  | 'Bản sao'
  | 'Bản số của gốc'
  | 'Bản số của sao';

export type OriginalCondition =
  | 'Tốt'
  | 'Hư hại nhẹ'
  | 'Hư hại nặng'
  | 'Không rõ'
  | 'Không rõ – nguồn chưa công bố tình trạng';

export type VerificationStatus =
  | 'Đã xác minh'
  | 'Đã kiểm chứng'
  | 'Chưa kiểm chứng'
  | 'Chưa xác định'
  | 'Chưa xác định được';

export type PermissionStatus =
  | 'Chưa xin phép'
  | 'Đang chờ xác nhận'
  | 'Đã được phép'
  | 'Đã thu hồi quyền';

export type PhotoAngle =
  | 'Chính diện'
  | 'Mặt sau'
  | 'Bên trái'
  | 'Bên phải'
  | 'Mặt trên'
  | 'Mặt dưới (nếu chụp được an toàn)'
  | 'Ảnh cận cảnh chi tiết';

export type ArtifactCategory =
  | 'Huân chương, huy chương'
  | 'Giấy khen, bằng khen'
  | 'Sổ tay, nhật ký cũ'
  | 'Đồng hồ, đèn dầu, đài radio cũ'
  | 'Đồ dùng sinh hoạt của ông bà'
  | 'Quần áo và đồ dùng kỷ niệm'
  | 'Vật phẩm gắn với lịch sử gia đình'
  | 'Ảnh, thư từ và giấy tờ đi kèm'
  | 'Khác';

export interface ArtifactImageFile {
  id: string;
  fileName: string; // C03-00001-anh-01.jpg
  angle: PhotoAngle;
  displayDataUrl: string; // Optimized display copy (< 500KB)
  displaySizeBytes: number;
  originalImageId: string; // Stored separately in IndexedDB originalImages store
  originalFileName: string;
  originalMimeType: string;
  originalSizeBytes: number;
  width: number;
  height: number;
  caption: string;
  photographerOrSource: string;
  captureDate: string;
  usagePermission: string;
  isPermittedForPublic: boolean;
}

export interface ArtifactSourceDetail {
  id: string;
  sourceName: string;
  sourceType: string;
  authorOrProvider: string;
  recordedDate: string;
  urlOrCode: string;
  verifiedContent: string;
  isOfficial?: boolean;
  extractedText?: string;
}

export interface FamilyArtifact {
  id: string;

  // 15 Dublin Core Core Elements
  title: string;
  creator: string;
  subject: string;
  description: string;
  publisher: string;
  contributor: string;
  date: string;
  type: string;
  format: string;
  identifier: string;
  source: string;
  language: string;
  relation: string;
  coverage: string;
  rights: string;

  // Required Archival & Rights Fields
  currentStorageLocation: string;
  historicalStorageLocation: string;
  displayedCopyType: DisplayedCopyType;
  originalCondition: OriginalCondition;
  registrationNumber: string;
  permissionGrantedBy: string;
  permissionRole: string;
  permissionDate: string;
  permissionScope: string;
  permissionEvidence?: string;
  permissionStatus: PermissionStatus;
  descriptionRightsNote?: string;
  imageRightsStatus?: string;
  restrictedContent: string;
  revocationDate?: string;
  verificationStatus: VerificationStatus;

  // Specific Artifact & Oral History Fields
  material: string;
  dimensions: string;
  artifactCategory: ArtifactCategory | string;
  familyStory: string;
  storyTeller: string;
  storyRecordedDate: string;
  storyVerificationStatus: VerificationStatus;
  acquisitionHistory: string;
  digitizedBy: string;
  digitizedDate: string;
  imageFiles: ArtifactImageFile[];
  imageCaptions: string[];
  imageSources: string[];
  relatedArtifactIds: string[];
  referenceSources: ArtifactSourceDetail[];
  unresolvedQuestions: string;
  createdAt: string;
  updatedAt: string;

  // Workflow metadata
  isDraft?: boolean;
  isDemo?: boolean;
  isPackagedPublic?: boolean;
  aiDraftNotes?: string;
}

export interface FamilyArchiveProfile {
  familyName: string;
  artifactCollectionTheme: string;
  verifiedStorageLocation: string;
  authorizingPerson: string;
  allowedScope: string;
  updatedAt: string;
}

export type SourceCategory = 'A' | 'B' | 'C';

export interface ReferenceSourceRegistryItem {
  id: string;
  sourceName: string;
  sourceType: 'Cơ quan chính thống' | 'Chuẩn quốc tế' | 'Khảo sát thực tế từ gia đình' | 'Sách / Tài liệu khác';
  sourceCategory: SourceCategory;
  publisher: string;
  isOfficial: boolean;
  isVerified: boolean;
  isPreSuggested: boolean;
  url: string;
  publishedDate: string;
  accessedDate: string;
  authorOrProvider: string;
  role: string;
  surveyDate: string;
  artifactName: string;
  verifiedContent: string;
  extractedText?: string;
  allowedScope: string;
  verificationNote: string;
  linkedArtifactIds: string[];
}

export interface PermissionRegistryEntry {
  identifier: string;
  registrationNumber: string;
  custodian: string;
  rightsHolder: string;
  permissionStatus: PermissionStatus;
  descriptionRightsStatus?: string;
  imageRightsStatus: string;
  permissionScope: string;
  permissionGrantedBy?: string;
  permissionDate?: string;
  permissionEvidence?: string;
  restrictedContent: string;
  officialSourceUrl: string;
}

export interface BlankIntakeTemplate {
  slotIndex: number;
  suggestedCode: string;
  suggestedCategory: ArtifactCategory;
  suggestedTitleHint: string;
}
