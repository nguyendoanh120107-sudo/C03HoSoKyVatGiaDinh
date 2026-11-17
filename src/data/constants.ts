import rawSources from './sources.json';
import {
  ArtifactCategory,
  BlankIntakeTemplate,
  DisplayedCopyType,
  FamilyArchiveProfile,
  FamilyArtifact,
  OriginalCondition,
  PermissionStatus,
  PhotoAngle,
  ReferenceSourceRegistryItem,
  VerificationStatus,
} from '../types/artifact';

export const PROJECT_INFO = {
  appName: 'HỒ SƠ KỶ VẬT GIA ĐÌNH',
  proposedThemeName: 'KỶ VẬT VÀ KÝ ỨC CỘNG ĐỒNG BẮC NINH',
  englishName: 'Family Heritage Archive',
  slogan: 'Lưu giữ kỷ vật – Kết nối thế hệ – Bảo tồn ký ức',
  projectCode: 'C03',
  ideaGroup: 'Lưu trữ gia đình, dòng họ và tổ chức cộng đồng',
  studentName: 'Nguyễn Ngọc Doanh',
  studentId: 'TH04122',
  groupNumber: '2',
  organization: 'IMTA TECH x FPT Polytechnic',
  program: 'Thực tập sinh Đợt 15 – Tuần 4',
  weeklyTopic: 'Di sản tư liệu và bảo tàng số',
  currentWebsiteUrl: 'https://c03-ho-so-ky-vat-gia-dinh.vercel.app',
  purpose:
    'Số hóa, giới thiệu và tra cứu 15 kỷ vật hoặc hiện vật có thật gắn với ký ức gia đình, cộng đồng và đời sống văn hóa Bắc Ninh lưu giữ tại Bảo tàng Bắc Ninh.',
  scopeConfirmationNotice:
    'Đề tài được phân công chính thức là “C03 – Hồ sơ kỷ vật gia đình”. Chuyên đề “Kỷ vật và ký ức cộng đồng Bắc Ninh” (15 hiện vật tra cứu từ bộ sưu tập công khai của Bảo tàng Bắc Ninh) là phương án mở rộng tư liệu có thật đang chờ Trưởng nhóm và đơn vị hướng dẫn phê duyệt phạm vi; hệ thống không tự tuyên bố việc chuyển sang hồ sơ hiện vật bảo tàng đã được phê duyệt.',
  targetArtifactCount: 15,
};

export const ARTIFACT_CATEGORIES: ArtifactCategory[] = [
  'Huân chương, huy chương',
  'Giấy khen, bằng khen',
  'Sổ tay, nhật ký cũ',
  'Đồng hồ, đèn dầu, đài radio cũ',
  'Đồ dùng sinh hoạt của ông bà',
  'Quần áo và đồ dùng kỷ niệm',
  'Vật phẩm gắn với lịch sử gia đình',
  'Ảnh, thư từ và giấy tờ đi kèm',
  'Khác',
];

export const DISPLAYED_COPY_TYPES: DisplayedCopyType[] = [
  'Bản gốc',
  'Bản sao',
  'Bản số của gốc',
  'Bản số của sao',
];

export const ORIGINAL_CONDITIONS: OriginalCondition[] = [
  'Không rõ – nguồn chưa công bố tình trạng',
  'Tốt',
  'Hư hại nhẹ',
  'Hư hại nặng',
  'Không rõ',
];

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  'Đã xác minh',
  'Đã kiểm chứng',
  'Chưa kiểm chứng',
  'Chưa xác định',
];

export const PERMISSION_STATUSES: PermissionStatus[] = [
  'Chưa xin phép',
  'Đang chờ xác nhận',
  'Đã được phép',
  'Đã thu hồi quyền',
];

export const PHOTO_ANGLES: PhotoAngle[] = [
  'Chính diện',
  'Mặt sau',
  'Bên trái',
  'Bên phải',
  'Mặt trên',
  'Mặt dưới (nếu chụp được an toàn)',
  'Ảnh cận cảnh chi tiết',
];

export interface DublinCoreFieldMeta {
  key: keyof Pick<
    FamilyArtifact,
    | 'title'
    | 'creator'
    | 'subject'
    | 'description'
    | 'publisher'
    | 'contributor'
    | 'date'
    | 'type'
    | 'format'
    | 'identifier'
    | 'source'
    | 'language'
    | 'relation'
    | 'coverage'
    | 'rights'
  >;
  labelVi: string;
  dcTerm: string;
  helper: string;
  placeholder: string;
}

export const DUBLIN_CORE_FIELDS: DublinCoreFieldMeta[] = [
  {
    key: 'title',
    labelVi: '1. Tên hiện vật / kỷ vật (Title)',
    dcTerm: 'dc:title',
    helper: 'Tên gọi chính thức theo hồ sơ bảo tàng hoặc tên thường gọi trong gia đình.',
    placeholder: 'Nhập tên hiện vật thực tế...',
  },
  {
    key: 'creator',
    labelVi: '2. Tác giả / Người tạo lập (Creator)',
    dcTerm: 'dc:creator',
    helper: 'Cơ quan ban hành, nghệ nhân hoặc người sở hữu ban đầu; nếu nguồn không nêu ghi "Chưa xác định theo tài liệu đã tra cứu".',
    placeholder: 'Ví dụ: Chưa xác định theo tài liệu đã tra cứu',
  },
  {
    key: 'subject',
    labelVi: '3. Chủ đề / Từ khóa (Subject)',
    dcTerm: 'dc:subject',
    helper: 'Từ khóa phản ánh nội dung, nhân vật, địa danh Bắc Ninh hoặc bối cảnh lịch sử.',
    placeholder: 'Ví dụ: Kỷ vật gia đình, Bắc Ninh, thời bao cấp...',
  },
  {
    key: 'description',
    labelVi: '4. Mô tả khách quan (Description)',
    dcTerm: 'dc:description',
    helper: 'Mô tả hình dáng, kích thước, dấu vết đối chiếu từ tài liệu nguồn; không suy đoán thêm.',
    placeholder: 'Mô tả chi tiết đối chiếu theo nguồn...',
  },
  {
    key: 'publisher',
    labelVi: '5. Đơn vị công bố / Lưu trữ số (Publisher)',
    dcTerm: 'dc:publisher',
    helper: 'Đơn vị lưu giữ bản gốc và nhóm thực hiện biên mục số.',
    placeholder: 'Ví dụ: Bảo tàng Bắc Ninh / Dự án C03',
  },
  {
    key: 'contributor',
    labelVi: '6. Người đóng góp / Hiến tặng (Contributor)',
    dcTerm: 'dc:contributor',
    helper: 'Người hiến tặng hiện vật, gia đình cung cấp tư liệu hoặc người biên mục.',
    placeholder: 'Ví dụ: Ông/Bà hiến tặng; người biên mục',
  },
  {
    key: 'date',
    labelVi: '7. Niên đại và căn cứ (Date)',
    dcTerm: 'dc:date',
    helper: 'Năm hoặc giai đoạn lịch sử kèm căn cứ xác định từ nguồn.',
    placeholder: 'Ví dụ: 1988–1989 (Căn cứ: hồ sơ BTBN 1120)',
  },
  {
    key: 'type',
    labelVi: '8. Loại hình tư liệu (Type)',
    dcTerm: 'dc:type',
    helper: 'Phân loại theo chuẩn: Hiện vật vật lý, Văn bản / Hiện vật giấy, Di sản tư liệu.',
    placeholder: 'Ví dụ: Hiện vật vật lý',
  },
  {
    key: 'format',
    labelVi: '9. Định dạng vật lý & bản số (Format)',
    dcTerm: 'dc:format',
    helper: 'Chất liệu bản gốc, kích thước và trạng thái bản ghi số.',
    placeholder: 'Ví dụ: Giấy; 21 × 15 cm; Bản ghi siêu dữ liệu số',
  },
  {
    key: 'identifier',
    labelVi: '10. Mã định danh (Identifier)',
    dcTerm: 'dc:identifier',
    helper: 'Mã tự động duy nhất theo mẫu C03-00001 đến C03-00015, không tái sử dụng.',
    placeholder: 'C03-00001',
  },
  {
    key: 'source',
    labelVi: '11. Nguồn gốc & Số kiểm kê (Source)',
    dcTerm: 'dc:source',
    helper: 'Tên đơn vị lưu giữ gốc và số kiểm kê (ví dụ: BTBN 451).',
    placeholder: 'Ví dụ: Bảo tàng Bắc Ninh — Mã kiểm kê BTBN ...',
  },
  {
    key: 'language',
    labelVi: '12. Ngôn ngữ (Language)',
    dcTerm: 'dc:language',
    helper: 'Ngôn ngữ trên hiện vật (nếu có chữ viết) và ngôn ngữ hồ sơ.',
    placeholder: 'Tiếng Việt (hoặc Không có chữ viết)',
  },
  {
    key: 'relation',
    labelVi: '13. Liên kết tư liệu liên quan (Relation)',
    dcTerm: 'dc:relation',
    helper: 'Mã các hồ sơ C03 có cùng bộ sưu tập hoặc bối cảnh.',
    placeholder: 'Ví dụ: C03-00002, C03-00003',
  },
  {
    key: 'coverage',
    labelVi: '14. Phạm vi không gian – thời gian (Coverage)',
    dcTerm: 'dc:coverage',
    helper: 'Địa bàn Bắc Ninh và mốc thời gian gắn với hiện vật.',
    placeholder: 'Ví dụ: Tam Sơn, Bắc Ninh; đầu thế kỷ XX',
  },
  {
    key: 'rights',
    labelVi: '15. Quyền sử dụng & công bố (Rights)',
    dcTerm: 'dc:rights',
    helper: 'Nếu chưa có văn bản cấp phép ảnh, ghi rõ "Chưa xác minh quyền đăng lại ảnh".',
    placeholder: 'Chưa xác minh quyền đăng lại ảnh',
  },
];

export const PRESERVATION_GUIDELINES = [
  {
    title: 'Không dùng flash trực tiếp',
    detail:
      'Ánh sáng đèn flash cường độ cao làm bạc màu ảnh cũ, giòn giấy nhật ký và xuống cấp bề mặt sơn/vải cổ. Luôn chụp dưới ánh sáng tự nhiên khuếch tán hoặc đèn LED gián tiếp.',
  },
  {
    title: 'Không tự làm sạch hiện vật cũ',
    detail:
      'Không dùng hóa chất, cồn, nước tẩy hay bàn chải để cọ rửa gỉ đồng, vết ố giấy tờ hay lớp phủ tự nhiên. Việc làm sạch sai cách có thể phá hủy dấu tích lịch sử không thể phục hồi.',
  },
  {
    title: 'Không làm hỏng hoặc thay đổi bản gốc',
    detail:
      'Tuyệt đối không ép phẳng tài liệu giòn, không gỡ keo dán cũ bằng lực, không lật hoặc xoay hiện vật dễ vỡ chỉ để chụp mặt dưới khi chưa có giá đỡ an toàn.',
  },
  {
    title: 'Bảo quản tệp ảnh gốc riêng',
    detail:
      'Mỗi lần số hóa phải lưu giữ nguyên vẹn tệp ảnh gốc (không nén, không chỉnh sửa màu quá mức) tách biệt với bản tối ưu hiển thị trên web (< 500 KB).',
  },
  {
    title: 'Sao lưu dữ liệu ít nhất hai nơi',
    detail:
      'Xuất tệp sao lưu JSON/CSV và thư mục ảnh gốc lưu tại ít nhất hai thiết bị hoặc phương tiện độc lập, tránh mất mát khi trình duyệt xóa bộ nhớ.',
  },
];

export const DEFAULT_FAMILY_PROFILE: FamilyArchiveProfile = {
  familyName: 'Bộ sưu tập tư liệu công khai tại Bảo tàng Bắc Ninh (Chờ xác nhận phạm vi C03)',
  artifactCollectionTheme: 'Kỷ vật cá nhân, hiện vật đời sống, kháng chiến và di sản văn hóa Bắc Ninh',
  verifiedStorageLocation: 'Bảo tàng tỉnh Bắc Ninh (baotangbacninh.vn)',
  authorizingPerson: 'Chưa có văn bản cấp phép đăng lại ảnh riêng (chỉ dẫn nguồn siêu dữ liệu công khai)',
  allowedScope: 'Tra cứu siêu dữ liệu công khai phi lợi nhuận; không sao chép ảnh bảo tàng khi chưa có văn bản cho phép',
  updatedAt: '2026-11-17T00:10:00.000Z',
};

export const INITIAL_REFERENCE_SOURCES: ReferenceSourceRegistryItem[] =
  rawSources as ReferenceSourceRegistryItem[];

export const FIFTEEN_INTAKE_TEMPLATES: BlankIntakeTemplate[] = [
  { slotIndex: 1, suggestedCode: 'C03-00001', suggestedCategory: 'Đồ dùng sinh hoạt của ông bà', suggestedTitleHint: 'Sập gỗ gia đình đồng chí Ngô Gia Tự (BTBN 451)' },
  { slotIndex: 2, suggestedCode: 'C03-00002', suggestedCategory: 'Đồng hồ, đèn dầu, đài radio cũ', suggestedTitleHint: 'Đèn tọa đăng gia đình đồng chí Ngô Gia Tự (BTBN 452)' },
  { slotIndex: 3, suggestedCode: 'C03-00003', suggestedCategory: 'Đồ dùng sinh hoạt của ông bà', suggestedTitleHint: 'Bát ăn cơm của đồng chí Ngô Gia Tự (BTBN 819)' },
  { slotIndex: 4, suggestedCode: 'C03-00004', suggestedCategory: 'Đồ dùng sinh hoạt của ông bà', suggestedTitleHint: 'Ấm trà của gia đình đồng chí Ngô Gia Tự (BTBN 820)' },
  { slotIndex: 5, suggestedCode: 'C03-00005', suggestedCategory: 'Vật phẩm gắn với lịch sử gia đình', suggestedTitleHint: 'Ống cắm bút của đồng chí Ngô Gia Tự (BTBN 821)' },
  { slotIndex: 6, suggestedCode: 'C03-00006', suggestedCategory: 'Ảnh, thư từ và giấy tờ đi kèm', suggestedTitleHint: 'Sổ mua lương thực ông Nguyễn Khắc Hoằng (BTBN 1120)' },
  { slotIndex: 7, suggestedCode: 'C03-00007', suggestedCategory: 'Ảnh, thư từ và giấy tờ đi kèm', suggestedTitleHint: 'Quyết định động viên đồng chí Nguyễn Trung (1231)' },
  { slotIndex: 8, suggestedCode: 'C03-00008', suggestedCategory: 'Ảnh, thư từ và giấy tờ đi kèm', suggestedTitleHint: 'Thư của bác sĩ quân y Tạ Lưu (1304)' },
  { slotIndex: 9, suggestedCode: 'C03-00009', suggestedCategory: 'Ảnh, thư từ và giấy tờ đi kèm', suggestedTitleHint: 'Thẻ xã viên hợp tác xã nông nghiệp (1140)' },
  { slotIndex: 10, suggestedCode: 'C03-00010', suggestedCategory: 'Vật phẩm gắn với lịch sử gia đình', suggestedTitleHint: 'Vò sành Phù Lãng thủy lôi giả (BTBN 166)' },
  { slotIndex: 11, suggestedCode: 'C03-00011', suggestedCategory: 'Vật phẩm gắn với lịch sử gia đình', suggestedTitleHint: 'Lọ sành chống càn làng Phù Lãng (BTBN 165)' },
  { slotIndex: 12, suggestedCode: 'C03-00012', suggestedCategory: 'Vật phẩm gắn với lịch sử gia đình', suggestedTitleHint: 'Mảnh xác máy bay B.52 thứ 99 (BTBN 407)' },
  { slotIndex: 13, suggestedCode: 'C03-00013', suggestedCategory: 'Vật phẩm gắn với lịch sử gia đình', suggestedTitleHint: 'Băng đạn 20 ly tại Hạp Lĩnh (BTBN 438)' },
  { slotIndex: 14, suggestedCode: 'C03-00014', suggestedCategory: 'Đồ dùng sinh hoạt của ông bà', suggestedTitleHint: 'Chõ gốm văn hóa Đông Sơn sưu tầm năm 2022' },
  { slotIndex: 15, suggestedCode: 'C03-00015', suggestedCategory: 'Sổ tay, nhật ký cũ', suggestedTitleHint: 'Bộ mộc bản Hải Thượng y tông tâm lĩnh' },
];

export const DEMO_ARTIFACTS: FamilyArtifact[] = [
  {
    id: 'DEMO-00001',
    title: '[MINH HỌA] Mẫu thử nghiệm giao diện (Không dùng nghiệm thu)',
    creator: '[Mẫu minh họa]',
    subject: 'Minh họa giao diện',
    description:
      'Bản ghi minh họa tách biệt khỏi 15 hồ sơ thật Bảo tàng Bắc Ninh, dùng kiểm tra giao diện tìm kiếm khi cần.',
    publisher: 'Chế độ DEMO — Dự án C03',
    contributor: 'Không áp dụng',
    date: '1980 (Minh họa)',
    type: 'Hiện vật vật lý',
    format: 'Mẫu minh họa',
    identifier: 'DEMO-00001',
    source: 'Chế độ minh họa giao diện',
    language: 'Tiếng Việt',
    relation: '',
    coverage: 'Bắc Ninh (Minh họa)',
    rights: 'Dữ liệu minh họa, không dùng nghiệm thu',
    currentStorageLocation: 'Vị trí minh họa',
    historicalStorageLocation: 'Vị trí minh họa',
    displayedCopyType: 'Bản số của gốc',
    originalCondition: 'Hư hại nhẹ',
    registrationNumber: 'DEMO-00001',
    permissionGrantedBy: 'Không áp dụng (DEMO)',
    permissionRole: 'Mẫu minh họa',
    permissionDate: '2026-11-17',
    permissionScope: 'Trình diễn giao diện',
    permissionStatus: 'Đã được phép',
    restrictedContent: '',
    verificationStatus: 'Chưa kiểm chứng',
    material: 'Mẫu minh họa',
    dimensions: 'Chưa xác định',
    artifactCategory: 'Khác',
    familyStory: 'Đây là bản ghi minh họa, không tính vào số liệu nghiệm thu 15 hồ sơ thật.',
    storyTeller: 'Mẫu minh họa',
    storyRecordedDate: '2026-11-17',
    storyVerificationStatus: 'Chưa kiểm chứng',
    acquisitionHistory: 'Không áp dụng',
    digitizedBy: 'Nguyễn Ngọc Doanh',
    digitizedDate: '2026-11-17',
    imageFiles: [],
    imageCaptions: [],
    imageSources: [],
    relatedArtifactIds: [],
    referenceSources: [],
    unresolvedQuestions: '',
    createdAt: '2026-11-17T00:00:00.000Z',
    updatedAt: '2026-11-17T00:00:00.000Z',
    isDraft: false,
    isDemo: true,
  },
];
