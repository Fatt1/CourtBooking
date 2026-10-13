import { useState } from 'react';
import { Clock } from 'lucide-react';
import { OwnerModal } from '@/features/court-owners/components/shared';

export interface NewFixedBlockFormValues {
  startTime: string;
  endTime: string;
  selectedDays: number[]; // 1: T2, 2: T3, ..., 6: T7, 0: CN
}

interface AddFixedTimeBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NewFixedBlockFormValues) => void;
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
}: AddFixedTimeBlockModalProps) {
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([6, 0]); // Mặc định Thứ 7, CN theo ảnh

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
        {/* 1. Giờ bắt đầu & Giờ kết thúc */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Giờ bắt đầu
            </label>
            <div className="relative">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-11 rounded-xl bg-[#080E1C] dark:bg-[#080E1C] border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
              />
              <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Giờ kết thúc
            </label>
            <div className="relative">
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-11 rounded-xl bg-[#080E1C] dark:bg-[#080E1C] border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
              />
              <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
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
                    className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold select-none text-foreground hover:text-white transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDay(opt.value)}
                      className="size-4 rounded border-border/80 accent-[#a3e635] bg-[#080E1C] cursor-pointer"
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
                    className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold select-none text-foreground hover:text-white transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDay(opt.value)}
                      className="size-4 rounded border-border/80 accent-[#a3e635] bg-[#080E1C] cursor-pointer"
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
