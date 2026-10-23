import { useState, useMemo } from 'react';
import { Search, MoreHorizontal, CheckCircle, Ban, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useUsersQuery,
  useToggleUserStatusMutation,
  useSoftDeleteUserMutation,
  useRestoreUserMutation,
  type UserItem,
} from '@/api/users';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

/**
 * Trang Quản lý người dùng - Cổng Quản Trị Hệ Thống CourtOS
 * Thiết kế giao diện pixel-perfect theo tài liệu thiết kế.
 * Cơ chế Xóa mềm (Soft Delete): Lưu giữ toàn vẹn lịch sử dữ liệu và hỗ trợ khôi phục.
 */
export function UsersPage() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  // Status mapping cho API: 'active' -> 0, 'locked' -> 1
  const statusParam = useMemo(() => {
    if (selectedStatus === 'active') return 0;
    if (selectedStatus === 'locked') return 1;
    return undefined;
  }, [selectedStatus]);

  const { data, isLoading } = useUsersQuery({
    search: debouncedSearch,
    accountType: 0, // Người dùng / Người chơi (Player)
    status: statusParam,
    includeDeleted: true, // Hiển thị cả tài khoản đã xóa mềm
    page: 1,
    pageSize: 10,
  });

  const { mutateAsync: toggleStatus } = useToggleUserStatusMutation();
  const { mutateAsync: softDeleteUser } = useSoftDeleteUserMutation();
  const { mutateAsync: restoreUser } = useRestoreUserMutation();

  /**
   * Tạo chữ cái viết tắt đại diện Avatar theo chuẩn tiếng Việt:
   * Ví dụ: "Lê Thảo Vy" -> "TV", "Nguyễn Ngọc Anh" -> "NA", "Đặng Thu Hà" -> "TH", "Bùi Gia Khánh" -> "GK"
   */
  const getInitials = (name?: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 3) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const users = data?.items || [];

  // Lọc danh sách theo trạng thái
  const filteredUsers = useMemo(() => {
    if (selectedStatus === 'all') return users;
    return users.filter((u: UserItem) => {
      if (selectedStatus === 'active') return !u.isDeleted && u.status === 'active';
      if (selectedStatus === 'locked') return !u.isDeleted && u.status === 'inactive';
      if (selectedStatus === 'deleted') return u.isDeleted;
      return true;
    });
  }, [users, selectedStatus]);

  const totalCount = filteredUsers.length;

  // Thao tác khóa / mở khóa tài khoản
  const handleToggleStatus = async (item: UserItem) => {
    try {
      const isCurrentlyActive = item.status === 'active';
      const newStatusNumber = isCurrentlyActive ? 1 : 0; // 1 = Inactive (Đã khóa), 0 = Active (Hoạt động)
      await toggleStatus({ userId: item.id, status: newStatusNumber });
      toast.success(
        newStatusNumber === 1
          ? `Đã khóa tài khoản ${item.name}. Trạng thái cập nhật: Đã khóa.`
          : `Đã mở khóa tài khoản ${item.name}. Trạng thái cập nhật: Hoạt động.`
      );
    } catch {
      toast.error('Cập nhật trạng thái thất bại. Vui lòng thử lại.');
    }
  };

  // Xác nhận xóa mềm người dùng
  const confirmSoftDelete = async () => {
    if (!userToDelete) return;
    const target = userToDelete;
    setUserToDelete(null);

    try {
      await softDeleteUser(target.id);
      toast.success(`Đã xóa tài khoản ${target.name}. Trạng thái cập nhật: Đã xóa.`);
    } catch {
      toast.error('Xóa người dùng thất bại. Vui lòng thử lại.');
    }
  };

  // Khôi phục tài khoản đã xóa mềm
  const handleRestore = async (item: UserItem) => {
    try {
      await restoreUser(item.id);
      toast.success(`Đã khôi phục tài khoản ${item.name}. Trạng thái cập nhật: Hoạt động.`);
    } catch {
      toast.error('Khôi phục người dùng thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header khu vực làm việc (Breadcrumb & Tiêu đề trang) */}
      <div>
        <div className="text-[10px] font-mono font-extrabold tracking-widest text-emerald-400 uppercase mb-1">
          WORKSPACE / USERS
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Quản lý người dùng
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Quản lý tài khoản người dùng đặt sân trên nền tảng.
        </p>
      </div>

      {/* 2. Thanh tìm kiếm & Dropdown lọc trạng thái */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Ô tìm kiếm */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#0f2218] border border-[#1a3828] pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
          />
        </div>

        {/* Dropdown Trạng thái */}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="h-10 min-w-[150px] w-auto rounded-xl border border-[#1a3828] bg-[#0f2218] text-xs text-white focus:ring-1 focus:ring-emerald-500/40 transition-all cursor-pointer">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-auto rounded-xl border border-[#1a3828] bg-[#0c1a12] text-zinc-200 shadow-xl z-50">
            <SelectItem value="all" className="text-xs cursor-pointer">
              Tất cả trạng thái
            </SelectItem>
            <SelectItem value="active" className="text-xs cursor-pointer">
              Hoạt động
            </SelectItem>
            <SelectItem value="locked" className="text-xs cursor-pointer">
              Đã khóa
            </SelectItem>
            <SelectItem value="deleted" className="text-xs cursor-pointer">
              Đã xóa
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. Card Bảng danh sách người dùng chuẩn CourtOS Console */}
      <div className="rounded-2xl border border-[#17261d] bg-[#0c1611] overflow-hidden shadow-xl shadow-emerald-950/20">
        {/* Header trên của Card */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#17261d]">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold text-white">Danh sách người dùng</h3>
            <span className="flex items-center justify-center size-5 rounded-md bg-[#16271e] text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
              {totalCount}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Cập nhật trong phiên làm việc
          </span>
        </div>

        {/* Nội dung bảng */}
        {isLoading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 py-2 border-b border-[#16241c]/50 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-xl bg-zinc-800" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32 bg-zinc-800" />
                    <Skeleton className="h-3 w-40 bg-zinc-800" />
                  </div>
                </div>
                <Skeleton className="h-4 w-28 bg-zinc-800" />
                <Skeleton className="h-5 w-24 rounded-full bg-zinc-800" />
                <Skeleton className="h-5 w-20 rounded-full bg-zinc-800" />
                <Skeleton className="size-8 rounded-lg bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            Không tìm thấy tài khoản người dùng nào khớp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0a120e] text-[10px] uppercase font-bold tracking-wider text-emerald-400/90 border-b border-[#17261d]">
                <tr>
                  <th className="px-5 py-3.5">Họ và tên</th>
                  <th className="px-5 py-3.5">Số điện thoại</th>
                  <th className="px-5 py-3.5">Phân quyền</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17261d]/80 text-xs">
                {filteredUsers.map((item: UserItem) => (
                  <tr
                    key={item.id}
                    className="bg-[#0c1611] hover:bg-[rgba(249,115,22,0.16)] transition-all duration-200 group"
                  >
                    {/* Cột 1: Avatar + Tên + Email */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 group-hover:bg-amber-500/15 group-hover:border-amber-500/50 group-hover:text-amber-300 font-extrabold flex items-center justify-center text-xs shrink-0 select-none shadow-xs transition-colors">
                          {getInitials(item.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-emerald-400 group-hover:text-amber-300 text-xs sm:text-sm truncate transition-colors">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-emerald-300/80 group-hover:text-amber-200/90 truncate mt-0.5 font-medium transition-colors">
                            {item.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Số điện thoại */}
                    <td className="px-5 py-3.5 text-zinc-300 font-mono text-[11px]">
                      {item.phoneNumber || '—'}
                    </td>

                    {/* Cột 3: Phân quyền */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-lg bg-[#14211a] px-2.5 py-1 text-[11px] font-semibold text-zinc-300 border border-[#1f3126]">
                        Người dùng · User
                      </span>
                    </td>

                    {/* Cột 4: Trạng thái (Hoạt động / Đã khóa / Đã xóa mềm) */}
                    <td className="px-5 py-3.5">
                      {item.isDeleted ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-400 border border-zinc-700/40">
                          <span className="size-1.5 rounded-full bg-zinc-500" />
                          Đã xóa
                        </span>
                      ) : item.status === 'inactive' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-red-400 border border-red-500/30">
                          <span className="size-1.5 rounded-full bg-red-500" />
                          Đã khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/25">
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          Hoạt động
                        </span>
                      )}
                    </td>

                    {/* Cột 5: Thao tác */}
                    <td className="px-5 py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 inline-flex items-center justify-center transition-colors cursor-pointer"
                            title="Thao tác"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-52 rounded-xl border border-[#1b2b22] bg-[#0f1713] text-zinc-200 shadow-xl p-1"
                        >
                          <DropdownMenuLabel className="text-[10px] text-zinc-500 uppercase tracking-wider px-2 py-1">
                            Tùy chọn tài khoản
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-[#1b2b22]" />

                          {item.isDeleted ? (
                            <DropdownMenuItem
                              onClick={() => handleRestore(item)}
                              className="text-xs cursor-pointer hover:bg-zinc-800/50 flex items-center gap-2 text-emerald-400"
                            >
                              <RotateCcw className="size-3.5" />
                              <span>Khôi phục tài khoản</span>
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(item)}
                                className="text-xs cursor-pointer hover:bg-zinc-800/50 flex items-center gap-2"
                              >
                                {item.status === 'active' ? (
                                  <>
                                    <Ban className="size-3.5 text-red-400" />
                                    <span>Khóa tài khoản</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="size-3.5 text-emerald-400" />
                                    <span>Kích hoạt tài khoản</span>
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => setUserToDelete(item)}
                                className="text-xs cursor-pointer hover:bg-rose-950/40 text-rose-400 flex items-center gap-2"
                              >
                                <Trash2 className="size-3.5" />
                                <span>Xóa người dùng</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer của Bảng */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#17261d] bg-[#0a110d] text-xs text-zinc-400">
          <div>
            Hiển thị <span className="text-zinc-300 font-semibold">{totalCount}</span> /{' '}
            <span className="text-zinc-300 font-semibold">{totalCount}</span> tài khoản
          </div>
          <div>Trang 1 / 1</div>
        </div>
      </div>

      {/* Modal xác nhận xóa người dùng */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="max-w-md bg-[#0c1410] border border-[#1b2b22] text-white p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="size-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              Xác nhận xóa tài khoản
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 leading-relaxed space-y-2">
              <span>
                Bạn có chắc chắn muốn xóa tài khoản của{' '}
                <strong className="text-white">{userToDelete?.name}</strong> (
                <span className="font-mono text-zinc-300">{userToDelete?.email}</span>)?
              </span>
              <span className="text-zinc-300 block bg-[#111915] p-3 rounded-xl border border-[#1b2b22] mt-3">
                🛡️ Tài khoản sẽ được chuyển sang trạng thái <strong>Đã xóa</strong>. Dữ liệu lịch sử đặt sân vẫn được bảo toàn và bạn có thể <strong>khôi phục lại bất kỳ lúc nào</strong>.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex flex-row gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setUserToDelete(null)}
              className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-xl h-10 px-4"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={confirmSoftDelete}
              className="text-xs bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl h-10 px-4 cursor-pointer"
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
