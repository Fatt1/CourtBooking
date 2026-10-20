import React, { useState, useMemo, useEffect } from 'react';
import { MapPin, RefreshCw, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMatchesQuery, type MatchDto } from '@/api/matches';
import { MatchCard } from '../components/MatchCard';
import { JoinMatchModal } from '../components/JoinMatchModal';
import { MatchDetailModal } from '../components/MatchDetailModal';

// Danh sách các tab bộ lọc môn thể thao công khai
const SPORT_TABS = [
  { id: 'all', label: 'Tất cả môn' },
  { id: 'football', label: 'Bóng đá' },
  { id: 'badminton', label: 'Cầu lông' },
  { id: 'pickleball', label: 'Pickleball' },
  { id: 'tennis', label: 'Tennis' },
];

export function MatchesPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');

  // Lấy toạ độ GPS nếu trình duyệt cho phép, nếu không backend tự động lấy Dinh Độc Lập làm mốc
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Bị từ chối quyền định vị: giữ undefined để backend dùng toạ độ mặc định
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Gọi query danh sách kèo từ Backend (kèm toạ độ để tính khoảng cách và sắp xếp gần nhất)
  const {
    data: pagedData,
    isLoading,
    refetch,
  } = useMatchesQuery({
    latitude: coords.lat,
    longitude: coords.lng,
  });

  // State quản lý popup tham gia kèo
  const [joinModalMatch, setJoinModalMatch] = useState<MatchDto | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // State quản lý popup xem chi tiết kèo
  const [detailMatchId, setDetailMatchId] = useState<string | null>(null);

  const handleOpenJoinModal = (match: MatchDto) => {
    setJoinModalMatch(match);
    setIsJoinModalOpen(true);
  };

  const handleOpenDetailModal = (match: MatchDto) => {
    setDetailMatchId(match.id);
  };

  const rawMatches = pagedData?.items || [];

  // Lọc dữ liệu theo tab môn thể thao
  const filteredMatches = useMemo(() => {
    return rawMatches.filter((match) => {
      if (activeTab === 'football') {
        if (!match.sportTypeName?.toLowerCase().includes('bóng đá')) return false;
      } else if (activeTab === 'badminton') {
        if (!match.sportTypeName?.toLowerCase().includes('cầu lông')) return false;
      } else if (activeTab === 'pickleball') {
        if (!match.sportTypeName?.toLowerCase().includes('pickleball')) return false;
      } else if (activeTab === 'tennis') {
        if (!match.sportTypeName?.toLowerCase().includes('tennis')) return false;
      }
      return true;
    });
  }, [rawMatches, activeTab]);

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-background py-8 sm:py-12 font-sans">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        {/* Header Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/60 pb-8">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#235338] dark:text-emerald-400">
              CỘNG ĐỒNG MATCHDAY
            </span>
            <h1 className="font-sans font-extrabold text-3xl sm:text-5xl text-foreground tracking-tight leading-tight">
              KÈO ĐANG CHỜ BẠN
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium pt-1">
              Tìm các trận giao lưu sắp diễn ra, đúng trình độ và được sắp xếp ưu tiên gần vị trí của bạn nhất.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold text-[#235338] dark:text-emerald-400 bg-[#235338]/10 px-3.5 py-2 rounded-xl border border-[#235338]/20">
            <Compass className="size-4 animate-spin text-[#235338] dark:text-emerald-400" />
            <span>Tự động sắp xếp theo cự ly gần bạn</span>
          </div>
        </div>

        {/* Bar Tabs môn thể thao & Thông tin cự ly */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Danh sách tab môn thể thao */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {SPORT_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#18231A] text-white shadow-xs'
                      : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Badge Vị trí */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <MapPin className="size-3.5 text-[#235338] shrink-0" />
            <span>Ưu tiên hiển thị ca chơi hiện tại & tương lai</span>
          </div>
        </div>

        {/* Section Subheader */}
        <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#235338]">
              {filteredMatches.length} KÈO SẮP TỚI
            </span>
            <h2 className="font-sans font-bold text-xl sm:text-2xl text-foreground tracking-tight">
              Chọn trận để tham gia
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            <span>Làm mới</span>
          </Button>
        </div>

        {/* Grid thẻ kèo */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
            <RefreshCw className="size-6 animate-spin text-[#235338]" />
            <span>Đang tìm các kèo giao lưu gần bạn...</span>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-border bg-card p-8">
            <p className="text-base font-bold text-foreground">
              Hiện chưa có kèo giao lưu nào sắp diễn ra phù hợp.
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Các ca thi đấu trong quá khứ đã được tự động ẩn. Hãy thử chọn môn thể thao khác hoặc kiểm tra lại sau nhé!
            </p>
            {activeTab !== 'all' && (
              <Button
                type="button"
                onClick={() => setActiveTab('all')}
                variant="outline"
                size="sm"
                className="mt-2 text-xs font-bold rounded-xl"
              >
                Xem tất cả các môn
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onJoin={handleOpenJoinModal}
                onViewDetail={handleOpenDetailModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODAL POPUP THAM GIA KÈO */}
      <JoinMatchModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        match={joinModalMatch}
        onSuccess={() => refetch()}
      />

      {/* MODAL POPUP XEM CHI TIẾT KÈO */}
      <MatchDetailModal
        isOpen={!!detailMatchId}
        onClose={() => setDetailMatchId(null)}
        matchId={detailMatchId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
