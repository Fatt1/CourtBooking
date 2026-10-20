import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePublicEventsQuery } from '../api/publicEventsApi';
import { QuickSearchBar, type QuickSearchParams } from '@/features/customer/components/QuickSearchBar';
import { EventCard } from '../components/EventCard';
import type { GetPublicEventsParams } from '../types';
import { Loader2, Calendar } from 'lucide-react';

export function EventsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [quickFilters, setQuickFilters] = useState<QuickSearchParams>({});
  const [page, setPage] = useState(1);

  const queryParams: GetPublicEventsParams = useMemo(
    () => ({
      page,
      pageSize: 12,
      province: quickFilters.province,
      district: quickFilters.district,
      sport: quickFilters.sport,
      date: quickFilters.date,
      startTime: quickFilters.startTime,
      endTime: quickFilters.endTime,
    }),
    [page, quickFilters]
  );

  const { data, isLoading, isError } = usePublicEventsQuery(queryParams);
  const events = data?.items || [];
  const totalCount = data?.totalCount ?? events.length;

  const handleQuickSearch = (params: QuickSearchParams) => {
    setQuickFilters(params);
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    quickFilters.province ||
    quickFilters.district ||
    (quickFilters.sport && quickFilters.sport !== 'all') ||
    quickFilters.date ||
    quickFilters.startTime ||
    quickFilters.endTime
  );

  // Lọc an toàn phía Client để chắc chắn chỉ hiển thị sự kiện từ hiện tại tới tương lai
  const activeEvents = useMemo(() => {
    const now = new Date();
    return events.filter((ev) => {
      if (!ev.date) return true;
      const endDateTimeStr = `${ev.date}T${ev.endTime || '23:59:59'}`;
      const eventEnd = new Date(endDateTimeStr);
      return isNaN(eventEnd.getTime()) || eventEnd >= now;
    });
  }, [events]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-black tracking-widest text-[#397B48] dark:text-[#a3e635] uppercase">
              MATCHDAY EVENTS
            </span>
            <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-foreground sm:text-5xl uppercase">
              SỰ KIỆN THỂ THAO
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Giải giao lưu và những buổi thi đấu thể thao sôi động sắp diễn ra quanh bạn.
            </p>
          </div>

          <div className="flex flex-col items-start gap-1.5 md:items-end">
            <span className="text-xs font-medium text-muted-foreground">
              {totalCount} sự kiện sắp diễn ra
            </span>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-1 text-xs font-bold text-foreground shadow-xs">
              <span className="size-2 rounded-full bg-[#397B48] dark:bg-[#a3e635] animate-pulse" />
              <span>{isAuthenticated && user?.name ? user.name : 'TP. Hồ Chí Minh'}</span>
            </div>
          </div>
        </div>

        {/* Filter Section với QuickSearchBar */}
        <div className="mt-8">
          <QuickSearchBar
            isEmbedded
            initialValues={quickFilters}
            onSearch={handleQuickSearch}
            buttonText="Tìm"
            helperText="Tìm kiếm giải đấu, sự kiện thể thao theo môn, khu vực hoặc ngày giờ mong muốn."
          />
        </div>

        {/* Active Filters badge / Clear */}
        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-2.5">
            <span className="text-xs text-muted-foreground">
              Đang áp dụng bộ lọc nâng cao
            </span>
            <button
              onClick={() => {
                setQuickFilters({});
                setPage(1);
              }}
              className="text-xs font-semibold text-[#397B48] dark:text-[#a3e635] hover:underline cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* Events Grid */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-[#397B48] dark:text-[#a3e635]" />
              <p className="text-xs text-muted-foreground">Đang tải danh sách sự kiện...</p>
            </div>
          ) : isError ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
              <p className="font-semibold text-destructive">Không thể tải dữ liệu sự kiện từ máy chủ.</p>
              <p className="mt-1 text-xs text-muted-foreground">Vui lòng thử lại sau.</p>
            </div>
          ) : activeEvents.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-border/80 bg-card/60 p-8 text-center shadow-xs">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Calendar className="size-7" />
              </div>
              <h3 className="mt-4 font-bold text-foreground text-base">Không tìm thấy sự kiện nào</h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Hãy thử điều chỉnh bộ lọc tìm kiếm môn thể thao, khu vực hoặc ngày diễn ra khác.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination if multiple pages */}
        {data && data.totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              disabled={!data.hasPrevious}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
            >
              Trang trước
            </button>
            <span className="text-xs text-muted-foreground px-2">
              Trang {data.page} / {data.totalPages}
            </span>
            <button
              disabled={!data.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-border/80 bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
