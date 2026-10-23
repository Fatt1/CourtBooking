import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { OwnerModal } from '@/features/court-owners/components/shared';
import { TimeSelect } from '@/components/common';
import type { FixedBlockToEdit } from './types';

export interface NewFixedBlockFormValues {
  startTime: string;
  endTime: string;
  selectedDays: number[]; // 1: T2, 2: T3, ..., 6: T7, 0: CN
  courtIds: string[];
}

interface AddFixedTimeBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NewFixedBlockFormValues, blockId?: string) => void;
  minuteConfig?: number;
  minutesConfig?: number;
  availableCourts?: Array<{ courtId: string; courtName: string }>;
  blockToEdit?: FixedBlockToEdit | null;
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
  availableCourts = [],
  blockToEdit,
}: AddFixedTimeBlockModalProps) {
  const stepMinutes = minuteConfig ?? minutesConfig ?? 30;
  const isEditMode = Boolean(blockToEdit);

  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([6, 0]); // Mặc định Thứ 7, CN
  const [selectedCourtIds, setSelectedCourtIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (blockToEdit) {
        setStartTime(blockToEdit.startTime || '17:00');
        setEndTime(blockToEdit.endTime || '19:00');
        setSelectedDays(
          blockToEdit.selectedDays && blockToEdit.selectedDays.length > 0
            ? blockToEdit.selectedDays
            : [6, 0]
        );
        setSelectedCourtIds(blockToEdit.courtIds || []);
      } else {
        setStartTime('17:00');
        setEndTime('19:00');
        setSelectedDays([6, 0]);
        // Mặc định chọn tất cả sân để tiện lợi
        setSelectedCourtIds(availableCourts.map((c) => c.courtId));
      }
    }
  }, [open, blockToEdit, availableCourts]);

  const toggleDay = (dayVal: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const toggleCourt = (courtId: string) => {
    setSelectedCourtIds((prev) =>
      prev.includes(courtId) ? prev.filter((id) => id !== courtId) : [...prev, courtId]
    );
  };

  const handleToggleAllCourts = () => {
    if (selectedCourtIds.length === availableCourts.length) {
      setSelectedCourtIds([]);
    } else {
      setSelectedCourtIds(availableCourts.map((c) => c.courtId));
    }
  };

  const handleFormSubmit = () => {
    if (!startTime || !endTime) {
      toast.warning('Vui lòng chọn giờ bắt đầu và giờ kết thúc.');
      return;
    }
    if (startTime >= endTime) {
      toast.warning('Giờ kết thúc phải lớn hơn giờ bắt đầu.');
      return;
    }
    if (selectedDays.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một thứ trong tuần.');
      return;
    }
    if (selectedCourtIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một sân áp dụng.');
      return;
    }

    onSubmit(
      {
        startTime,
        endTime,
        selectedDays,
        courtIds: selectedCourtIds,
      },
      blockToEdit?.id
    );
    onOpenChange(false);
  };

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Chỉnh sửa khung giờ bắt buộc' : 'Thêm khung giờ bắt buộc'}
      submitText={isEditMode ? 'Cập nhật' : 'Thêm khung giờ'}
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
            Áp dụng các ngày <span className="text-destructive">*</span>
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
          {selectedDays.length === 0 && (
            <p className="text-xs text-destructive">
              Vui lòng chọn ít nhất một ngày trong tuần.
            </p>
          )}
        </div>

        {/* 3. Áp dụng các sân */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground">
              Áp dụng các sân <span className="text-destructive">*</span>
            </label>
            {availableCourts.length > 0 && (
              <button
                type="button"
                onClick={handleToggleAllCourts}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer select-none"
              >
                {selectedCourtIds.length === availableCourts.length
                  ? 'Bỏ chọn tất cả'
                  : 'Chọn tất cả'}
              </button>
            )}
          </div>

          {availableCourts.length === 0 ? (
            <div className="text-xs text-muted-foreground italic py-1">
              Loại sân này hiện chưa có sân con nào. Vui lòng thêm sân vào chi nhánh trước.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 rounded-xl border border-border/80 bg-muted/20">
              {availableCourts.map((court) => {
                const isChecked = selectedCourtIds.includes(court.courtId);
                return (
                  <label
                    key={court.courtId}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all cursor-pointer select-none text-xs font-medium ${
                      isChecked
                        ? 'border-primary/50 bg-primary/10 text-foreground font-semibold shadow-2xs'
                        : 'border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCourt(court.courtId)}
                      className="size-4 rounded border-border/80 accent-[#a3e635] bg-background cursor-pointer"
                    />
                    <span className="truncate" title={court.courtName}>
                      {court.courtName}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {availableCourts.length > 0 && selectedCourtIds.length === 0 && (
            <p className="text-xs text-destructive">
              Vui lòng chọn ít nhất một sân áp dụng.
            </p>
          )}
        </div>

        {/* 4. Dòng mô tả mờ */}
        <p className="text-xs text-muted-foreground/80 leading-relaxed pt-1 border-t border-border/40">
          Khách hàng buộc phải thuê toàn bộ thời gian trong khung giờ này, không được chia nhỏ.
        </p>
      </div>
    </OwnerModal>
  );
}
