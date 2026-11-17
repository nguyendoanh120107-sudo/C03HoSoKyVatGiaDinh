import React from 'react';
import { Archive } from 'lucide-react';

interface ArtifactPlaceholderProps {
  className?: string;
  compact?: boolean;
  reason?: string;
}

export const ArtifactPlaceholder: React.FC<ArtifactPlaceholderProps> = ({
  className = '',
  compact = false,
  reason = 'Chưa xác minh quyền đăng lại hình ảnh. Vui lòng xem ảnh tại nguồn chính thức.',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-[#EFE8DA]/75 border border-[#70452F]/15 text-[#65564A] text-center select-none ${
        compact ? 'p-4' : 'p-6'
      } ${className}`}
    >
      <div className="w-11 h-11 rounded-full bg-[#F8F4EC] border border-[#70452F]/15 flex items-center justify-center mb-3 text-[#70452F]/70">
        <Archive className="w-5 h-5" aria-hidden="true" />
      </div>
      <p className="text-xs sm:text-sm font-medium text-[#543220] max-w-[24ch] leading-snug">
        {reason}
      </p>
    </div>
  );
};
