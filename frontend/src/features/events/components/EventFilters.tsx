import { useState } from 'react';
import { Search, Calendar as CalendarIcon, MapPin, Trophy } from 'lucide-react';
import { useSportTypesQuery } from '@/api/sport-types';
import { usePublicBranchesQuery } from '@/api/branches';
import type { GetPublicEventsParams } from '../types';

interface EventFiltersProps {
  initialValues: GetPublicEventsParams;
  onFilterChange: (filters: GetPublicEventsParams) => void;
}

export function EventFilters({ initialValues, onFilterChange }: EventFiltersProps) {
  const [search, setSearch] = useState(initialValues.search || '');
  const [sportTypeId, setSportTypeId] = useState(initialValues.sportTypeId || '');
  const [branchId, setBranchId] = useState(initialValues.branchId || '');
  const [date, setDate] = useState(initialValues.date || '');

  const { data: sportTypes = [] } = useSportTypesQuery();
  const { data: branchesData } = usePublicBranchesQuery({ page: 1, pageSize: 50 });
  const branches = branchesData?.items || [];

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onFilterChange({
      search: search.trim() || undefined,
      sportTypeId: sportTypeId || undefined,
      branchId: branchId || undefined,
      date: date || undefined,
      page: 1,
    });
  };

  return (
    <form
      onSubmit={handleApply}
      className="rounded-2xl border border-border/80 bg-card/90 text-card-foreground p-3 sm:p-4 shadow-xs backdrop-blur-md transition-colors"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        {/* 1. TÌM SỰ KIỆN */}
        <div className="lg:col-span-3 space-y-1.5">
          <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
            <Search className="size-3 text-muted-foreground" />
            <span>Tìm sự kiện</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên sự kiện, giải đấu..."
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#397B48] focus:outline-hidden focus:ring-1 focus:ring-[#397B48] dark:focus:border-[#a3e635] dark:focus:ring-[#a3e635] transition-all"
            />
          </div>
        </div>

        {/* 2. MÔN THỂ THAO */}
        <div className="lg:col-span-3 space-y-1.5">
          <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
            <Trophy className="size-3 text-muted-foreground" />
            <span>Môn thể thao</span>
          </label>
          <div className="relative">
            <select
              value={sportTypeId}
              onChange={(e) => setSportTypeId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[#397B48] focus:outline-hidden focus:ring-1 focus:ring-[#397B48] dark:focus:border-[#a3e635] dark:focus:ring-[#a3e635] transition-all cursor-pointer"
            >
              <option value="">Tất cả môn</option>
              {sportTypes.map((st) => (
                <option key={st.id} value={st.id} className="bg-card text-foreground">
                  {st.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
              <svg className="size-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 3. KHU VỰC */}
        <div className="lg:col-span-3 space-y-1.5">
          <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
            <MapPin className="size-3 text-muted-foreground" />
            <span>Khu vực</span>
          </label>
          <div className="relative">
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-[#397B48] focus:outline-hidden focus:ring-1 focus:ring-[#397B48] dark:focus:border-[#a3e635] dark:focus:ring-[#a3e635] transition-all cursor-pointer"
            >
              <option value="">Mọi khu vực</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-card text-foreground">
                  {b.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
              <svg className="size-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 4. NGÀY DIỄN RA */}
        <div className="lg:col-span-2 space-y-1.5">
          <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
            <CalendarIcon className="size-3 text-muted-foreground" />
            <span>Ngày diễn ra</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#397B48] focus:outline-hidden focus:ring-1 focus:ring-[#397B48] dark:focus:border-[#a3e635] dark:focus:ring-[#a3e635] transition-all"
          />
        </div>

        {/* 5. NÚT TÌM KIẾM */}
        <div className="lg:col-span-1">
          <button
            type="submit"
            className="w-full cursor-pointer rounded-xl bg-[#397B48] hover:bg-[#2d6239] text-white dark:bg-[#a3e635] dark:hover:bg-[#bef264] dark:text-slate-950 px-4 py-2.5 text-sm font-bold shadow-xs transition-all active:scale-95"
          >
            Tìm
          </button>
        </div>
      </div>
    </form>
  );
}
