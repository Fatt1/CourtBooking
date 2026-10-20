import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DateDmyInputProps {
  id?: string;
  label: string;
  value: string; // ISO format 'yyyy-MM-dd'
  onChange: (isoDate: string) => void;
  placeholder?: string;
}

/**
 * Chuyển từ 'yyyy-MM-dd' sang 'dd/MM/yyyy'
 */
export function isoToDmy(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return iso;
}

/**
 * Chuyển từ 'dd/MM/yyyy' sang 'yyyy-MM-dd'
 */
export function dmyToIso(dmy: string): string | null {
  if (!dmy) return null;
  const cleaned = dmy.trim().replace(/[-.]/g, '/');
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (
      !isNaN(d) &&
      !isNaN(m) &&
      !isNaN(y) &&
      y >= 1970 &&
      y <= 2100 &&
      m >= 1 &&
      m <= 12 &&
      d >= 1 &&
      d <= 31
    ) {
      const daysInMonth = new Date(y, m, 0).getDate();
      if (d <= daysInMonth) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }
  return null;
}

export const DateDmyInput: React.FC<DateDmyInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
}) => {
  const [displayText, setDisplayText] = useState(() => isoToDmy(value));
  const [hasError, setHasError] = useState(false);

  // Đồng bộ displayText khi prop value (ISO) thay đổi từ bên ngoài (ví dụ khi chọn preset)
  useEffect(() => {
    setDisplayText(isoToDmy(value));
    setHasError(false);
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value.replace(/[^\d/]/g, '');

    // Hỗ trợ tự động chèn dấu '/' khi gõ số liên tục
    if (!inputVal.includes('/') && inputVal.length > 2) {
      if (inputVal.length <= 4) {
        inputVal = `${inputVal.slice(0, 2)}/${inputVal.slice(2)}`;
      } else {
        inputVal = `${inputVal.slice(0, 2)}/${inputVal.slice(2, 4)}/${inputVal.slice(4, 8)}`;
      }
    }

    setDisplayText(inputVal);

    if (inputVal.length === 10) {
      const iso = dmyToIso(inputVal);
      if (iso) {
        setHasError(false);
        onChange(iso);
      } else {
        setHasError(true);
      }
    } else {
      setHasError(false);
    }
  };

  const handleBlur = () => {
    if (!displayText.trim()) {
      setDisplayText(isoToDmy(value));
      setHasError(false);
      return;
    }

    const iso = dmyToIso(displayText);
    if (iso) {
      setDisplayText(isoToDmy(iso));
      setHasError(false);
      onChange(iso);
    } else {
      // Nếu nhập sai ngày, hoàn tác về giá trị hợp lệ trước đó
      setDisplayText(isoToDmy(value));
      setHasError(false);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextIso = e.target.value;
    if (nextIso) {
      setDisplayText(isoToDmy(nextIso));
      setHasError(false);
      onChange(nextIso);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="text-[11px] font-semibold text-zinc-400">
          {label}
        </label>
        <span className="text-[10px] text-zinc-500 font-mono">
          ngày / tháng / năm
        </span>
      </div>

      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={displayText}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={10}
          className={`w-full h-8 px-2.5 pr-8 rounded-lg bg-[#0c1a12] border text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors font-mono tracking-wider ${
            hasError
              ? 'border-rose-500/80 focus:border-rose-500'
              : 'border-[#1a3828] focus:border-emerald-500'
          }`}
        />

        {/* Nút cuốn lịch bên phải - Chứa input date trong suốt để mở popup chọn ngày */}
        <div
          className="absolute right-1 top-1/2 -translate-y-1/2 size-6 rounded hover:bg-[#142e20] flex items-center justify-center text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer overflow-hidden"
          title="Bấm để mở lịch chọn ngày"
        >
          <CalendarIcon className="size-3.5 pointer-events-none" />
          <input
            type="date"
            value={value}
            onChange={handlePickerChange}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            tabIndex={-1}
            aria-label={`Chọn ${label.toLowerCase()} từ lịch`}
          />
        </div>
      </div>
    </div>
  );
};
