import { useState } from 'react';
import { OwnerModal } from '@/features/court-owners/components/shared';
import { TimeSelect } from '@/components/common';

export interface NewFixedBlockFormValues {
  startTime: string;
  endTime: string;
  selectedDays: number[]; // 1: T2, 2: T3, ..., 6: T7, 0: CN
}

interface AddFixedTimeBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NewFixedBlockFormValues) => void;
  minuteConfig?: number;
  minutesConfig?: number;
}

const dayOptions = [
  { label: 'Thứ 2', value: 1 },
  { label: 'Thứ 3', value: 2 },
  { label: 'Thứ 4', value: 3 },
  { label: 'Thứ 5', value: 4 },
  { label: 'Thứ 6', value: 5 },
  { label: 'Thứ 7', value: 6 },
  { label: 'Chủ nhật', value: 0 },
];

export function AddFixedTimeBlockModal({
  open,
  onOpenChange,
  onSubmit,
  minuteConfig,
  minutesConfig,
}: AddFixedTimeBlockModalProps) {
  const stepMinutes = minuteConfig ?? minutesConfig ?? 30;
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([6, 0]); // Mặc định Thứ 7, CN

  const toggleDay = (dayVal: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const handleFormSubmit = () => {
    onSubmit({
      startTime,
      endTime,
      selectedDays,
    });
    onOpenChange(false);
  };

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm khung giờ bắt buộc"
      submitText="Thêm khung giờ"
      cancelText="Hủy"
      onSubmit={handleFormSubmit}
      maxWidth="max-w-md"
    >
      <div className="space-y-5 pt-1 text-sm">
        {/* 1. Giờ bắt đầu & Giờ kết thúc (Dùng TimeSelect dropdown) */}
        <div className="grid grid-cols-2 gap-3.5">
          <TimeSelect
            label="Giờ bắt đầu"
            value={startTime}
            onChange={setStartTime}
            stepMinutes={stepMinutes}
            startHour={0}
            endHour={24}
            required
            className="space-y-1.5"
            triggerClassName="h-11 rounded-xl bg-background border-border/80 text-foreground font-mono text-sm focus:ring-[#a3e635]"
          />

          <TimeSelect
            label="Giờ kết thúc"
            value={endTime}
            onChange={setEndTime}
            stepMinutes={stepMinutes}
            startHour={0}
            endHour={24}
            required
            className="space-y-1.5"
            triggerClassName="h-11 rounded-xl bg-background border-border/80 text-foreground font-mono text-sm focus:ring-[#a3e635]"
          />
        </div>

        {/* 2. Áp dụng các ngày */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-foreground">
            Áp dụng các ngày
          </label>
          <div className="space-y-2">
            {/* Hàng 1: T2 -> T6 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {dayOptions.slice(0, 5).map((opt) => {
                const isChecked = selectedDays.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold select-none text-foreground hover:text-foreground transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDay(opt.value)}
                      className="size-4 rounded border-border/80 accent-[#a3e635] bg-background cursor-pointer"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>

            {/* Hàng 2: T7 & CN */}
            <div className="flex items-center gap-x-4">
              {dayOptions.slice(5).map((opt) => {
                const isChecked = selectedDays.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold select-none text-foreground hover:text-foreground transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDay(opt.value)}
                      className="size-4 rounded border-border/80 accent-[#a3e635] bg-background cursor-pointer"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Dòng mô tả mờ */}
        <p className="text-xs text-muted-foreground/80 leading-relaxed pt-1">
          Khách hàng buộc phải thuê toàn bộ thời gian trong khung giờ này, không được chia nhỏ.
        </p>
      </div>
    </OwnerModal>
  );
}
