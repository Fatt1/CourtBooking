import { useState, useMemo } from 'react';
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  Ban,
  Plus,
  CalendarCheck,
  Building,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useCourtOwnersQuery,
  useCreateCourtOwnerMutation,
  useChangeCourtOwnerPackageMutation,
  useExtendCourtOwnerSubscriptionMutation,
  useUpdateCourtOwnerStatusMutation,
  type CourtOwnerItem,
} from '@/api/court-owners';
import {
  CreateCourtOwnerDialog,
  ExtendSubscriptionDialog,
  ChangePackageDialog,
} from '../components/owners';

/**
 * Trang Quản lý chủ sân - Cổng Quản Trị Hệ Thống CourtOS Admin Console
 * Thiết kế pixel-perfect khớp chuẩn xác theo giao diện mẫu người dùng cung cấp.
 */
export function CourtOwnersPage() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  // Modal states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [changePackageDialogOpen, setChangePackageDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<CourtOwnerItem | null>(null);

  // Status mapping: 'active' -> 0, 'locked' -> 1
  const statusParam = useMemo(() => {
    if (selectedStatus === 'active') return 0;
    if (selectedStatus === 'locked') return 1;
    return undefined;
  }, [selectedStatus]);

  // Queries & Mutations
  const { data, isLoading, isFetching } = useCourtOwnersQuery({
    search: debouncedSearch,
    status: statusParam,
    page,
    pageSize: 10,
  });

  const { mutateAsync: createOwner, isPending: isCreating } = useCreateCourtOwnerMutation();
  const { mutateAsync: extendSub, isPending: isExtending } = useExtendCourtOwnerSubscriptionMutation();
  const { mutateAsync: changePkg, isPending: isChangingPkg } = useChangeCourtOwnerPackageMutation();
  const { mutateAsync: updateStatus } = useUpdateCourtOwnerStatusMutation();

  const owners = data?.items || [];
  const totalCount = data?.totalCount ?? owners.length;
  const totalPages = data?.totalPages || 1;

  // Lấy 2 chữ cái đầu của tên làm Avatar
  const getInitials = (name: string) => {
    if (!name) return 'CS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const formatDateVN = (dateStr?: string) => {
    if (!dateStr) return '—';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
      if (dateStr.includes('-')) {
        const [y, m, day] = dateStr.split('T')[0].split('-');
        return `${day.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // 1. Xử lý tạo mới chủ sân
  const handleCreateOwner = async (values: any) => {
    try {
      await createOwner(values);
      toast.success(`Đã khởi tạo tài khoản Chủ sân cho ${values.fullName} thành công!`);
    } catch {
      toast.error('Có lỗi xảy ra khi tạo tài khoản Chủ sân.');
    }
  };


  // 2. Xử lý đổi gói dịch vụ
  const handleChangePackage = async (
    ownerId: string,
    newPackageId: string,
    packageName: string,
    ownerName: string,
    businessName: string,
    price: number
  ) => {
    try {
      await changePkg({
        courtOwnerId: ownerId,
        newPackageId,
        packageName,
        ownerName,
        businessName,
        price,
      });
      toast.success(`Đã đổi sang ${packageName} cho chủ sân ${ownerName} thành công!`);
    } catch {
      toast.error('Có lỗi xảy ra khi đổi gói dịch vụ.');
    }
  };

  // 3. Xử lý gia hạn gói cước
  const handleExtendSubscription = async (ownerId: string, durationMonths: number) => {
    try {
      await extendSub({ courtOwnerId: ownerId, durationMonths });
      toast.success(`Đã gia hạn thêm ${durationMonths} tháng thành công!`);
    } catch {
      toast.error('Có lỗi xảy ra khi gia hạn gói cước.');
    }
  };

  // 4. Xử lý khóa / mở khóa tài khoản
  const handleToggleStatus = async (item: CourtOwnerItem) => {
    try {
      const isCurrentlyActive = item.status === 'active';
      const newStatusNumber = isCurrentlyActive ? 1 : 0; // 1 = Inactive (Khóa), 0 = Active
      await updateStatus({ courtOwnerId: item.id, status: newStatusNumber });
      toast.success(
        newStatusNumber === 1
          ? `Đã khóa tài khoản chủ sân ${item.fullName}.`
          : `Đã mở khóa tài khoản chủ sân ${item.fullName}.`
      );
    } catch {
      toast.error('Cập nhật trạng thái chủ sân thất bại.');
    }
  };

  return (
    <div className="space-y-6 pb-6 select-none font-sans">
      {/* 1. Header: Tag, Tiêu đề, Mô tả và Nút "+ Tạo tài khoản Chủ sân mới" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-[0.18em] text-emerald-400 uppercase">
            WORKSPACE / OWNERS
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Quản lý chủ sân
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Quản lý tài khoản và cấp quyền truy cập cho chủ sân.
          </p>
        </div>

        {/* Nút chính: + Tạo tài khoản Chủ sân mới */}
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 shrink-0 self-start sm:self-auto transition-all cursor-pointer"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>Tạo tài khoản Chủ sân mới</span>
        </Button>
      </div>

      {/* 2. Thanh Tìm kiếm & Lọc trạng thái */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Ô Tìm kiếm */}
        <div className="md:col-span-9 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            className="w-full h-11 rounded-xl bg-[#0f2218] border border-[#1a3828] pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
          />
        </div>

        {/* Dropdown Lọc trạng thái */}
        <div className="md:col-span-3">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full h-11 rounded-xl bg-[#0f2218] border border-[#1a3828] px-3.5 text-xs text-white focus:ring-emerald-500/40">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent className="border border-[#1a3828] bg-[#0c1a12] text-zinc-200">
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
      </div>

      {/* 3. Bảng Danh sách chủ sân */}
      <div className="rounded-2xl border border-[#17261d] bg-[#0c1611] shadow-2xl overflow-hidden">
        {/* Top Header của Bảng: Danh sách chủ sân + Badge số lượng */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#17261d]">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Danh sách chủ sân
            </h3>
            <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md bg-[#16271e] border border-emerald-500/20 text-emerald-400 font-bold text-xs">
              {totalCount}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Cập nhật trong phiên làm việc
          </span>
        </div>

        {/* Nội dung bảng */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#17261d] bg-[#0a120e] text-[10px] font-bold text-emerald-400/90 uppercase tracking-wider">
                <th className="py-3.5 px-5 text-left">Họ và tên</th>
                <th className="py-3.5 px-5 text-center">Số điện thoại</th>
                <th className="py-3.5 px-5 text-center">Trạng thái</th>
                <th className="py-3.5 px-5 text-center">Ngày bắt đầu gói</th>
                <th className="py-3.5 px-5 text-center">Ngày hết hạn gói</th>
                <th className="py-3.5 px-5 text-center">Gói đăng ký</th>
                <th className="py-3.5 px-5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17261d]/80 text-xs">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-9 rounded-xl bg-zinc-800" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32 bg-zinc-800" />
                          <Skeleton className="h-3 w-40 bg-zinc-800/60" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <Skeleton className="h-3.5 w-24 mx-auto bg-zinc-800" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <Skeleton className="h-6 w-20 rounded-full mx-auto bg-zinc-800" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <Skeleton className="h-3.5 w-24 mx-auto bg-zinc-800" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <Skeleton className="h-3.5 w-24 mx-auto bg-zinc-800" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <Skeleton className="h-4 w-16 mx-auto bg-zinc-800" />
                    </td>
                    <td className="py-4 px-5 text-center">
                      <Skeleton className="h-7 w-7 rounded-lg mx-auto bg-zinc-800" />
                    </td>
                  </tr>
                ))
              ) : owners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <Building className="size-8 mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="text-xs">Không tìm thấy chủ sân nào phù hợp với bộ lọc.</p>
                  </td>
                </tr>
              ) : (
                owners.map((owner) => {
                  const initials = getInitials(owner.fullName);
                  const isActive = owner.status === 'active';

                  return (
                    <tr
                      key={owner.id}
                      className="bg-[#0c1611] hover:bg-[rgba(249,115,22,0.16)] transition-all duration-200 group"
                    >
                      {/* 1. Họ và tên kèm Avatar Initials */}
                      <td className="py-3.5 px-5 text-left">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 group-hover:bg-amber-500/15 group-hover:border-amber-500/50 group-hover:text-amber-300 font-extrabold flex items-center justify-center text-xs shrink-0 select-none shadow-xs transition-colors">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-emerald-400 group-hover:text-amber-300 text-xs sm:text-sm truncate transition-colors">
                              {owner.fullName}
                            </div>
                            <div className="text-[11px] text-emerald-300/80 group-hover:text-amber-200/90 truncate mt-0.5 font-medium transition-colors">
                              {owner.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Số điện thoại */}
                      <td className="py-3.5 px-5 text-center font-mono text-zinc-300">
                        {owner.phoneNumber || '—'}
                      </td>

                      {/* 3. Trạng thái (Pill Badge) */}
                      <td className="py-3.5 px-5 text-center">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                            <span className="size-1.5 rounded-full bg-emerald-400" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-[11px] font-semibold text-red-400">
                            <span className="size-1.5 rounded-full bg-red-500" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      {/* 4. Ngày bắt đầu gói */}
                      <td className="py-3.5 px-5 text-center whitespace-nowrap font-medium text-zinc-300">
                        {formatDateVN(owner.packageStartDate)}
                      </td>

                      {/* 5. Ngày hết hạn gói */}
                      <td className="py-3.5 px-5 text-center whitespace-nowrap font-medium text-zinc-300">
                        <div>{formatDateVN(owner.packageEndDate)}</div>
                        {owner.packageEndDate && owner.remainingDays !== undefined && (
                          owner.remainingDays > 0 ? (
                            <div className="text-[10px] text-amber-400 font-medium">
                              Còn {owner.remainingDays} ngày
                            </div>
                          ) : (
                            <div className="text-[10px] text-rose-400 font-medium">
                              Đã hết hạn
                            </div>
                          )
                        )}
                      </td>

                      {/* 6. Gói đăng ký: Chức năng Đổi gói */}
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOwner(owner);
                            setChangePackageDialogOpen(true);
                          }}
                          className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          Đổi gói
                        </button>
                      </td>

                      {/* 7. Thao tác: Menu Dropdown 3 chấm (•••) */}
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="size-8 rounded-lg border border-transparent hover:border-[#1b2b22] hover:bg-[#16241c] text-zinc-400 hover:text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Thao tác"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-48 rounded-xl border border-[#1b2b22] bg-[#0c1410] text-zinc-200 shadow-2xl p-1.5"
                            >
                              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-zinc-500 px-2 py-1">
                                Tùy chọn quản trị
                              </DropdownMenuLabel>

                              {/* Gia hạn gói cước */}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedOwner(owner);
                                  setExtendDialogOpen(true);
                                }}
                                className="text-xs cursor-pointer flex items-center gap-2 hover:bg-[#111915]"
                              >
                                <CalendarCheck className="size-3.5 text-emerald-400" />
                                <span>Gia hạn gói cước</span>
                              </DropdownMenuItem>

                              {/* Đổi gói dịch vụ */}
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedOwner(owner);
                                  setChangePackageDialogOpen(true);
                                }}
                                className="text-xs cursor-pointer flex items-center gap-2 hover:bg-[#111915]"
                              >
                                <RotateCcw className="size-3.5 text-emerald-400" />
                                <span>Đổi gói dịch vụ</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="bg-[#1b2b22] my-1" />

                              {/* Khóa / Mở khóa */}
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(owner)}
                                className="text-xs cursor-pointer flex items-center gap-2 hover:bg-[#111915]"
                              >
                                {isActive ? (
                                  <>
                                    <Ban className="size-3.5 text-red-400" />
                                    <span>Khóa tài khoản</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="size-3.5 text-emerald-400" />
                                    <span>Mở khóa tài khoản</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer của Bảng: Hiển thị 4 / 4 tài khoản & Phân trang */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-[#17261d] bg-[#0a110d] text-xs text-zinc-400 gap-3">
          <div>
            Hiển thị <span className="font-semibold text-zinc-300">{owners.length}</span> /{' '}
            <span className="font-semibold text-zinc-300">{totalCount}</span> tài khoản
          </div>

          <div>
            Trang <span className="font-semibold text-zinc-300">{page}</span> / {totalPages}
          </div>
        </div>
      </div>

      {/* 4. Các Dialog Modal Tương Tác */}
      <CreateCourtOwnerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateOwner}
        isSubmitting={isCreating}
      />

      <ChangePackageDialog
        open={changePackageDialogOpen}
        onOpenChange={setChangePackageDialogOpen}
        owner={selectedOwner}
        onSubmit={handleChangePackage}
        isSubmitting={isChangingPkg}
      />

      <ExtendSubscriptionDialog
        open={extendDialogOpen}
        onOpenChange={setExtendDialogOpen}
        owner={selectedOwner}
        onSubmit={handleExtendSubscription}
        isSubmitting={isExtending}
      />
    </div>
  );
}
