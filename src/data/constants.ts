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
  englishName: 'Family Heritage Archive',
  slogan: 'Lưu giữ kỷ vật – Kết nối thế hệ – Bảo tồn ký ức',
  projectCode: 'C03',
  ideaGroup: 'Lưu trữ gia đình, dòng họ và tổ chức cộng đồng',
  studentName: 'Nguyễn Ngọc Doanh',
  studentId: 'TH04122',
  groupNumber: '2',
  organization: 'FPT Polytechnic × IMTA TECH',
  program: 'Thực tập sinh Đợt 15',
  weeklyTopic: 'Chủ đề tuần 4: Di sản tư liệu và bảo tàng số',
  purpose:
    'Số hóa, lập hồ sơ và giới thiệu kỷ vật do gia đình lưu giữ, góp phần bảo tồn ký ức và những câu chuyện giữa các thế hệ.',
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
  'Tốt',
  'Hư hại nhẹ',
  'Hư hại nặng',
  'Không rõ',
];

export const VERIFICATION_STATUSES: VerificationStatus[] = [
  'Đã kiểm chứng',
  'Chưa kiểm chứng',
  'Chưa xác định được',
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
    labelVi: '1. Tên kỷ vật (Title)',
    dcTerm: 'dc:title',
    helper: 'Tên gọi chính thức hoặc tên thường gọi trong gia đình (ví dụ: Đồng hồ quả lắc hiệu Odo của ông nội).',
    placeholder: 'Nhập tên kỷ vật thực tế...',
  },
  {
    key: 'creator',
    labelVi: '2. Tác giả / Người tạo lập hoặc Chủ sở hữu ban đầu (Creator)',
    dcTerm: 'dc:creator',
    helper: 'Cơ quan cấp, nghệ nhân chế tác hoặc người sở hữu ban đầu trong gia đình (nếu biết).',
    placeholder: 'Ví dụ: Hãng sản xuất / Người viết nhật ký / Chưa rõ...',
  },
  {
    key: 'subject',
    labelVi: '3. Chủ đề / Từ khóa kỷ vật (Subject)',
    dcTerm: 'dc:subject',
    helper: 'Từ khóa phản ánh nội dung, giai đoạn hoặc ý nghĩa của kỷ vật (phân cách bằng dấu phẩy).',
    placeholder: 'Ví dụ: Kỷ vật gia đình, sinh hoạt thế kỷ 20, ký ức...',
  },
  {
    key: 'description',
    labelVi: '4. Mô tả tổng quan (Description)',
    dcTerm: 'dc:description',
    helper: 'Mô tả khách quan hình dáng, dấu vết, hoa văn, chữ viết khắc/in trên hiện vật.',
    placeholder: 'Mô tả chi tiết đặc điểm quan sát được của kỷ vật...',
  },
  {
    key: 'publisher',
    labelVi: '5. Đơn vị công bố / Lưu trữ số (Publisher)',
    dcTerm: 'dc:publisher',
    helper: 'Tên gia đình hoặc nhóm thực hiện hồ sơ lưu trữ số.',
    placeholder: 'Ví dụ: Lưu trữ Gia đình họ ... / Dự án C03',
  },
  {
    key: 'contributor',
    labelVi: '6. Người đóng góp tư liệu (Contributor)',
    dcTerm: 'dc:contributor',
    helper: 'Những người thân đã cung cấp thông tin, hỗ trợ chụp ảnh hoặc đối chiếu ký ức.',
    placeholder: 'Ví dụ: Ông/Bà/Cô/Chú... (người cung cấp thông tin)',
  },
  {
    key: 'date',
    labelVi: '7. Niên đại / Thời gian (Date)',
    dcTerm: 'dc:date',
    helper: 'Năm hoặc khoảng thời gian tạo lập/sử dụng (ghi rõ mức độ ước lượng nếu chưa có ngày chính xác).',
    placeholder: 'Ví dụ: Khoảng năm 1978 hoặc 12/05/1984',
  },
  {
    key: 'type',
    labelVi: '8. Loại hình tư liệu (Type)',
    dcTerm: 'dc:type',
    helper: 'Phân loại theo chuẩn lưu trữ: Hiện vật vật lý, Văn bản, Hình ảnh, Kỷ vật hỗn hợp.',
    placeholder: 'Ví dụ: Hiện vật vật lý (Physical Object) / Văn bản',
  },
  {
    key: 'format',
    labelVi: '9. Định dạng vật lý & bản số (Format)',
    dcTerm: 'dc:format',
    helper: 'Chất liệu bản gốc và định dạng tệp số (ví dụ: Kim loại, giấy; ảnh số JPEG).',
    placeholder: 'Ví dụ: Đồng thau và gỗ; Bản số JPEG',
  },
  {
    key: 'identifier',
    labelVi: '10. Mã định danh (Identifier)',
    dcTerm: 'dc:identifier',
    helper: 'Mã tự động duy nhất theo mẫu C03-00001, không tái sử dụng mã đã cấp.',
    placeholder: 'C03-00001',
  },
  {
    key: 'source',
    labelVi: '11. Nguồn gốc bản gốc (Source)',
    dcTerm: 'dc:source',
    helper: 'Tóm tắt nguồn gốc xuất xứ hoặc hồ sơ khảo sát trực tiếp tại gia đình.',
    placeholder: 'Ví dụ: Hiện vật gốc lưu giữ tại tủ gia đình...',
  },
  {
    key: 'language',
    labelVi: '12. Ngôn ngữ (Language)',
    dcTerm: 'dc:language',
    helper: 'Ngôn ngữ xuất hiện trên kỷ vật (nếu có chữ viết) hoặc ngôn ngữ lập hồ sơ.',
    placeholder: 'Tiếng Việt (hoặc Không có chữ viết)',
  },
  {
    key: 'relation',
    labelVi: '13. Liên kết tư liệu liên quan (Relation)',
    dcTerm: 'dc:relation',
    helper: 'Mã các kỷ vật hoặc bộ ảnh/giấy tờ đi kèm có liên hệ trực tiếp.',
    placeholder: 'Ví dụ: Liên quan đến hồ sơ C03-00002',
  },
  {
    key: 'coverage',
    labelVi: '14. Phạm vi không gian – thời gian (Coverage)',
    dcTerm: 'dc:coverage',
    helper: 'Địa phương (tỉnh/huyện ở mức an toàn, không ghi số nhà riêng) và giai đoạn lịch sử gia đình.',
    placeholder: 'Ví dụ: Nam Định, giai đoạn 1975–1990',
  },
  {
    key: 'rights',
    labelVi: '15. Quyền sử dụng & công bố (Rights)',
    dcTerm: 'dc:rights',
    helper: 'Ghi rõ phạm vi được phép xem, trích dẫn và công bố theo thỏa thuận của người giữ kỷ vật.',
    placeholder: 'Ví dụ: Chỉ công bố phục vụ học tập và bảo tồn phi lợi nhuận',
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
      'Xuất tệp sao lưu JSON/CSV và thư mục ảnh gốc lưu tại ít nhất hai thiết bị hoặc phương tiện độc lập (ví dụ: máy tính cá nhân và ổ cứng ngoài/lưu trữ gia đình), tránh mất mát khi trình duyệt xóa bộ nhớ.',
  },
];

export const DEFAULT_FAMILY_PROFILE: FamilyArchiveProfile = {
  familyName: '',
  artifactCollectionTheme: '',
  verifiedStorageLocation: '',
  authorizingPerson: '',
  allowedScope: '',
  updatedAt: '',
};

export const INITIAL_REFERENCE_SOURCES: ReferenceSourceRegistryItem[] = [
  {
    id: 'src-dsvh',
    sourceName: 'Cục Di sản văn hóa (Bộ Văn hóa, Thể thao và Du lịch)',
    sourceType: 'Cơ quan chính thống',
    isOfficial: true,
    isPreSuggested: true,
    url: 'https://dsvh.gov.vn',
    authorOrProvider: 'Cục Di sản văn hóa',
    role: 'Cơ quan quản lý nhà nước chuyên ngành di sản',
    surveyDate: '',
    artifactName: 'Nguồn tra cứu chung về nghiệp vụ kiểm kê, bảo quản hiện vật',
    verifiedContent: 'Tham khảo thuật ngữ và nguyên tắc bảo quản di sản tư liệu (nguồn dự kiến, chưa tự khẳng định xác minh từng kỷ vật).',
    allowedScope: 'Tra cứu công khai trực tuyến',
    verificationNote: 'Nguồn tra cứu dự kiến – người lập hồ sơ cần đối chiếu cụ thể khi áp dụng cho từng hiện vật.',
    linkedArtifactIds: [],
  },
  {
    id: 'src-bvhttdl',
    sourceName: 'Cổng thông tin Bộ Văn hóa, Thể thao và Du lịch',
    sourceType: 'Cơ quan chính thống',
    isOfficial: true,
    isPreSuggested: true,
    url: 'https://bvhttdl.gov.vn',
    authorOrProvider: 'Bộ Văn hóa, Thể thao và Du lịch',
    role: 'Cơ quan chủ quản cấp Bộ',
    surveyDate: '',
    artifactName: 'Nguồn tra cứu quy định văn hóa và bảo tàng số',
    verifiedContent: 'Tra cứu văn bản, định hướng số hóa và phát huy giá trị di sản văn hóa.',
    allowedScope: 'Tra cứu công khai trực tuyến',
    verificationNote: 'Nguồn tra cứu dự kiến – không tự khẳng định đã xác minh từng kỷ vật gia đình.',
    linkedArtifactIds: [],
  },
  {
    id: 'src-vbcp',
    sourceName: 'Cơ sở dữ liệu văn bản quy phạm pháp luật Chính phủ',
    sourceType: 'Cơ quan chính thống',
    isOfficial: true,
    isPreSuggested: true,
    url: 'https://vanban.chinhphu.vn',
    authorOrProvider: 'Văn phòng Chính phủ',
    role: 'Cơ sở dữ liệu pháp luật chính thống',
    surveyDate: '',
    artifactName: 'Đối chiếu quy định về di sản, thi đua khen thưởng và lưu trữ',
    verifiedContent: 'Dùng để đối chiếu mẫu văn bằng, huân huy chương hoặc quy định lưu trữ theo từng giai đoạn.',
    allowedScope: 'Tra cứu công khai trực tuyến',
    verificationNote: 'Nguồn tra cứu dự kiến – cần ghi rõ số hiệu văn bản cụ thể khi đã đối chiếu.',
    linkedArtifactIds: [],
  },
  {
    id: 'src-congbao',
    sourceName: 'Công báo nước Cộng hòa xã hội chủ nghĩa Việt Nam',
    sourceType: 'Cơ quan chính thống',
    isOfficial: true,
    isPreSuggested: true,
    url: 'https://congbao.chinhphu.vn',
    authorOrProvider: 'Văn phòng Chính phủ',
    role: 'Ấn phẩm đăng tải văn bản chính thức',
    surveyDate: '',
    artifactName: 'Đối chiếu niên đại văn bản hành chính và quyết định liên quan',
    verifiedContent: 'Nguồn tra cứu đối chiếu mốc thời gian văn bản nếu gia đình có bằng khen hoặc giấy tờ đi kèm.',
    allowedScope: 'Tra cứu công khai trực tuyến',
    verificationNote: 'Nguồn tra cứu dự kiến – chưa tự khẳng định xác minh từng kỷ vật.',
    linkedArtifactIds: [],
  },
  {
    id: 'src-dublincore',
    sourceName: 'Dublin Core Metadata Initiative (DCMI)',
    sourceType: 'Chuẩn quốc tế',
    isOfficial: true,
    isPreSuggested: true,
    url: 'https://www.dublincore.org',
    authorOrProvider: 'Dublin Core Metadata Initiative',
    role: 'Tổ chức ban hành chuẩn siêu dữ liệu thư viện & bảo tàng',
    surveyDate: '',
    artifactName: 'Chuẩn 15 trường mô tả cốt lõi cho toàn bộ hồ sơ C03',
    verifiedContent: 'Quy chuẩn cấu trúc 15 trường Dublin Core áp dụng trong hệ thống.',
    allowedScope: 'Chuẩn mở quốc tế',
    verificationNote: 'Chuẩn kỹ thuật mô tả siêu dữ liệu – không phải nguồn chứng thực lịch sử hiện vật.',
    linkedArtifactIds: [],
  },
  {
    id: 'src-unesco',
    sourceName: 'UNESCO – Chương trình Ký ức Thế giới & Di sản Tư liệu',
    sourceType: 'Chuẩn quốc tế',
    isOfficial: true,
    isPreSuggested: true,
    url: 'https://www.unesco.org',
    authorOrProvider: 'UNESCO',
    role: 'Tổ chức Giáo dục, Khoa học và Văn hóa Liên Hợp Quốc',
    surveyDate: '',
    artifactName: 'Tham khảo hướng dẫn bảo tồn di sản tư liệu và ký ức cộng đồng',
    verifiedContent: 'Cơ sở phương pháp luận về bảo tồn di sản tư liệu phi lợi nhuận.',
    allowedScope: 'Tra cứu công khai trực tuyến',
    verificationNote: 'Nguồn tham khảo phương pháp luận dự kiến.',
    linkedArtifactIds: [],
  },
  {
    id: 'src-family-survey',
    sourceName: 'Khảo sát thực tế tại gia đình (Mẫu cần hoàn thiện)',
    sourceType: 'Khảo sát thực tế từ gia đình',
    isOfficial: false,
    isPreSuggested: true,
    url: '',
    authorOrProvider: '',
    role: '',
    surveyDate: '',
    artifactName: '',
    verifiedContent: '',
    allowedScope: '',
    verificationNote: 'Vui lòng cập nhật đầy đủ người cung cấp, vai trò, ngày khảo sát và nội dung xác nhận thực tế.',
    linkedArtifactIds: [],
  },
];

export const FIFTEEN_INTAKE_TEMPLATES: BlankIntakeTemplate[] = [
  { slotIndex: 1, suggestedCode: 'C03-00001', suggestedCategory: 'Huân chương, huy chương', suggestedTitleHint: 'Huân chương / Huy chương kỷ niệm (nếu gia đình có)' },
  { slotIndex: 2, suggestedCode: 'C03-00002', suggestedCategory: 'Giấy khen, bằng khen', suggestedTitleHint: 'Giấy khen / Bằng khen qua các thời kỳ' },
  { slotIndex: 3, suggestedCode: 'C03-00003', suggestedCategory: 'Sổ tay, nhật ký cũ', suggestedTitleHint: 'Sổ tay ghi chép hoặc nhật ký cũ' },
  { slotIndex: 4, suggestedCode: 'C03-00004', suggestedCategory: 'Đồng hồ, đèn dầu, đài radio cũ', suggestedTitleHint: 'Đồng hồ đeo tay / Đồng hồ treo tường cũ' },
  { slotIndex: 5, suggestedCode: 'C03-00005', suggestedCategory: 'Đồng hồ, đèn dầu, đài radio cũ', suggestedTitleHint: 'Đèn dầu hoặc đài radio cũ của gia đình' },
  { slotIndex: 6, suggestedCode: 'C03-00006', suggestedCategory: 'Đồ dùng sinh hoạt của ông bà', suggestedTitleHint: 'Bộ ấm chén, bình trà hoặc khay gỗ cổ' },
  { slotIndex: 7, suggestedCode: 'C03-00007', suggestedCategory: 'Đồ dùng sinh hoạt của ông bà', suggestedTitleHint: 'Vật dụng bếp / Đồ dùng sinh hoạt xưa' },
  { slotIndex: 8, suggestedCode: 'C03-00008', suggestedCategory: 'Đồ dùng sinh hoạt của ông bà', suggestedTitleHint: 'Hộp đựng, va-li hoặc rương gỗ kỷ niệm' },
  { slotIndex: 9, suggestedCode: 'C03-00009', suggestedCategory: 'Quần áo và đồ dùng kỷ niệm', suggestedTitleHint: 'Trang phục, khăn hoặc mũ kỷ niệm' },
  { slotIndex: 10, suggestedCode: 'C03-00010', suggestedCategory: 'Quần áo và đồ dùng kỷ niệm', suggestedTitleHint: 'Đồ dùng cá nhân gắn bó lâu năm' },
  { slotIndex: 11, suggestedCode: 'C03-00011', suggestedCategory: 'Vật phẩm gắn với lịch sử gia đình', suggestedTitleHint: 'Công cụ lao động hoặc đồ nghề truyền thống' },
  { slotIndex: 12, suggestedCode: 'C03-00012', suggestedCategory: 'Vật phẩm gắn với lịch sử gia đình', suggestedTitleHint: 'Kỷ vật gắn với sự kiện chuyển nhà / lập nghiệp' },
  { slotIndex: 13, suggestedCode: 'C03-00013', suggestedCategory: 'Ảnh, thư từ và giấy tờ đi kèm', suggestedTitleHint: 'Ảnh gia đình gốc kèm chú thích phía sau' },
  { slotIndex: 14, suggestedCode: 'C03-00014', suggestedCategory: 'Ảnh, thư từ và giấy tờ đi kèm', suggestedTitleHint: 'Thư tay viết cho người thân' },
  { slotIndex: 15, suggestedCode: 'C03-00015', suggestedCategory: 'Ảnh, thư từ và giấy tờ đi kèm', suggestedTitleHint: 'Giấy tờ cũ (học bạ, thẻ, sổ hộ khẩu cũ...)' },
];

export const DEMO_ARTIFACTS: FamilyArtifact[] = [
  {
    id: 'DEMO-00001',
    title: '[MINH HỌA] Chiếc đồng hồ cơ đeo tay gia đình (Dữ liệu mẫu)',
    creator: '[Mẫu minh họa] Hãng đồng hồ cơ thế kỷ 20',
    subject: 'Minh họa, Đồng hồ cũ, Ký ức gia đình',
    description:
      'Bản ghi minh họa cấu trúc hồ sơ chuẩn để người dùng xem thử giao diện tìm kiếm, chi tiết và xuất dữ liệu. Không phải hiện vật thật và không tính vào số lượng nghiệm thu.',
    publisher: 'Chế độ DEMO — Dự án C03',
    contributor: 'Chưa cập nhật (Dữ liệu minh họa)',
    date: '1982 (Minh họa)',
    type: 'Hiện vật vật lý',
    format: 'Thép không gỉ, mặt kính mica; Bản số tham khảo',
    identifier: 'DEMO-00001',
    source: 'Khảo sát minh họa trong chế độ trình diễn',
    language: 'Không có chữ viết tiếng Việt',
    relation: 'DEMO-00002',
    coverage: 'Khu vực Bắc Bộ (Minh họa)',
    rights: 'Dữ liệu minh họa giao diện, không dùng nghiệm thu',
    currentStorageLocation: 'Tủ lưu giữ gia đình (Vị trí minh họa)',
    historicalStorageLocation: 'Nhà ông bà (Minh họa)',
    displayedCopyType: 'Bản số của gốc',
    originalCondition: 'Hư hại nhẹ',
    registrationNumber: 'DEMO-00001',
    permissionGrantedBy: 'Người đại diện minh họa',
    permissionRole: 'Đại diện gia đình (Minh họa)',
    permissionDate: '2026-11-01',
    permissionScope: 'Trình diễn giao diện công khai trong chế độ DEMO',
    permissionStatus: 'Đã được phép',
    restrictedContent: 'Không công khai địa chỉ nhà riêng',
    verificationStatus: 'Chưa kiểm chứng',
    material: 'Thép không gỉ, dây da',
    dimensions: 'Đường kính mặt 34 mm (Minh họa)',
    artifactCategory: 'Đồng hồ, đèn dầu, đài radio cũ',
    familyStory:
      'Đây là đoạn kể chuyện minh họa để kiểm tra tính năng đọc câu chuyện bằng giọng nói tiếng Việt và tóm tắt qua Gemini AI. Khi sử dụng thực tế, hãy tắt chế độ DEMO và nhập câu chuyện thật do người thân kể lại.',
    storyTeller: 'Nhân vật minh họa',
    storyRecordedDate: '2026-11-01',
    storyVerificationStatus: 'Chưa kiểm chứng',
    acquisitionHistory: 'Lưu truyền trong gia đình (Minh họa)',
    digitizedBy: 'Nguyễn Ngọc Doanh',
    digitizedDate: '2026-11-01',
    imageFiles: [],
    imageCaptions: [],
    imageSources: [],
    relatedArtifactIds: ['DEMO-00002'],
    referenceSources: [
      {
        id: 'demo-src-1',
        sourceName: 'Phiếu khảo sát minh họa số 01',
        sourceType: 'Khảo sát gia đình',
        authorOrProvider: 'Mẫu minh họa',
        recordedDate: '2026-11-01',
        urlOrCode: 'DEMO-KS-01',
        verifiedContent: 'Xác nhận cấu trúc mẫu trường dữ liệu.',
        isOfficial: false,
      },
      {
        id: 'demo-src-2',
        sourceName: 'Dublin Core Metadata Initiative',
        sourceType: 'Chuẩn quốc tế',
        authorOrProvider: 'DCMI',
        recordedDate: '2026-11-01',
        urlOrCode: 'https://www.dublincore.org',
        verifiedContent: 'Tham khảo cấu trúc 15 trường mô tả.',
        isOfficial: true,
      },
    ],
    unresolvedQuestions: 'Cần xác định chính xác năm sản xuất thực tế khi nhập hồ sơ thật.',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
    isDraft: false,
    isDemo: true,
  },
  {
    id: 'DEMO-00002',
    title: '[MINH HỌA] Cuốn sổ tay ghi chép sinh hoạt (Dữ liệu mẫu)',
    creator: '[Mẫu minh họa] Thành viên gia đình',
    subject: 'Minh họa, Sổ tay, Tư liệu giấy',
    description:
      'Bản ghi minh họa cho nhóm tư liệu giấy dễ hư hại cần ưu tiên bảo quản không dùng đèn flash trực tiếp.',
    publisher: 'Chế độ DEMO — Dự án C03',
    contributor: 'Chưa cập nhật (Dữ liệu minh họa)',
    date: '1988 (Minh họa)',
    type: 'Văn bản viết tay',
    format: 'Giấy kẻ ngang, bìa carton; Bản số tham khảo',
    identifier: 'DEMO-00002',
    source: 'Khảo sát minh họa trong chế độ trình diễn',
    language: 'Tiếng Việt',
    relation: 'DEMO-00001',
    coverage: 'Khu vực Bắc Bộ (Minh họa)',
    rights: 'Dữ liệu minh họa giao diện, không dùng nghiệm thu',
    currentStorageLocation: 'Hộp bảo quản chống ẩm (Vị trí minh họa)',
    historicalStorageLocation: 'Bàn làm việc cũ (Minh họa)',
    displayedCopyType: 'Bản số của gốc',
    originalCondition: 'Hư hại nặng',
    registrationNumber: 'DEMO-00002',
    permissionGrantedBy: 'Người đại diện minh họa',
    permissionRole: 'Đại diện gia đình (Minh họa)',
    permissionDate: '2026-11-02',
    permissionScope: 'Trình diễn giao diện công khai trong chế độ DEMO',
    permissionStatus: 'Đã được phép',
    restrictedContent: 'Ẩn trang ghi tên riêng cá nhân',
    verificationStatus: 'Đã kiểm chứng',
    material: 'Giấy, mực bút máy',
    dimensions: '14.5 × 20.5 cm (Minh họa)',
    artifactCategory: 'Sổ tay, nhật ký cũ',
    familyStory:
      'Ghi chép minh họa về nếp sinh hoạt gia đình cuối thập niên 1980. Dùng để minh họa bộ lọc kỷ vật trước năm 1990 và bộ lọc cần bảo quản.',
    storyTeller: 'Nhân vật minh họa',
    storyRecordedDate: '2026-11-02',
    storyVerificationStatus: 'Đã kiểm chứng',
    acquisitionHistory: 'Lưu giữ tại tủ sách gia đình (Minh họa)',
    digitizedBy: 'Nguyễn Ngọc Doanh',
    digitizedDate: '2026-11-02',
    imageFiles: [],
    imageCaptions: [],
    imageSources: [],
    relatedArtifactIds: ['DEMO-00001'],
    referenceSources: [
      {
        id: 'demo-src-3',
        sourceName: 'Phiếu khảo sát minh họa số 02',
        sourceType: 'Khảo sát gia đình',
        authorOrProvider: 'Mẫu minh họa',
        recordedDate: '2026-11-02',
        urlOrCode: 'DEMO-KS-02',
        verifiedContent: 'Xác nhận tình trạng giấy xuống cấp trong kịch bản demo.',
        isOfficial: false,
      },
      {
        id: 'demo-src-4',
        sourceName: 'Cục Di sản văn hóa',
        sourceType: 'Cơ quan chính thống',
        authorOrProvider: 'Cục Di sản văn hóa',
        recordedDate: '2026-11-02',
        urlOrCode: 'https://dsvh.gov.vn',
        verifiedContent: 'Tham khảo hướng dẫn bảo quản tài liệu giấy.',
        isOfficial: true,
      },
    ],
    unresolvedQuestions: 'Không có (bản ghi minh họa).',
    createdAt: '2026-11-02T09:00:00.000Z',
    updatedAt: '2026-11-02T09:00:00.000Z',
    isDraft: false,
    isDemo: true,
  },
];
