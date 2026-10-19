import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMatchesQuery, type MatchDto, SocialMatchStatus } from '@/api/matches';
import { MatchCard } from '../components/MatchCard';

// Danh sách các tab bộ lọc môn thể thao & bộ lọc cá nhân
const SPORT_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'football', label: 'Bóng đá' },
  { id: 'badminton', label: 'Cầu lông' },
  { id: 'pickleball', label: 'Pickleball' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'my-matches', label: 'Kèo của tôi' },
  { id: 'joined', label: 'Đã tham gia' },
];

const DISTRICT_OPTIONS = [
  'Gần bạn',
  'Thủ Đức',
  'Quận 1',
  'Quận 7',
  'Bình Thạnh',
  'Phú Nhuận',
  'Tân Bình',
];

export function MatchesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('Gần bạn');

  // Gọi query danh sách kèo từ Backend
  const { data: pagedData, isLoading, refetch } = useMatchesQuery();

  // Dữ liệu mẫu chuẩn chỉnh theo đúng mockup Figma nếu DB chưa có kèo
  const fallbackMatches: MatchDto[] = useMemo(
    () => [
      {
        id: 'pk-match-001',
        orderId: 'a1b2c3d4-1111-2222-3333-444444444444',
        branchId: 'b1b2c3d4-1111-2222-3333-444444444444',
        branchName: 'Victory Pickleball',
        branchAddress: '123 Võ Văn Ngân, Thủ Đức, TP.HCM',
        sportTypeId: 's-pickleball',
        sportTypeName: 'Pickleball',
        date: '24/09/2026',
        startTime: '19:00:00',
        endTime: '21:00:00',
        hostId: user?.id || 'host-user-01',
        hostName: user?.name || 'Vua Bá Khí',
        skillLevel: 'Trung bình',
        missingPlayers: 2,
        availableSlots: 2,
        feePerPlayer: 70000,
        approvalMode: 1, // Chủ phòng duyệt
        status: SocialMatchStatus.Open,
        description: 'Trận giao lưu nhẹ nhàng, ưu tiên vui vẻ và đúng giờ. Đã có sân, mọi người tự chia phí tại sân sau buổi chơi.',
        createdAt: '2026-09-20T10:00:00Z',
        confirmedParticipantsCount: 2,
      },
      {
        id: 'badminton-match-002',
        orderId: 'a1b2c3d4-2222-2222-3333-444444444444',
        branchId: 'b1b2c3d4-2222-2222-3333-444444444444',
        branchName: 'Sân Cầu lông Lan Anh',
        branchAddress: '291 Cách Mạng Tháng 8, Bình Thạnh, TP.HCM',
        sportTypeId: 's-badminton',
        sportTypeName: 'Cầu lông',
        date: '25/09/2026',
        startTime: '18:00:00',
        endTime: '20:00:00',
        hostId: 'host-user-02',
        hostName: 'Minh Anh',
        skillLevel: 'Khá',
        missingPlayers: 1,
        availableSlots: 1,
        feePerPlayer: 45000,
        approvalMode: 0, // Tự động nhận
        status: SocialMatchStatus.Open,
        description: 'Đánh đôi giao lưu cuối tuần. Nhóm đang có 3 người cần thêm 1 bạn trình độ Khá giao lưu cọ sát.',
        createdAt: '2026-09-21T10:00:00Z',
        confirmedParticipantsCount: 3,
      },
      {
        id: 'football-match-003',
        orderId: 'a1b2c3d4-3333-2222-3333-444444444444',
        branchId: 'b1b2c3d4-3333-2222-3333-444444444444',
        branchName: 'Green Field Arena',
        branchAddress: 'Đường số 7, Quận 7, TP.HCM',
        sportTypeId: 's-football',
        sportTypeName: 'Bóng đá',
        date: '26/09/2026',
        startTime: '20:00:00',
        endTime: '21:30:00',
        hostId: user?.id || 'host-user-01',
        hostName: user?.name || 'Vua Bá Khí',
        skillLevel: 'Phong trào',
        missingPlayers: 2,
        availableSlots: 0,
        feePerPlayer: 60000,
        approvalMode: 1, // Chủ phòng duyệt
        status: SocialMatchStatus.Closed, // Đã kết thúc
        description: 'Bóng đá 7 người tối thứ sáu. Đã đủ người tham gia.',
        createdAt: '2026-09-18T10:00:00Z',
        confirmedParticipantsCount: 14,
      },
      {
        id: 'tennis-match-004',
        orderId: 'a1b2c3d4-4444-2222-3333-444444444444',
        branchId: 'b1b2c3d4-4444-2222-3333-444444444444',
        branchName: 'Tennis Phú Thọ',
        branchAddress: '219 Lý Thường Kiệt, Quận 11, TP.HCM',
        sportTypeId: 's-tennis',
        sportTypeName: 'Tennis',
        date: '28/09/2026',
        startTime: '07:00:00',
        endTime: '09:00:00',
        hostId: 'host-user-03',
        hostName: 'Khánh Linh',
        skillLevel: 'Cơ bản',
        missingPlayers: 1,
        availableSlots: 1,
        feePerPlayer: 110000,
        approvalMode: 0, // Tự động nhận
        status: SocialMatchStatus.Open,
        description: 'Tennis đánh đơn buổi sáng nhẹ nhàng khởi động ngày mới.',
        createdAt: '2026-09-22T10:00:00Z',
        confirmedParticipantsCount: 1,
      },
    ],
    [user]
  );

  const rawMatches = pagedData?.items && pagedData.items.length > 0 ? pagedData.items : fallbackMatches;

  // Lọc dữ liệu theo tab và khu vực
  const filteredMatches = useMemo(() => {
    return rawMatches.filter((match) => {
      // 1. Lọc theo tab
      if (activeTab === 'my-matches') {
        if (!user) return false;
        if (match.hostId !== user.id) return false;
      } else if (activeTab === 'joined') {
        // Có thể mở rộng kiểm tra danh sách participant nếu có
      } else if (activeTab === 'football') {
        if (!match.sportTypeName?.toLowerCase().includes('bóng đá')) return false;
      } else if (activeTab === 'badminton') {
        if (!match.sportTypeName?.toLowerCase().includes('cầu lông')) return false;
      } else if (activeTab === 'pickleball') {
        if (!match.sportTypeName?.toLowerCase().includes('pickleball')) return false;
      } else if (activeTab === 'tennis') {
        if (!match.sportTypeName?.toLowerCase().includes('tennis')) return false;
      }

      // 2. Lọc theo khu vực
      if (selectedDistrict !== 'Gần bạn') {
        const addr = (match.branchAddress + ' ' + match.branchName).toLowerCase();
        if (!addr.includes(selectedDistrict.toLowerCase())) return false;
      }

      return true;
    });
  }, [rawMatches, activeTab, selectedDistrict, user]);

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        {/* Header Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/60 pb-8">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-black uppercase tracking-widest text-[#235338] dark:text-emerald-400">
              CỘNG ĐỒNG MATCHDAY
            </span>
            <h1 className="font-heading font-black text-4xl sm:text-6xl text-foreground tracking-tight leading-none">
              KÈO ĐANG CHỜ BẠN
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium pt-1">
              Tìm một trận vừa lịch, đúng trình độ và gặp thêm những người cùng sở thích.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => navigate('/matches/create')}
            className="bg-[#235338] hover:bg-[#1b432d] text-white font-bold text-sm px-6 py-5 rounded-xl shadow-md gap-2 self-start sm:self-auto cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Plus className="size-5" />
            <span>+ Mở kèo mới</span>
          </Button>
        </div>

        {/* Bar Tabs & Dropdown Khu vực */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Danh sách tab môn thể thao */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
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

          {/* Dropdown Khu vực */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              KHU VỰC
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-border/80 bg-card text-xs font-bold gap-2 px-3 shadow-xs"
                >
                  <MapPin className="size-3.5 text-[#235338]" />
                  <span>{selectedDistrict}</span>
                  <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-border/80 w-40">
                {DISTRICT_OPTIONS.map((dist) => (
                  <DropdownMenuItem
                    key={dist}
                    onClick={() => setSelectedDistrict(dist)}
                    className="text-xs font-semibold cursor-pointer"
                  >
                    {dist}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Section Subheader */}
        <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#235338]">
              {filteredMatches.length} KÈO
            </span>
            <h2 className="font-heading font-black text-2xl text-foreground tracking-tight">
              Chọn trận để tham gia
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Cập nhật hôm nay
          </span>
        </div>

        {/* Grid thẻ kèo */}
        {isLoading ? (
          <div className="py-20 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <RefreshCw className="size-4 animate-spin text-[#235338]" />
            <span>Đang tải danh sách kèo giao lưu...</span>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-border bg-card p-8">
            <p className="text-base font-bold text-foreground">
              Chưa có kèo nào phù hợp với bộ lọc hiện tại.
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Hãy thử chọn môn thể thao khác, đổi khu vực hoặc tự mở một kèo mới để tìm đồng đội nhé!
            </p>
            <Button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setSelectedDistrict('Gần bạn');
              }}
              variant="outline"
              size="sm"
              className="mt-2 text-xs font-bold rounded-xl"
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
