import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { SearchX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { usePublicBranchesQuery } from '@/api/branches';
import { useSportTypesQuery } from '@/api/sport-types';
import { CourtsHeader } from '../components/courts/CourtsHeader';
import {
  CourtsHorizontalFilterBar,
  type CourtsSearchFilters,
} from '../components/courts/CourtsHorizontalFilterBar';
import { CourtBranchCard } from '../components/courts/CourtBranchCard';
import { cn } from '@/lib/utils';

const INITIAL_FILTERS: CourtsSearchFilters = {
  province: '',
  district: '',
  sport: 'all',
  date: undefined,
  startTime: '',
  endTime: '',
  courtTypeName: '',
  minPrice: '',
  maxPrice: '',
  rating: 'all',
  search: '',
};

export function CourtsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc query parameters ban đầu từ URL (đồng bộ mượt mà từ QuickSearchBar trang chủ)
  const initialProvince = searchParams.get('province') || '';
  const initialDistrict = searchParams.get('district') || '';
  const initialSport = searchParams.get('sport') || 'all';
  const initialDateStr = searchParams.get('date');
  const initialDate = initialDateStr ? new Date(initialDateStr) : undefined;
  const initialStartTime = searchParams.get('startTime') || '';
  const initialEndTime = searchParams.get('endTime') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialCourtTypeName = searchParams.get('courtTypeName') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialRating = searchParams.get('rating') || 'all';

  const [filters, setFilters] = React.useState<CourtsSearchFilters>({
    province: initialProvince,
    district: initialDistrict,
    sport: initialSport,
    date: initialDate,
    startTime: initialStartTime,
    endTime: initialEndTime,
    search: initialSearch,
    courtTypeName: initialCourtTypeName,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    rating: initialRating,
  });

  const [appliedFilters, setAppliedFilters] = React.useState<CourtsSearchFilters>(filters);
  const [sort, setSort] = React.useState<string>('relevance');
  const [page, setPage] = React.useState<number>(1);
  // Số lượng sân trên một trang theo tiêu chuẩn: 10 sân / trang
  const pageSize = 10;

  // Tự động đồng bộ filters và appliedFilters khi URL query params thay đổi
  React.useEffect(() => {
    const province = searchParams.get('province') || '';
    const district = searchParams.get('district') || '';
    const sport = searchParams.get('sport') || 'all';
    const dateStr = searchParams.get('date');
    const date = dateStr ? new Date(dateStr) : undefined;
    const startTime = searchParams.get('startTime') || '';
    const endTime = searchParams.get('endTime') || '';
    const search = searchParams.get('search') || '';
    const courtTypeName = searchParams.get('courtTypeName') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const rating = searchParams.get('rating') || 'all';

    const syncedFilters: CourtsSearchFilters = {
      province,
      district,
      sport,
      date,
      startTime,
      endTime,
      search,
      courtTypeName,
      minPrice,
      maxPrice,
      rating,
    };

    setFilters(syncedFilters);
    setAppliedFilters(syncedFilters);
    setPage(1);
  }, [searchParams]);

  // Lấy danh sách sportTypes từ API để map giữa tên môn (từ trang chủ) và GUID của môn thể thao
  const { data: sportTypes } = useSportTypesQuery();

  const urlSportId = searchParams.get('sportId');

  const matchedSportId = React.useMemo(() => {
    if (!appliedFilters.sport || appliedFilters.sport === 'all') return undefined;
    const found = sportTypes?.find(
      (s) =>
        s.name.toLowerCase().trim() === appliedFilters.sport.toLowerCase().trim() ||
        s.id.toLowerCase() === appliedFilters.sport.toLowerCase()
    );
    if (found) return found.id;
    if (urlSportId) return urlSportId;
    return undefined;
  }, [appliedFilters.sport, sportTypes, urlSportId]);

  // Tự động tính endTime nếu chỉ có startTime (+1 tiếng)
  const computedEndTime = React.useMemo(() => {
    if (appliedFilters.endTime) return appliedFilters.endTime;
    if (!appliedFilters.startTime) return undefined;
    const [h, m] = appliedFilters.startTime.split(':').map(Number);
    const endH = Math.min(h + 1, 23);
    return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }, [appliedFilters.startTime, appliedFilters.endTime]);

  // Chuẩn bị params gọi API backend
  const queryParams = React.useMemo(() => {
    return {
      search: appliedFilters.search.trim() || undefined,
      province: appliedFilters.province.trim() || undefined,
      district: appliedFilters.district.trim() || undefined,
      sportTypeIds: matchedSportId ? [matchedSportId] : undefined,
      courtTypeName:
        appliedFilters.courtTypeName && appliedFilters.courtTypeName !== 'all'
          ? appliedFilters.courtTypeName
          : undefined,
      date: appliedFilters.date ? format(appliedFilters.date, 'yyyy-MM-dd') : undefined,
      startTime: appliedFilters.startTime || undefined,
      endTime: computedEndTime,
      minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
      maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
      rating:
        appliedFilters.rating && appliedFilters.rating !== 'all'
          ? Number(appliedFilters.rating)
          : undefined,
      sort: sort !== 'relevance' ? sort : undefined,
      page,
      pageSize,
    };
  }, [appliedFilters, matchedSportId, computedEndTime, sort, page, pageSize]);

  // Gọi API backend lấy danh sách chi nhánh thực tế
  const { data, isLoading } = usePublicBranchesQuery(queryParams);

  const branches = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.max(1, data?.totalPages || 1);

  // Hiển thị tối đa 3 cục số lướt theo trang hiện tại
  const visiblePages = React.useMemo(() => {
    const maxButtons = 3;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, page - 1);
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Áp dụng bộ lọc
  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);

    // Cập nhật URL search params để tiện chia sẻ / bookmark
    const params = new URLSearchParams();
    if (filters.province) params.set('province', filters.province);
    if (filters.district) params.set('district', filters.district);
    if (filters.sport && filters.sport !== 'all') {
      params.set('sport', filters.sport);
      const found = sportTypes?.find(
        (s) =>
          s.name.toLowerCase().trim() === filters.sport.toLowerCase().trim() ||
          s.id.toLowerCase() === filters.sport.toLowerCase()
      );
      if (found) params.set('sportId', found.id);
    }
    if (filters.date) params.set('date', format(filters.date, 'yyyy-MM-dd'));
    if (filters.startTime) params.set('startTime', filters.startTime);
    if (filters.endTime) params.set('endTime', filters.endTime);
    if (filters.search) params.set('search', filters.search);
    if (filters.courtTypeName) params.set('courtTypeName', filters.courtTypeName);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.rating && filters.rating !== 'all') params.set('rating', filters.rating);
    setSearchParams(params, { replace: true });
  };

  // Đặt lại bộ lọc
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  return (
    <div className="min-h-screen bg-background py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl space-y-6 sm:space-y-8">
        {/* 1. Header Trang Danh Sách Sân */}
        <CourtsHeader />

        {/* 2. Thanh Filter Ngang: Đồng bộ 100% với Trang Chủ + Toolbar Bộ Lọc Phụ & Sắp Xếp */}
        <CourtsHorizontalFilterBar
          filters={filters}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          totalCount={totalCount}
          isLoading={isLoading}
          sort={sort}
          onSortChange={setSort}
        />

        {/* 3. Danh Sách Các Thẻ Sân Rộng Rãi Toàn Màn Hình (Đã bỏ cột Sidebar) */}
        <div className="space-y-4 pt-2">
          {isLoading ? (
            /* Loading Skeletons */
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs flex flex-col md:flex-row"
              >
                <Skeleton className="md:w-80 h-56 rounded-none" />
                <div className="p-5 flex-1 space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-7 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-6 w-20 rounded-md" />
                      <Skeleton className="h-6 w-20 rounded-md" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border/50">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-10 w-28 rounded-xl" />
                  </div>
                </div>
              </div>
            ))
          ) : branches.length === 0 ? (
            /* Trạng thái không có kết quả */
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 p-12 text-center space-y-4">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <SearchX className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-black text-lg text-foreground">
                  Không tìm thấy sân phù hợp
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Hãy thử nới lỏng bộ lọc thành phố, khu vực, khoảng giá hoặc môn thể thao để khám phá thêm nhiều sân quanh bạn.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="rounded-xl font-bold text-xs cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          ) : (
            /* Render danh sách thẻ sân full-width */
            branches.map((branch) => (
              <CourtBranchCard key={branch.id} branch={branch} />
            ))
          )}

          {/* Phân trang: hiển thị gọn gàng 3 cục số + nút nhảy trang đầu / cuối */}
          {totalCount > 0 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50">
              <div className="text-xs text-muted-foreground order-2 sm:order-1">
                Trang <span className="font-bold text-foreground">{page}</span> trên{' '}
                <span className="font-bold text-foreground">{totalPages}</span> (Tổng{' '}
                <span className="font-bold text-foreground">{totalCount}</span> sân)
              </div>

              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                {/* Đến trang đầu tiên */}
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={page <= 1}
                  title="Về trang đầu tiên (Trang 1)"
                  className="size-9 rounded-xl border border-border/70 bg-card text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer shadow-xs"
                  aria-label="Về trang đầu"
                >
                  <ChevronsLeft className="size-4" />
                </button>

                {/* Lùi 1 trang */}
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  title="Trang trước"
                  className="size-9 rounded-xl border border-border/70 bg-card text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer shadow-xs"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="size-4" />
                </button>

                {/* Nút trang 1 nếu visiblePages không chứa trang 1 */}
                {visiblePages[0] > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handlePageChange(1)}
                      className="size-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center bg-card border border-border/70 text-foreground hover:bg-muted"
                    >
                      1
                    </button>
                    {visiblePages[0] > 2 && (
                      <span className="text-xs text-muted-foreground px-1 select-none">...</span>
                    )}
                  </>
                )}

                {/* Tối đa 3 cục số lướt */}
                {visiblePages.map((pageNum) => {
                  const isActive = pageNum === page;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        'size-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center',
                        isActive
                          ? 'bg-[#397B48] text-white shadow-xs scale-105'
                          : 'bg-card border border-border/70 text-foreground hover:bg-muted'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Nút trang cuối nếu visiblePages không chứa trang cuối */}
                {visiblePages[visiblePages.length - 1] < totalPages && (
                  <>
                    {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                      <span className="text-xs text-muted-foreground px-1 select-none">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages)}
                      className="size-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center bg-card border border-border/70 text-foreground hover:bg-muted"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Tiến 1 trang */}
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  title="Trang sau"
                  className="size-9 rounded-xl border border-border/70 bg-card text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer shadow-xs"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="size-4" />
                </button>

                {/* Đến trang cuối cùng */}
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page >= totalPages}
                  title={`Đến trang cuối (Trang ${totalPages})`}
                  className="size-9 rounded-xl border border-border/70 bg-card text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer shadow-xs"
                  aria-label="Đến trang cuối"
                >
                  <ChevronsRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
