import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMatchesQuery } from '@/api/matches';
import { Skeleton } from '@/components/ui/skeleton';

export function SocialMatchesSection() {
  const { data: pagedMatches, isLoading } = useMatchesQuery({
    page: 1,
    pageSize: 3,
  });

  const matches = pagedMatches?.items || [];

  return (
    <section className="py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-8 max-w-7xl">
        <div className="rounded-3xl bg-[#132617] dark:bg-[#0E1B2E] text-white p-8 sm:p-12 lg:p-14 shadow-2xl relative overflow-hidden border border-white/10">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Column */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              <span className="font-heading font-bold text-xs sm:text-sm tracking-widest uppercase text-emerald-400">
                KÈO GIAO LƯU
              </span>

              <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl uppercase tracking-normal sm:tracking-wide text-white leading-[1.15]">
                Thiếu người thì rủ thêm.<br />
                Thiếu đội thì tham gia.
              </h2>

              <p className="text-slate-300 text-sm sm:text-base max-w-md font-normal leading-relaxed">
                Mỗi kèo đều có môn chơi, trình độ, khu vực và số chỗ còn lại rõ ràng.
              </p>

              <div className="pt-2">
                <Button
                  asChild
                  className="bg-white hover:bg-slate-100 text-[#132617] font-bold px-7 py-3 rounded-md text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  <Link to="/events">Khám phá kèo</Link>
                </Button>
              </div>
            </div>

            {/* Right Column: List of Matches */}
            <div className="lg:col-span-6 bg-black/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10 space-y-4">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-14 w-full bg-white/10 rounded-xl" />
                  <Skeleton className="h-14 w-full bg-white/10 rounded-xl" />
                </div>
              ) : matches.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm font-semibold text-white/90">
                    Hiện chưa có kèo giao lưu nào đang mở.
                  </p>
                  <p className="text-xs text-slate-300">
                    Hãy đặt sân và là người đầu tiên mở kèo để rủ thêm bạn bè cùng tham gia!
                  </p>
                </div>
              ) : (
                matches.map((match, idx) => {
                  const title =
                    match.description?.trim().split('\n')[0] ||
                    `Kèo ${match.sportTypeName || 'Giao lưu'} tại ${match.branchName}`;
                  const timeAndPlace = `${match.startTime.slice(0, 5)} - ${match.endTime.slice(0, 5)} · ${match.date} · ${match.branchName}`;

                  return (
                    <div key={match.id}>
                      <div className="flex items-center justify-between gap-4 py-2">
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            {match.sportTypeName || 'Thể thao'}
                          </span>
                          <h4 className="font-bold text-white text-sm sm:text-base leading-snug line-clamp-1">
                            {title}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-1">
                            {timeAndPlace}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                            {match.availableSlots > 0
                              ? `Còn ${match.availableSlots} chỗ`
                              : 'Đã đủ người'}
                          </span>
                          <div className="mt-2">
                            <Link
                              to="/events"
                              className="text-xs font-semibold text-white/90 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
                            >
                              Xem chi tiết
                            </Link>
                          </div>
                        </div>
                      </div>

                      {idx < matches.length - 1 && (
                        <div className="border-t border-white/10 my-3" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
