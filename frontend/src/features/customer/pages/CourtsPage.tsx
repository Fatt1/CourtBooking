import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { SearchX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { usePublicBranchesQuery, type PublicBranchListItemDto } from '@/api/branches';
import { useSportTypesQuery } from '@/api/sport-types';
import { CourtsHeader } from '../components/courts/CourtsHeader';
import {
  CourtsHorizontalFilterBar,
  type CourtsSearchFilters,
} from '../components/courts/CourtsHorizontalFilterBar';
import { CourtBranchCard } from '../components/courts/CourtBranchCard';
import { BranchReviewsModal } from '../components/BranchReviewsModal';
import { cn } from '@/lib/utils';

const INITIAL_FILTERS: CourtsSearchFilters = {
  province: '',
  district: '',
  sports: [],
  date: undefined,
  startTime: '',
  endTime: '',
  minPrice: '',
  maxPrice: '',
  search: '',
};

export function CourtsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Đọc query parameters ban đầu từ URL (đồng bộ mượt mà từ QuickSearchBar và SportsCategory trang chủ)
  const initialProvince = searchParams.get('province') || '';
  const initialDistrict = searchParams.get('district') || '';
  const initialSportsParam = searchParams.get('sports');
  const initialSportParam = searchParams.get('sport');
  const initialSports: string[] = React.useMemo(() => {
    if (initialSportsParam) {
      return initialSportsParam.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (initialSportParam && initialSportParam !== 'all') {
      return [initialSportParam.trim()];
    }
    return [];
  }, [initialSportsParam, initialSportParam]);

  const initialDateStr = searchParams.get('date');
  const initialDate = initialDateStr ? new Date(initialDateStr) : undefined;
  const initialStartTime = searchParams.get('startTime') || '';
  const initialEndTime = searchParams.get('endTime') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialMinPrice = searchParams.get('minPrice') || '';
  const initialMaxPrice = searchParams.get('maxPrice') || '';
  const initialSort = searchParams.get('sort') || 'distance';

  const [filters, setFilters] = React.useState<CourtsSearchFilters>({
    province: initialProvince,
    district: initialDistrict,
    sports: initialSports,
    date: initialDate,
    startTime: initialStartTime,
    endTime: initialEndTime,
    search: initialSearch,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
  });

  const [appliedFilters, setAppliedFilters] = React.useState<CourtsSearchFilters>(filters);
  const [sort, setSort] = React.useState<string>(initialSort);
  const [page, setPage] = React.useState<number>(1);
  const [selectedBranchForReviews, setSelectedBranchForReviews] =
    React.useState<PublicBranchListItemDto | null>(null);
  // Số lượng sân trên một trang theo tiêu chuẩn: 10 sân / trang
  const pageSize = 10;

  // Tự động đồng bộ filters và appliedFilters khi URL query params thay đổi
  React.useEffect(() => {
    const province = searchParams.get('province') || '';
    const district = searchParams.get('district') || '';
    const sportsParam = searchParams.get('sports');
    const sportParam = searchParams.get('sport');
    let sports: string[] = [];
    if (sportsParam) {
      sports = sportsParam.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (sportParam && sportParam !== 'all') {
      sports = [sportParam.trim()];
    }
    const dateStr = searchParams.get('date');
    const date = dateStr ? new Date(dateStr) : undefined;
    const startTime = searchParams.get('startTime') || '';
    const endTime = searchParams.get('endTime') || '';
    const search = searchParams.get('search') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const urlSort = searchParams.get('sort');

    const syncedFilters: CourtsSearchFilters = {
      province,
      district,
      sports,
      date,
      startTime,
      endTime,
      search,
      minPrice,
      maxPrice,
    };

    setFilters(syncedFilters);
    setAppliedFilters(syncedFilters);
    if (urlSort) {
      setSort(urlSort);
    }
    setPage(1);
  }, [searchParams]);

  // Lấy danh sách sportTypes từ API để map giữa tên môn (từ trang chủ) và GUID của môn thể thao
  const { data: sportTypes } = useSportTypesQuery();

  const urlSportId = searchParams.get('sportId');

  const matchedSportIds = React.useMemo(() => {
    const sports = appliedFilters.sports || [];
    const ids: string[] = [];

    for (const item of sports) {
      const found = sportTypes?.find(
        (s) =>
          s.name.toLowerCase().trim() === item.toLowerCase().trim() ||
          s.id.toLowerCase() === item.toLowerCase()
      );
      if (found) {
        ids.push(found.id);
      } else if (item.length === 36 && item.includes('-')) {
        ids.push(item);
      }
    }

    if (ids.length === 0 && urlSportId) {
      ids.push(urlSportId);
    }

    return ids.length > 0 ? ids : undefined;
  }, [appliedFilters.sports, sportTypes, urlSportId]);

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
      sportTypeIds: matchedSportIds,
      date: appliedFilters.date ? format(appliedFilters.date, 'yyyy-MM-dd') : undefined,
      startTime: appliedFilters.startTime || undefined,
      endTime: computedEndTime,
      minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
      maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
      sort: sort || 'distance',
      page,
      pageSize,
    };
  }, [appliedFilters, matchedSportIds, computedEndTime, sort, page, pageSize]);

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
  const handleApplyFilters = (overrideFilters?: CourtsSearchFilters) => {
    const target = overrideFilters ?? filters;
    setPage(1);
    setAppliedFilters(target);

    // Cập nhật URL search params để tiện chia sẻ / bookmark
    const params = new URLSearchParams();
    if (target.province) params.set('province', target.province);
    if (target.district) params.set('district', target.district);
    if (target.sports && target.sports.length > 0) {
      params.set('sports', target.sports.join(','));
    }
    if (target.date) params.set('date', format(target.date, 'yyyy-MM-dd'));
    if (target.startTime) params.set('startTime', target.startTime);
    if (target.endTime) params.set('endTime', target.endTime);
    if (target.search) params.set('search', target.search);
    if (target.minPrice) params.set('minPrice', target.minPrice);
    if (target.maxPrice) params.set('maxPrice', target.maxPrice);
    if (sort && sort !== 'distance') params.set('sort', sort);
    setSearchParams(params, { replace: true });
  };

  // Đặt lại bộ lọc
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setSort('distance');
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

        {/* 3. Danh Sách Các Thẻ Sân Dạng Grid 3 Cột Đồng Bộ Với Trang Chủ */}
        <div className="space-y-6 pt-2">
          {isLoading ? (
            /* Loading Skeletons dạng thẻ dọc */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs flex flex-col"
                >
                  <Skeleton className="aspect-[16/10] w-full rounded-none" />
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3.5 w-20" />
                        <Skeleton className="h-3.5 w-12" />
                      </div>
                      <Skeleton className="h-6 w-4/5" />
                      <Skeleton className="h-3.5 w-1/2" />
                      <Skeleton className="h-3.5 w-28" />
                    </div>
                    <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            /* Render danh sách thẻ sân dạng grid 3 cột */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map((branch) => (
                <CourtBranchCard
                  key={branch.id}
                  branch={branch}
                  onOpenReviews={setSelectedBranchForReviews}
                />
              ))}
            </div>
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

      {/* Modal Xem Đánh Giá Chi Nhánh */}
      {selectedBranchForReviews && (
        <BranchReviewsModal
          isOpen={Boolean(selectedBranchForReviews)}
          onClose={() => setSelectedBranchForReviews(null)}
          branchId={selectedBranchForReviews.id}
          branchName={selectedBranchForReviews.name}
          reviewAverage={selectedBranchForReviews.reviewAverage}
        />
      )}
    </div>
  );
}
