import { useState, useMemo } from 'react';
import { Plus, Search, MoreHorizontal, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserFormDialog } from '../components/UserFormDialog';
import { useUsersQuery, useCreateUserMutation, type UserItem } from '@/api/users';
import { useDebounce } from '@/hooks/useDebounce';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserFormValues } from '../schemas/userSchema';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useUsersQuery(1, debouncedSearch);
  const { mutateAsync: createUser, isPending: isCreating } = useCreateUserMutation();

  const handleCreate = async (values: UserFormValues) => {
    await createUser(values);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const users = data?.items || [];

  // Filter theo status nếu chọn
  const filteredUsers = useMemo(() => {
    if (selectedStatus === 'all') return users;
    return users.filter((u: UserItem) => {
      if (selectedStatus === 'active') return u.status === 'active';
      if (selectedStatus === 'locked') return u.status === 'inactive';
      return true;
    });
  }, [users, selectedStatus]);

  const totalCount = filteredUsers.length;

  return (
    <div className="space-y-6">
      {/* 1. Category Breadcrumb & Page Title chuẩn Figma */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold h-10 px-5 rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="size-4" />
          <span>Thêm người dùng</span>
        </Button>
      </div>

      {/* 2. Thanh tìm kiếm & Bộ lọc Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl bg-[#111915] border border-[#1b2b22] pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
          />
        </div>

        {/* Dropdown Trạng thái */}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="h-10 min-w-[140px] w-auto rounded-xl border border-[#1b2b22] bg-[#111915] text-xs text-white focus:ring-1 focus:ring-emerald-500/40 transition-all cursor-pointer">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-auto rounded-xl border border-[#1b2b22] bg-[#0f1713] text-zinc-200 shadow-xl z-50">
            <SelectItem value="all" className="text-xs cursor-pointer">
              Tất cả trạng thái
            </SelectItem>
            <SelectItem value="active" className="text-xs cursor-pointer">
              Hoạt động
            </SelectItem>
            <SelectItem value="locked" className="text-xs cursor-pointer">
              Đã khóa
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. Bảng danh sách người dùng chuẩn CourtOS */}
      <div className="rounded-2xl border border-[#16241c] bg-[#0c1410] overflow-hidden shadow-xl">
        {/* Header trên của Card Bảng */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#16241c]">
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

        {/* Bảng dữ liệu */}
        {isLoading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 py-2 border-b border-[#16241c]/50 last:border-b-0">
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
          <div className="p-8">
            <EmptyState
              title="Không tìm thấy người dùng nào"
              description="Thử tìm kiếm với từ khóa khác hoặc bấm nút thêm tài khoản người dùng mới."
              actionLabel="Thêm người dùng mới"
              onAction={() => setIsDialogOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1712] text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-[#16241c]">
                <tr>
                  <th className="px-5 py-3.5">Họ và tên</th>
                  <th className="px-5 py-3.5">Số điện thoại</th>
                  <th className="px-5 py-3.5">Phân quyền</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#16241c]/60">
                {filteredUsers.map((item: UserItem) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#111915]/80 transition-colors group"
                  >
                    {/* Cột 1: Avatar + Tên + Email */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-[#11241a] border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(item.name)}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">
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
                        {item.role === 'SystemAdmin'
                          ? 'Quản trị viên • Admin'
                          : item.role === 'CourtOwner'
                          ? 'Chủ cơ sở • Owner'
                          : 'Người dùng • User'}
                      </span>
                    </td>

                    {/* Cột 4: Trạng thái */}
                    <td className="px-5 py-3.5">
                      {item.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/25">
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-400 border border-zinc-700/40">
                          <span className="size-1.5 rounded-full bg-zinc-500" />
                          Đã khóa
                        </span>
                      )}
                    </td>

                    {/* Cột 5: Thao tác */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        className="size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 inline-flex items-center justify-center transition-colors cursor-pointer"
                        title="Thao tác"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer của Bảng */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#16241c] text-[11px] text-zinc-500 bg-[#0a110d]">
          <div>
            Hiển thị <span className="text-zinc-300 font-semibold">{totalCount}</span> /{' '}
            <span className="text-zinc-300 font-semibold">{totalCount}</span> tài khoản
          </div>
          <div>Trang 1 / 1</div>
        </div>
      </div>

      {/* Dialog tạo tài khoản */}
      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreate}
        isSubmitting={isCreating}
      />
    </div>
  );
}
