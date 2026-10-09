import { useState } from 'react';
import { Plus, Search, UserCheck, Shield, Building, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserFormDialog } from '../components/UserFormDialog';
import { useUsersQuery, useCreateUserMutation, type UserItem } from '../api/useUsersQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserFormValues } from '../schemas/userSchema';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useUsersQuery(1, debouncedSearch);
  const { mutateAsync: createUser, isPending: isCreating } = useCreateUserMutation();

  const handleCreate = async (values: UserFormValues) => {
    await createUser(values);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SystemAdmin':
        return (
          <Badge variant="destructive" className="gap-1">
            <Shield className="size-3" /> System Admin
          </Badge>
        );
      case 'CourtOwner':
        return (
          <Badge className="bg-primary gap-1">
            <Building className="size-3" /> Chủ Sân
          </Badge>
        );
      case 'Staff':
        return (
          <Badge variant="secondary" className="gap-1">
            <UserCheck className="size-3" /> Nhân Viên
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <User className="size-3" /> Khách Chơi
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản Lý Tài Khoản</h1>
          <p className="text-sm text-muted-foreground">
            Quản trị danh mục người dùng, cấp tài khoản chủ sân và phân quyền hệ thống.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="size-4" />
          <span>Thêm tài khoản</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email, sđt..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* User Table */}
      {isLoading ? (
        <div className="rounded-md border p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : !data?.items || data.items.length === 0 ? (
        <EmptyState
          title="Không tìm thấy người dùng nào"
          description="Thử tìm kiếm với từ khóa khác hoặc thêm người dùng mới."
          actionLabel="Thêm người dùng mới"
          onAction={() => setIsDialogOpen(true)}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item: UserItem) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.phoneNumber || '—'}</TableCell>
                <TableCell>{getRoleBadge(item.role)}</TableCell>
                <TableCell>
                  <Badge variant={item.status === 'active' ? 'success' : 'secondary'}>
                    {item.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog create user */}
      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreate}
        isSubmitting={isCreating}
      />
    </div>
  );
}
