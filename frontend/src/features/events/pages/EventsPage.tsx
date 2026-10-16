import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePublicEventsQuery } from '../api/publicEventsApi';
import { EventFilters } from '../components/EventFilters';
import { EventCard } from '../components/EventCard';
import type { GetPublicEventsParams } from '../types';
import { Loader2, Calendar } from 'lucide-react';

export function EventsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [filters, setFilters] = useState<GetPublicEventsParams>({
    page: 1,
    pageSize: 12,
  });

  const { data, isLoading, isError } = usePublicEventsQuery(filters);
  const events = data?.items || [];
  const totalCount = data?.totalCount ?? events.length;

  return (
    <div className="min-h-screen bg-[#080e1c] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-black tracking-widest text-[#a3e635] uppercase">
              MATCHDAY EVENTS
            </span>
            <h1 className="mt-1 font-heading text-4xl font-black tracking-tight text-white sm:text-5xl uppercase">
              SỰ KIỆN THỂ THAO
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Giải phong trào và những buổi giao lưu sắp diễn ra quanh bạn.
            </p>
          </div>

          <div className="flex flex-col items-start gap-1.5 md:items-end">
            <span className="text-xs font-medium text-slate-400">
              {totalCount} sự kiện sắp diễn ra
            </span>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-[#0d1629] px-3.5 py-1 text-xs font-bold text-white shadow-xs">
              <span className="size-2 rounded-full bg-[#a3e635] animate-pulse" />
              <span>{isAuthenticated && user?.name ? user.name : 'TP. Hồ Chí Minh'}</span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="mt-8">
          <EventFilters
            initialValues={filters}
            onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
          />
        </div>

        {/* Events Grid */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-[#a3e635]" />
              <p className="text-xs text-slate-400">Đang tải danh sách sự kiện...</p>
            </div>
          ) : isError ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-red-900/40 bg-red-950/20 p-8 text-center">
              <p className="font-semibold text-red-400">Không thể tải dữ liệu sự kiện từ máy chủ.</p>
              <p className="mt-1 text-xs text-slate-400">Vui lòng thử lại sau.</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#0d1629]/50 p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-900 text-slate-400">
                <Calendar className="size-7" />
              </div>
              <h3 className="mt-4 font-bold text-white text-base">Không tìm thấy sự kiện nào</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                Hãy thử điều chỉnh bộ lọc tìm kiếm môn thể thao, khu vực hoặc ngày diễn ra khác.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
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
              onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
              className="rounded-xl border border-slate-800 bg-[#0d1629] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              Trang trước
            </button>
            <span className="text-xs text-slate-400 px-2">
              Trang {data.page} / {data.totalPages}
            </span>
            <button
              disabled={!data.hasNext}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
              className="rounded-xl border border-slate-800 bg-[#0d1629] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
