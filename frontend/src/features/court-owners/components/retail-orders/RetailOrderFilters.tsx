import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { OwnerFilterBar } from '../shared';
import { CalendarDays } from 'lucide-react';

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
  return <div className="rounded-[22px] border border-border/60 bg-card/95 p-4 shadow-[0_10px_30px_rgba(32,73,48,0.05)] dark:shadow-none sm:p-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)_minmax(160px,1fr)_minmax(240px,2fr)] xl:items-end">
      <label className="space-y-1 text-xs text-muted-foreground"><span className="block">Khoảng thời gian</span>
        <div className="relative"><CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-emerald-700" /><select value={preset} aria-label="Khoảng thời gian" className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm text-foreground shadow-sm"
          onChange={(e) => { const value = e.target.value; if (value === 'custom') onDates(undefined, undefined, value); else { const dates = presetDates(value); onDates(dates.from, dates.to, value); } }}>
          <option value="today">Hôm nay</option><option value="yesterday">Hôm qua</option><option value="week">7 ngày qua</option><option value="month">Tháng này</option><option value="custom">Tùy chọn</option>
        </select></div>
      </label>
      <label className="space-y-1 text-xs text-muted-foreground"><span className="block">Từ ngày</span><Input type="date" aria-label="Từ ngày" value={from} onChange={(e) => onDates(e.target.value, undefined, 'custom')} className="h-11 w-full rounded-xl bg-card shadow-sm" /></label>
      <label className="space-y-1 text-xs text-muted-foreground"><span className="block">Đến ngày</span><Input type="date" aria-label="Đến ngày" value={to} onChange={(e) => onDates(undefined, e.target.value, 'custom')} className="h-11 w-full rounded-xl bg-card shadow-sm" /></label>
      <div className="space-y-1"><span className="block text-xs text-transparent" aria-hidden="true">Tìm kiếm</span><OwnerFilterBar className="[&>div:last-child]:w-full [&>div:last-child]:justify-start [&>div:last-child>div]:max-w-none [&>div:last-child>div]:w-full [&_input]:h-11 [&_input]:rounded-xl [&_input]:border-emerald-200" searchPlaceholder="Tìm mã hóa đơn trong khoảng..." searchValue={search} onSearchChange={onSearch} /></div>
    </div>
    {(preset !== 'today' || search) && <Button variant="ghost" size="sm" className="mt-2" onClick={() => { const dates = presetDates('today'); onDates(dates.from, dates.to, 'today'); onSearch(''); }}>Xóa bộ lọc</Button>}
  </div>;
}
