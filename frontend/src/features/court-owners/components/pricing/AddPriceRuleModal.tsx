import { useState } from 'react';
import { Clock, Calendar, ChevronDown } from 'lucide-react';
import { OwnerModal } from '@/features/court-owners/components/shared';

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

interface AddPriceRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availablePriceTables: Array<{ id: string; name: string }>;
  defaultPriceTableId?: string;
  onSubmit: (values: NewPriceRuleFormValues) => void;
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
  onSubmit,
}: AddPriceRuleModalProps) {
  const [priceTableId, setPriceTableId] = useState(
    defaultPriceTableId || availablePriceTables[0]?.id || 'pt-standard'
  );
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('12:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([6, 0]); // Mặc định Thứ 7, CN theo ảnh
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fixedPrice, setFixedPrice] = useState<number>(100000);
  const [walkInPrice, setWalkInPrice] = useState<number>(120000);
  const [unitMinutes, setUnitMinutes] = useState<number>(60);
  const [unitLabel, setUnitLabel] = useState('h');
  const [minBookingMinutes, setMinBookingMinutes] = useState<number>(60);

  const toggleDay = (dayVal: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const handleFormSubmit = () => {
    onSubmit({
      priceTableId,
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
    });
    onOpenChange(false);
  };

  return (
    <OwnerModal
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm khung giờ giá"
      submitText="Lưu cấu hình"
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
              className="w-full h-11 rounded-xl bg-[#080E1C] dark:bg-[#080E1C] border border-border/80 px-3.5 text-sm text-foreground appearance-none pr-10 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635] cursor-pointer"
            >
              {availablePriceTables.map((tbl) => (
                <option key={tbl.id} value={tbl.id} className="bg-[#0B1324] text-white">
                  {tbl.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* 2. Khung giờ bắt đầu & kết thúc */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Khung giờ bắt đầu
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
              Khung giờ kết thúc
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
                placeholder="mm/dd/yyyy"
                className="w-full h-11 rounded-xl bg-[#080E1C] dark:bg-[#080E1C] border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
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
                placeholder="mm/dd/yyyy"
                className="w-full h-11 rounded-xl bg-[#080E1C] dark:bg-[#080E1C] border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
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
              className="w-full h-11 rounded-xl bg-[#080E1C] dark:bg-[#080E1C] border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
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
              className="w-full h-11 rounded-xl bg-[#080E1C] dark:bg-[#080E1C] border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
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
              className="w-full h-11 rounded-xl bg-[#080E1C] dark:bg-[#080E1C] border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
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
              className="w-full h-11 rounded-xl bg-[#080E1C] dark:bg-[#080E1C] border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
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
            className="w-full h-11 rounded-xl bg-[#080E1C] dark:bg-[#080E1C] border border-border/80 px-3.5 text-sm text-foreground focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
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
