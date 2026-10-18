import { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { OwnerModal } from '@/features/court-owners/components/shared';
import { TimeSelect } from '@/components/common';

export interface NewPriceRuleFormValues {
  priceTableId: string;
  startTime: string;
  endTime: string;
  selectedDays: number[]; // 1: T2, 2: T3, ..., 6: T7, 0: CN
  startDate: string;
  endDate: string;
  fixedPrice: number;
  walkInPrice: number;
  unitMinutes: number;
  unitLabel: string;
  minBookingMinutes: number;
}

export interface PriceRuleToEdit {
  ruleId: string;
  priceTableId: string;
  startTime: string;
  endTime: string;
  selectedDays: number[];
  startDate?: string;
  endDate?: string;
  fixedPrice: number;
  walkInPrice: number;
  unitMinutes?: number;
  unitLabel?: string;
  minBookingMinutes?: number;
}

interface AddPriceRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availablePriceTables: Array<{ id: string; name: string }>;
  defaultPriceTableId?: string;
  ruleToEdit?: PriceRuleToEdit | null;
  onSubmit: (values: NewPriceRuleFormValues, ruleId?: string) => void;
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

export function AddPriceRuleModal({
  open,
  onOpenChange,
  availablePriceTables,
  defaultPriceTableId,
  ruleToEdit,
  onSubmit,
}: AddPriceRuleModalProps) {
  const isEditing = Boolean(ruleToEdit);

  const [priceTableId, setPriceTableId] = useState<string>(
    ruleToEdit?.priceTableId || defaultPriceTableId || availablePriceTables[0]?.id || ''
  );
  const [startTime, setStartTime] = useState<string>('06:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([6, 0]); // Mặc định Thứ 7, CN
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [fixedPrice, setFixedPrice] = useState<number>(100000);
  const [walkInPrice, setWalkInPrice] = useState<number>(120000);
  const [unitMinutes, setUnitMinutes] = useState<number>(60);
  const [unitLabel, setUnitLabel] = useState<string>('h');
  const [minBookingMinutes, setMinBookingMinutes] = useState<number>(60);

  // Đồng bộ dữ liệu khi mở modal hoặc thay đổi chế độ tạo/sửa
  useEffect(() => {
    if (open) {
      if (ruleToEdit) {
        setPriceTableId(ruleToEdit.priceTableId || availablePriceTables[0]?.id || '');
        setStartTime(ruleToEdit.startTime || '06:00');
        setEndTime(ruleToEdit.endTime || '12:00');
        setSelectedDays(ruleToEdit.selectedDays?.length ? ruleToEdit.selectedDays : [1, 2, 3, 4, 5]);
        setStartDate(ruleToEdit.startDate || '');
        setEndDate(ruleToEdit.endDate || '');
        setFixedPrice(ruleToEdit.fixedPrice ?? 100000);
        setWalkInPrice(ruleToEdit.walkInPrice ?? 120000);
        setUnitMinutes(ruleToEdit.unitMinutes ?? 60);
        setUnitLabel(ruleToEdit.unitLabel ?? 'h');
        setMinBookingMinutes(ruleToEdit.minBookingMinutes ?? 60);
      } else {
        // Mode tạo mới: reset về mặc định và chọn đúng ID bảng giá thật
        const validDefaultId =
          defaultPriceTableId && availablePriceTables.some((t) => t.id === defaultPriceTableId)
            ? defaultPriceTableId
            : availablePriceTables[0]?.id || '';

        setPriceTableId(validDefaultId);
        setStartTime('06:00');
        setEndTime('12:00');
        setSelectedDays([6, 0]);
        setStartDate('');
        setEndDate('');
        setFixedPrice(100000);
        setWalkInPrice(120000);
        setUnitMinutes(60);
        setUnitLabel('h');
        setMinBookingMinutes(60);
      }
    }
  }, [open, ruleToEdit, availablePriceTables, defaultPriceTableId]);

  const toggleDay = (dayVal: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const handleFormSubmit = () => {
    // Đảm bảo priceTableId hợp lệ
    const targetTableId =
      priceTableId || availablePriceTables[0]?.id || defaultPriceTableId || '';

    onSubmit(
      {
        priceTableId: targetTableId,
        startTime,
        endTime,
        selectedDays,
        startDate,
        endDate,
        fixedPrice,
        walkInPrice,
        unitMinutes,
        unitLabel,
        minBookingMinutes,
      },
      ruleToEdit?.ruleId
    );
    onOpenChange(false);
  };

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Chỉnh sửa khung giờ giá' : 'Thêm khung giờ giá'}
      submitText={isEditing ? 'Lưu thay đổi' : 'Lưu cấu hình'}
      cancelText="Hủy"
      onSubmit={handleFormSubmit}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4.5 pt-1 text-sm">
        {/* 1. Thuộc bảng giá */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Thuộc bảng giá
          </label>
          <div className="relative">
            <select
              value={priceTableId}
              onChange={(e) => setPriceTableId(e.target.value)}
              disabled={isEditing}
              className="w-full h-11 rounded-xl bg-background border border-border/80 px-3.5 text-sm text-foreground appearance-none pr-10 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {availablePriceTables.map((tbl) => (
                <option key={tbl.id} value={tbl.id} className="bg-popover text-popover-foreground">
                  {tbl.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* 2. Khung giờ bắt đầu & kết thúc (Dùng TimeSelect dropdown) */}
        <div className="grid grid-cols-2 gap-3.5">
          <TimeSelect
            label="Khung giờ bắt đầu"
            value={startTime}
            onChange={setStartTime}
            stepMinutes={30}
            startHour={0}
            endHour={24}
            required
            className="space-y-1.5"
            triggerClassName="h-11 rounded-xl bg-background border-border/80 text-foreground font-mono text-sm focus:ring-[#a3e635]"
          />

          <TimeSelect
            label="Khung giờ kết thúc"
            value={endTime}
            onChange={setEndTime}
            stepMinutes={30}
            startHour={0}
            endHour={24}
            required
            className="space-y-1.5"
            triggerClassName="h-11 rounded-xl bg-background border-border/80 text-foreground font-mono text-sm focus:ring-[#a3e635]"
          />
        </div>

        {/* 3. Chọn thứ */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground">
            Chọn thứ
          </label>
          <div className="space-y-2">
            {/* Hàng 1: T2 -> T6 */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {dayOptions.slice(0, 5).map((opt) => {
                const isChecked = selectedDays.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold select-none text-foreground hover:text-emerald-700 dark:hover:text-[#a3e635] transition-colors"
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
                    className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold select-none text-foreground hover:text-emerald-700 dark:hover:text-[#a3e635] transition-colors"
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

        {/* 4. Khoảng ngày bắt đầu & kết thúc */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Khoảng ngày bắt đầu
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="yyyy-mm-dd"
                className="w-full h-11 rounded-xl bg-background border border-border/80 px-3.5 text-sm text-foreground dark:[color-scheme:dark] focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
              />
              <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Khoảng ngày kết thúc
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="yyyy-mm-dd"
                className="w-full h-11 rounded-xl bg-background border border-border/80 px-3.5 text-sm text-foreground dark:[color-scheme:dark] focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
              />
              <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 5. Giá cố định (VNĐ) * & Giá vãng lai (VNĐ) * */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1">
              Giá cố định (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={fixedPrice}
              onChange={(e) => setFixedPrice(Number(e.target.value))}
              placeholder="100000"
              className="w-full h-11 rounded-xl bg-background border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1">
              Giá vãng lai (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={walkInPrice}
              onChange={(e) => setWalkInPrice(Number(e.target.value))}
              placeholder="120000"
              className="w-full h-11 rounded-xl bg-background border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
            />
          </div>
        </div>

        {/* 6. Số phút đơn giá & Đơn vị */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Số phút đơn giá
            </label>
            <input
              type="number"
              value={unitMinutes}
              onChange={(e) => setUnitMinutes(Number(e.target.value))}
              placeholder="60"
              className="w-full h-11 rounded-xl bg-background border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Đơn vị
            </label>
            <input
              type="text"
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
              placeholder="h"
              className="w-full h-11 rounded-xl bg-background border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
            />
          </div>
        </div>

        {/* 7. Thời gian đặt tối thiểu (phút) * */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1">
            Thời gian đặt tối thiểu (phút) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            value={minBookingMinutes}
            onChange={(e) => setMinBookingMinutes(Number(e.target.value))}
            placeholder="60"
            className="w-full h-11 rounded-xl bg-background border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
          />
        </div>

        {/* 8. Dòng chú thích mờ */}
        <p className="text-xs text-muted-foreground/80 leading-relaxed pt-1">
          Lưu ý: Bạn có thể đặt tối thiểu 60 phút, tuy nhiên khách vẫn có thể đặt thêm các mốc 30 phút (VD: 1.5h = 90 phút).
        </p>
      </div>
    </OwnerModal>
  );
}
