import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  Eye,
  Menu,
  Plus,
  X,
} from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { PROJECT_INFO } from '../data/constants';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isDemoMode,
    setIsDemoMode,
    isPublicPreview,
    setIsPublicPreview,
  } = useArchive();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap shrink-0 text-sm font-medium transition-colors pb-0.5 border-b-2 ${
      isActive
        ? 'text-[#70452F] border-[#C59A54]'
        : 'text-[#65564A] border-transparent hover:text-[#231B15] hover:border-[#70452F]/30'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4EC] text-[#231B15]">
      {/* Top Bar: strictly 1-row, 3-zone contract */}
      <header className="no-print sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#70452F]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark only */}
          <Link
            to="/"
            className="font-editorial text-lg sm:text-xl font-semibold tracking-tight text-[#70452F] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59A54] rounded"
          >
            Hồ Sơ Kỷ Vật Gia Đình
          </Link>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden lg:flex items-center gap-6"
          >
            <NavLink to="/" end className={navLinkClass}>
              Trang chủ
            </NavLink>
            <NavLink to="/kho-ky-vat" className={navLinkClass}>
              Kho kỷ vật
            </NavLink>
            <NavLink to="/quan-ly" className={navLinkClass}>
              Quản lý hồ sơ
            </NavLink>
            <NavLink to="/tro-ly-ai" className={navLinkClass}>
              Trợ lý AI
            </NavLink>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-expanded={dropdownOpen}
                className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 text-sm font-medium text-[#65564A] hover:text-[#231B15] transition-colors pb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59A54] rounded"
              >
                <span>Tư liệu & Pháp lý</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl border border-[#70452F]/15 shadow-lg py-2 z-50">
                  <Link
                    to="/nguon-tu-lieu"
                    className="block px-4 py-2.5 text-sm text-[#231B15] hover:bg-[#F8F4EC] transition-colors"
                  >
                    6. Nguồn tư liệu & Đối chiếu
                  </Link>
                  <Link
                    to="/quyen-va-bao-quan"
                    className="block px-4 py-2.5 text-sm text-[#231B15] hover:bg-[#F8F4EC] transition-colors"
                  >
                    7. Quyền công bố & Bảo quản
                  </Link>
                  <Link
                    to="/gioi-thieu"
                    className="block px-4 py-2.5 text-sm text-[#231B15] hover:bg-[#F8F4EC] transition-colors"
                  >
                    8. Giới thiệu & Nghiệm thu
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Primary CTA + Mobile menu button */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/quan-ly?new=1"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#70452F] text-white text-sm font-medium hover:bg-[#543220] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59A54]"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Thêm kỷ vật</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
              aria-expanded={mobileOpen}
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#70452F]/20 text-[#70452F] hover:bg-[#F8F4EC] transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#70452F]/15 bg-white px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
            {[
              { to: '/', label: '1. Trang chủ' },
              { to: '/kho-ky-vat', label: '2. Kho kỷ vật' },
              { to: '/quan-ly', label: '4. Thêm & Quản lý kỷ vật' },
              { to: '/tro-ly-ai', label: '5. Trợ lý Ký ức Gia đình (AI)' },
              { to: '/nguon-tu-lieu', label: '6. Nguồn tư liệu' },
              { to: '/quyen-va-bao-quan', label: '7. Quyền công bố & Bảo quản' },
              { to: '/gioi-thieu', label: '8. Giới thiệu dự án & Nghiệm thu' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block px-3 py-3 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-[#F8F4EC] text-[#70452F]'
                      : 'text-[#231B15] hover:bg-[#F8F4EC]/70'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="pt-3 border-t border-[#70452F]/10 flex flex-col gap-2">
              <Link
                to="/quan-ly?new=1"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#70452F] text-white text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm kỷ vật mới</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Contextual Notice Bars (Non-sticky, honest state indicators) */}
      {isDemoMode && (
        <div className="no-print bg-[#C59A54]/20 border-b border-[#C59A54]/40 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#543220]">
            <p className="font-medium">
              CHẾ ĐỘ DEMO ĐANG BẬT: Đang hiển thị dữ liệu minh họa, không dùng nghiệm thu và không tính vào số lượng hồ sơ thực tế.
            </p>
            <button
              type="button"
              onClick={() => setIsDemoMode(false)}
              className="px-3 py-1 rounded-md bg-white border border-[#70452F]/25 text-[#70452F] font-medium hover:bg-[#F8F4EC] transition-colors whitespace-nowrap"
            >
              Tắt chế độ DEMO
            </button>
          </div>
        </div>
      )}

      {isPublicPreview && (
        <div className="no-print bg-[#52624B]/15 border-b border-[#52624B]/30 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#2E3B29]">
            <p className="inline-flex items-center gap-2 font-medium">
              <Eye className="w-4 h-4 shrink-0" />
              <span>
                Đang xem ở chế độ giao diện công khai: chỉ hiển thị kỷ vật và hình ảnh đã được cấp quyền công bố, ẩn toàn bộ thông tin riêng tư.
              </span>
            </p>
            <button
              type="button"
              onClick={() => setIsPublicPreview(false)}
              className="px-3 py-1 rounded-md bg-white border border-[#52624B]/30 text-[#52624B] font-medium hover:bg-[#F8F4EC] transition-colors whitespace-nowrap"
            >
              Thoát xem trước công khai
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Clean Institutional Footer */}
      <footer className="no-print mt-16 border-t border-[#70452F]/15 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="font-editorial text-lg font-semibold text-[#70452F]">
                {PROJECT_INFO.appName}
              </p>
              <p className="text-sm text-[#65564A] leading-relaxed">
                {PROJECT_INFO.slogan}. Dự án xã hội phi lợi nhuận (Mã đề tài{' '}
                <span className="font-mono">{PROJECT_INFO.projectCode}</span>), không kinh doanh, không thu phí, không quảng cáo.
              </p>
              <p className="text-xs text-[#65564A]">
                Thực hiện: {PROJECT_INFO.studentName} ({PROJECT_INFO.studentId}) · Nhóm {PROJECT_INFO.groupNumber} · {PROJECT_INFO.organization}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#231B15]">Điều hướng 8 màn hình</p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-[#65564A]">
                <li>
                  <Link to="/" className="hover:text-[#70452F] transition-colors">
                    Trang chủ
                  </Link>
                </li>
                <li>
                  <Link to="/kho-ky-vat" className="hover:text-[#70452F] transition-colors">
                    Kho kỷ vật
                  </Link>
                </li>
                <li>
                  <Link to="/quan-ly" className="hover:text-[#70452F] transition-colors">
                    Thêm & Quản lý
                  </Link>
                </li>
                <li>
                  <Link to="/tro-ly-ai" className="hover:text-[#70452F] transition-colors">
                    Trợ lý Gemini AI
                  </Link>
                </li>
                <li>
                  <Link to="/nguon-tu-lieu" className="hover:text-[#70452F] transition-colors">
                    Nguồn tư liệu
                  </Link>
                </li>
                <li>
                  <Link to="/quyen-va-bao-quan" className="hover:text-[#70452F] transition-colors">
                    Quyền & Bảo quản
                  </Link>
                </li>
                <li>
                  <Link to="/gioi-thieu" className="hover:text-[#70452F] transition-colors">
                    Giới thiệu & Nghiệm thu
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2 text-xs text-[#65564A] leading-relaxed">
              <p className="text-sm font-semibold text-[#231B15]">Lưu trữ cục bộ & Đồng bộ</p>
              <p>
                Phiên bản cục bộ sử dụng IndexedDB để lưu giữ toàn bộ hồ sơ và ảnh gốc ngay trên trình duyệt hiện tại, chưa tự động đồng bộ giữa các thiết bị.
              </p>
              <p>
                Hãy thường xuyên sử dụng chức năng xuất JSON/CSV để sao lưu dữ liệu ít nhất tại hai nơi an toàn.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
