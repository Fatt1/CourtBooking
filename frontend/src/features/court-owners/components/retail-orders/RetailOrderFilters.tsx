import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { OwnerFilterBar } from '../shared';

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function presetDates(preset: string) {
  const end = new Date();
  const start = new Date();
  if (preset === 'yesterday') { start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); }
  if (preset === 'week') start.setDate(start.getDate() - 6);
  if (preset === 'month') start.setDate(1);
  return { from: localDate(start), to: localDate(end) };
}

interface Props {
  from: string; to: string; search: string; preset: string;
  onDates: (from: string | undefined, to: string | undefined, preset: string) => void;
  onSearch: (value: string) => void;
}

export function RetailOrderFilters({ from, to, search, preset, onDates, onSearch }: Props) {
  return <div className="space-y-3">
    <div className="flex flex-wrap items-end gap-3">
      <label className="space-y-1 text-xs text-muted-foreground"><span className="block">Khoảng thời gian</span>
        <select value={preset} aria-label="Khoảng thời gian" className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground"
          onChange={(e) => { const value = e.target.value; if (value === 'custom') onDates(undefined, undefined, value); else { const dates = presetDates(value); onDates(dates.from, dates.to, value); } }}>
          <option value="today">Hôm nay</option><option value="yesterday">Hôm qua</option><option value="week">7 ngày qua</option><option value="month">Tháng này</option><option value="custom">Tùy chọn</option>
        </select>
      </label>
      <label className="space-y-1 text-xs text-muted-foreground"><span className="block">Từ ngày</span><Input type="date" aria-label="Từ ngày" value={from} onChange={(e) => onDates(e.target.value, undefined, 'custom')} className="h-10 w-40 bg-card" /></label>
      <label className="space-y-1 text-xs text-muted-foreground"><span className="block">Đến ngày</span><Input type="date" aria-label="Đến ngày" value={to} onChange={(e) => onDates(undefined, e.target.value, 'custom')} className="h-10 w-40 bg-card" /></label>
      {(preset !== 'today' || search) && <Button variant="ghost" onClick={() => { const dates = presetDates('today'); onDates(dates.from, dates.to, 'today'); onSearch(''); }}>Xóa bộ lọc</Button>}
    </div>
    <OwnerFilterBar className="[&>div:last-child]:lg:justify-start" searchPlaceholder="Tìm mã hóa đơn trong khoảng ngày đã chọn..." searchValue={search} onSearchChange={onSearch} />
  </div>;
}
