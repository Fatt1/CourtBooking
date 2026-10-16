import { ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { CommonTable, type ColumnDef } from '@/components/common/CommonTable';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { OwnerServiceDto } from '@/api/services';
import type { ServiceCategoryDto } from '@/api/service-categories';
import { getImageUrl } from '@/api/storage';
import { formatVND } from '@/lib/format';

interface Props {
  items: OwnerServiceDto[];
  categories: ServiceCategoryDto[];
  branchId: string;
  isLoading: boolean;
  isUpdating: boolean;
  onEdit: (id: string) => void;
  onToggle: (item: OwnerServiceDto, value: boolean) => void;
}

function ProductImage({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? <img src={src} alt={name} onError={() => setFailed(true)}
    className="size-12 rounded-lg border border-border object-cover" /> : (
    <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      <ImageIcon className="size-5" aria-label="Chưa có ảnh" />
    </div>
  );
}

export function ProductTable({ items, categories, branchId, isLoading, isUpdating, onEdit, onToggle }: Props) {
  const categoryNames = new Map(categories.map((item) => [item.id, item.name]));
  const columns: ColumnDef<OwnerServiceDto>[] = [
    {
      header: 'HÌNH ẢNH', headerClassName: 'w-[100px] whitespace-nowrap',
      cell: (item) => <ProductImage key={item.image?.key || item.image?.url || ''}
        src={getImageUrl(item.image?.key || item.image?.url)} name={item.name} />,
    },
    { header: 'TÊN SẢN PHẨM', headerClassName: 'min-w-[180px]', cell: (item) => (
      <span className={item.branches.find((branch) => branch.branchId === branchId)?.isActive ? 'font-bold' : 'font-bold text-muted-foreground'}>{item.name}</span>
    ) },
    { header: 'DANH MỤC', cell: (item) => <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{categoryNames.get(item.categoryId) ?? 'Không xác định'}</span> },
    { header: 'ĐƠN GIÁ', headerClassName: 'min-w-[150px]', cell: (item) => {
      const branch = item.branches.find((entry) => entry.branchId === branchId);
      return branch ? `${formatVND(branch.price)} / ${item.unit}` : '—';
    } },
    { header: 'ĐANG BÁN (AVAILABLE)', headerClassName: 'min-w-[160px]', cell: (item) => {
      const branch = item.branches.find((entry) => entry.branchId === branchId);
      return <Switch checked={branch?.isActive ?? false} disabled={!branch || isUpdating}
        aria-label={`Đang bán ${item.name}`} onCheckedChange={(value) => onToggle(item, value)}
        className="data-[state=checked]:bg-brand-green data-[state=unchecked]:bg-muted" />;
    } },
    { header: 'THAO TÁC', headerClassName: 'text-right', className: 'text-right', cell: (item) => (
      <Button variant="outline" className="rounded-xl" onClick={() => onEdit(item.id)} aria-label={`Sửa ${item.name}`}>Sửa</Button>
    ) },
  ];
  return <div className="overflow-x-auto"><CommonTable columns={columns} data={items} isLoading={isLoading}
    containerClassName="min-w-[800px]" emptyTitle="Không có sản phẩm phù hợp"
    emptyDescription="Thử thay đổi bộ lọc hoặc thêm sản phẩm cho chi nhánh này." /></div>;
}
