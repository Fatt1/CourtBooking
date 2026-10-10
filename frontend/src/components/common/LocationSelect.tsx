import { useMemo } from 'react';
import { PROVINCES, getWardsByProvince, ProvinceItem, WardItem } from '@/constants/locations';
import { SearchableSelect, SelectOption } from './SearchableSelect';
import { cn } from '@/lib/utils';

export interface LocationSelectProps {
  // Giá trị Tỉnh/Thành
  selectedProvinceCode?: string;
  onProvinceChange?: (
    provinceCode: string,
    provinceName: string,
    provinceItem?: ProvinceItem
  ) => void;

  // Giá trị Quận/Huyện (có thể là mã code hoặc tên)
  selectedWard?: string;
  onWardChange?: (
    wardValue: string,
    wardName: string,
    wardItem?: WardItem
  ) => void;

  // Cấu hình giao diện
  variant?: 'form' | 'bar';
  layout?: 'grid' | 'inline' | 'stacked';
  includeAllWardsOption?: boolean;
  provinceLabel?: string;
  wardLabel?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  provinceClassName?: string;
  wardClassName?: string;
}

/**
 * Component lựa chọn Tỉnh/Thành phố có tích hợp ô tìm kiếm theo tên
 */
export function ProvinceSelect({
  value,
  onChange,
  variant = 'form',
  label = 'Tỉnh / Thành phố',
  required = false,
  disabled = false,
  className,
}: {
  value?: string;
  onChange?: (provinceCode: string, provinceName: string, item?: ProvinceItem) => void;
  variant?: 'form' | 'bar';
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const options: SelectOption[] = useMemo(
    () =>
      PROVINCES.map((p) => ({
        value: p.code,
        label: p.nameWithType,
        subLabel: p.name,
      })),
    []
  );

  const handleSelect = (code: string) => {
    const item = PROVINCES.find((p) => p.code === code);
    onChange?.(code, item ? item.name : '', item);
  };

  if (variant === 'bar') {
    return (
      <div className={cn('flex flex-col justify-center', className)}>
        {label && (
          <label className="font-heading font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <SearchableSelect
          options={options}
          value={value}
          onChange={handleSelect}
          placeholder="Chọn thành phố"
          searchPlaceholder="Nhập tên tỉnh/thành..."
          disabled={disabled}
          triggerClassName="h-9 border-0 bg-transparent px-0 font-semibold text-sm shadow-none hover:bg-transparent"
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-xs font-semibold text-slate-200">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <SearchableSelect
        options={options}
        value={value}
        onChange={handleSelect}
        placeholder="Chọn Tỉnh / Thành phố"
        searchPlaceholder="Nhập tên tỉnh/thành..."
        disabled={disabled}
        triggerClassName="h-11 rounded-xl bg-[#111c33] border-border/60 text-white"
      />
    </div>
  );
}

/**
 * Component lựa chọn Quận/Huyện có tích hợp ô tìm kiếm theo tên
 * Tự động đồng bộ theo mã Tỉnh/Thành phố được truyền vào
 */
export function WardSelect({
  provinceCode,
  value,
  onChange,
  variant = 'form',
  label = 'Quận / Huyện',
  includeAllOption = false,
  required = false,
  disabled = false,
  className,
}: {
  provinceCode?: string;
  value?: string;
  onChange?: (wardValue: string, wardName: string, item?: WardItem) => void;
  variant?: 'form' | 'bar';
  label?: string;
  includeAllOption?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const wards = useMemo(
    () => (provinceCode ? getWardsByProvince(provinceCode) : []),
    [provinceCode]
  );

  const options: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [];
    if (includeAllOption) {
      list.push({
        value: 'all',
        label: 'Tất cả quận/huyện',
      });
    }
    wards.forEach((w) => {
      list.push({
        value: w.name, // Dùng tên hoặc w.code
        label: w.nameWithType,
        subLabel: w.name,
      });
    });
    return list;
  }, [wards, includeAllOption]);

  const handleSelect = (wardVal: string) => {
    const item = wards.find((w) => w.name === wardVal || w.code === wardVal);
    onChange?.(wardVal, item ? item.name : wardVal, item);
  };

  const isSelectDisabled = disabled || !provinceCode;
  const placeholder = provinceCode ? 'Chọn quận/huyện' : 'Chọn thành phố trước';

  if (variant === 'bar') {
    return (
      <div className={cn('flex flex-col justify-center', className)}>
        {label && (
          <label className="font-heading font-bold text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <SearchableSelect
          options={options}
          value={value}
          onChange={handleSelect}
          placeholder={placeholder}
          searchPlaceholder="Nhập tên quận/huyện..."
          disabled={isSelectDisabled}
          triggerClassName="h-9 border-0 bg-transparent px-0 font-semibold text-sm shadow-none hover:bg-transparent"
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-xs font-semibold text-slate-200">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <SearchableSelect
        options={options}
        value={value}
        onChange={handleSelect}
        placeholder={placeholder}
        searchPlaceholder="Nhập tên quận/huyện..."
        disabled={isSelectDisabled}
        triggerClassName="h-11 rounded-xl bg-[#111c33] border-border/60 text-white"
      />
    </div>
  );
}

/**
 * Cụm lựa chọn đồng bộ Tỉnh/Thành phố & Quận/Huyện dùng chung cho toàn bộ dự án
 */
export function LocationSelectGroup({
  selectedProvinceCode,
  onProvinceChange,
  selectedWard,
  onWardChange,
  variant = 'form',
  layout = 'grid',
  includeAllWardsOption = false,
  provinceLabel = 'Tỉnh / Thành phố',
  wardLabel = 'Quận / Huyện',
  required = false,
  disabled = false,
  className,
  provinceClassName,
  wardClassName,
}: LocationSelectProps) {
  const handleProvinceSelect = (
    code: string,
    name: string,
    item?: ProvinceItem
  ) => {
    onProvinceChange?.(code, name, item);
    // Khi đổi tỉnh thành, reset quận huyện
    onWardChange?.('', '');
  };

  const layoutClass =
    layout === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
      : layout === 'inline'
      ? 'flex flex-row items-center gap-3'
      : 'flex flex-col gap-3';

  return (
    <div className={cn(layoutClass, className)}>
      <ProvinceSelect
        value={selectedProvinceCode}
        onChange={handleProvinceSelect}
        variant={variant}
        label={provinceLabel}
        required={required}
        disabled={disabled}
        className={provinceClassName}
      />

      <WardSelect
        provinceCode={selectedProvinceCode}
        value={selectedWard}
        onChange={onWardChange}
        variant={variant}
        label={wardLabel}
        includeAllOption={includeAllWardsOption}
        required={required}
        disabled={disabled}
        className={wardClassName}
      />
    </div>
  );
}
