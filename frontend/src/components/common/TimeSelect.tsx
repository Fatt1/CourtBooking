import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface TimeSelectProps {
  value?: string;
  onChange?: (time: string) => void;
  label?: string;
  placeholder?: string;
  stepMinutes?: number; // Mặc định 30 phút
  startHour?: number; // Mặc định 0 giờ (00:00)
  endHour?: number; // Mặc định 24 giờ
  disabled?: boolean;
  required?: boolean;
  variant?: 'form' | 'bar';
  className?: string;
  triggerClassName?: string;
}

/**
 * Hàm sinh mảng danh sách giờ cách nhau số phút chỉ định (mặc định 30 phút)
 * Ví dụ: ['05:00', '05:30', '06:00', '06:30', ..., '23:30']
 */
export function generateTimeSlots(
  stepMinutes = 30,
  startHour = 0,
  endHour = 24
): string[] {
  const slots: string[] = [];
  const startMinute = startHour * 60;
  const endMinute = endHour * 60;

  for (let min = startMinute; min < endMinute; min += stepMinutes) {
    const hours = Math.floor(min / 60);
    const minutes = min % 60;
    const formatted = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
    slots.push(formatted);
  }

  return slots;
}

/**
 * Component lựa chọn thời gian theo bước nhảy 30 phút dùng chung
 */
export function TimeSelect({
  value,
  onChange,
  label,
  placeholder = 'Chọn giờ',
  stepMinutes = 30,
  startHour = 0,
  endHour = 24,
  disabled = false,
  required = false,
  variant = 'form',
  className,
  triggerClassName,
}: TimeSelectProps) {
  // Chuẩn hóa value (ví dụ '06:00:00' -> '06:00')
  const normalizedValue = useMemo(() => {
    if (!value) return '';
    return value.length > 5 ? value.slice(0, 5) : value;
  }, [value]);

  const timeSlots = useMemo(
    () => generateTimeSlots(stepMinutes, startHour, endHour),
    [stepMinutes, startHour, endHour]
  );

  if (variant === 'bar') {
    return (
      <div className={cn('flex flex-col justify-center', className)}>
        {label && (
          <label className="font-heading font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <Select
          value={normalizedValue}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger
            className={cn(
              'w-full h-9 border-0 bg-transparent px-0 font-semibold text-sm focus:ring-0 focus:ring-offset-0 shadow-none disabled:opacity-50 disabled:cursor-not-allowed',
              triggerClassName
            )}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-64 bg-[#0F172A] border-border text-white">
            <SelectGroup>
              {timeSlots.map((time) => (
                <SelectItem
                  key={time}
                  value={time}
                  className="cursor-pointer hover:bg-slate-800 text-xs"
                >
                  {time}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Clock className="size-3.5 text-muted-foreground" />
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </label>
      )}
      <Select
        value={normalizedValue}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            'h-11 rounded-xl bg-[#111c33] border-border/60 text-white font-mono text-sm focus:ring-[#a3e635]',
            triggerClassName
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-64 bg-[#111c33] border-border text-white font-mono">
          <SelectGroup>
            {timeSlots.map((time) => (
              <SelectItem
                key={time}
                value={time}
                className="cursor-pointer hover:bg-slate-800 text-xs"
              >
                {time}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Cụm lựa chọn Giờ mở cửa & Giờ đóng cửa (hoặc Khung giờ bắt đầu & kết thúc)
 */
export function TimeRangeSelectGroup({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  startLabel = 'Giờ mở cửa',
  endLabel = 'Giờ đóng cửa',
  stepMinutes = 30,
  startHour = 0,
  endHour = 24,
  required = false,
  disabled = false,
  variant = 'form',
  className,
}: {
  startTime?: string;
  endTime?: string;
  onStartTimeChange?: (time: string) => void;
  onEndTimeChange?: (time: string) => void;
  startLabel?: string;
  endLabel?: string;
  stepMinutes?: number;
  startHour?: number;
  endHour?: number;
  required?: boolean;
  disabled?: boolean;
  variant?: 'form' | 'bar';
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      <TimeSelect
        value={startTime}
        onChange={onStartTimeChange}
        label={startLabel}
        placeholder="Từ --:--"
        stepMinutes={stepMinutes}
        startHour={startHour}
        endHour={endHour}
        required={required}
        disabled={disabled}
        variant={variant}
      />
      <TimeSelect
        value={endTime}
        onChange={onEndTimeChange}
        label={endLabel}
        placeholder="Đến --:--"
        stepMinutes={stepMinutes}
        startHour={startHour}
        endHour={endHour}
        required={required}
        disabled={disabled}
        variant={variant}
      />
    </div>
  );
}
