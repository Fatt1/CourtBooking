# 📘 HƯỚNG DẪN DÙNG CHUNG COMPONENT CHO TEAM (GIAO DIỆN CHỦ SÂN / OWNER)

> **Dành cho tất cả các thành viên trong nhóm làm Frontend:**
> Để toàn bộ đồ án đạt điểm tối đa về tính thẩm mỹ và đồng bộ giao diện (UI/UX) theo chuẩn Figma **Matchday.**, tất cả các trang quản lý của Chủ sân (như *Quản lý sân, Chi nhánh, Bảng giá, Dịch vụ, Sản phẩm, Bán hàng POS, Khách hàng...*) **KHÔNG ĐƯỢC TỰ CODE LẠI TỪNG NÚT HAY TỪNG CÁI BẢNG**.
> Thay vào đó, bạn chỉ cần nhập (import) các khối "Lego" dựng sẵn dưới đây và ráp lại.

---

## 🧩 1. Danh Sách Các Khối Lego Có Sẵn (Chỉ Cần Gọi Ra)

Tất cả các khối dùng chung cho Chủ sân đều được lưu tập trung tại `src/features/court-owners/components/`:
```tsx
import { 
  OwnerPageHeader, 
  OwnerFilterBar, 
  OwnerStatusBadge, 
  OwnerPagination,
  OwnerModal 
} from '@/features/court-owners/components';

import { CommonTable, ColumnDef } from '@/components/common/CommonTable';
import { Button } from '@/components/ui/button';
```

### Chi tiết công dụng từng khối:

| Tên Component | Mục đích sử dụng | Các props chính |
| :--- | :--- | :--- |
| **`OwnerPageHeader`** | Tiêu đề trang + phân nhóm + cụm nút hành động bên phải | `title`, `category`, `actions` |
| **`OwnerFilterBar`** | Thanh tìm kiếm + Tabs phân loại + Dropdown lọc | `tabs`, `activeTab`, `onTabChange`, `searchValue`, `onSearchChange`, `children` |
| **`CommonTable`** | Bảng dữ liệu tự động có viền bo góc, hover, skeleton loading | `columns`, `data`, `isLoading`, `onRowClick` |
| **`OwnerStatusBadge`** | Hiển thị trạng thái tự động chuẩn màu (Xanh neon, Đỏ, Vàng, Xám) | `status` (chuỗi trạng thái bất kỳ) hoặc `variant` |
| **`OwnerPagination`** | Thanh phân trang dưới cùng ("Hiển thị X - Y kết quả", nút Trước/Tiếp) | `currentPage`, `pageSize`, `totalItems`, `onPageChange` |
| **`OwnerModal`** | Hộp thoại Modal thêm mới / chỉnh sửa nền tối bo tròn theo Figma | `open`, `onOpenChange`, `title`, `onSubmit`, `onCancel`, `submitText`, `cancelText` |

---

## 🚀 2. Code Mẫu Chuẩn (Template) Để Copy-Paste Tạo Trang Mới

Khi bạn được phân công làm bất kỳ trang quản trị nào (ví dụ: `CourtsPage.tsx`, `BranchesPage.tsx`, `ServicesPage.tsx`), bạn chỉ cần làm đúng **4 bước** theo template dưới đây:

```tsx
import { useState } from 'react';
import { Plus, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  OwnerPageHeader,
  OwnerFilterBar,
  OwnerStatusBadge,
  OwnerPagination,
} from '@/features/court-owners/components';
import { CommonTable, ColumnDef } from '@/components/common/CommonTable';

// 1. Định nghĩa kiểu dữ liệu của màn hình bạn đang làm
interface MyDataType {
  id: string;
  name: string;
  code: string;
  price: number;
  status: string; // 'Hoạt động' | 'Tạm dừng' | 'Bảo trì'
}

export function MyManagementPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Dữ liệu mẫu (hoặc gọi từ useQuery của TanStack Query)
  const data: MyDataType[] = [
    { id: '1', name: 'Sân số 1', code: 'COURT-01', price: 150000, status: 'Hoạt động' },
    { id: '2', name: 'Sân số 2', code: 'COURT-02', price: 150000, status: 'Bảo trì' },
  ];

  // 2. Định nghĩa các cột của bảng
  const columns: ColumnDef<MyDataType>[] = [
    {
      header: 'MÃ',
      headerClassName: 'text-xs font-semibold text-muted-foreground w-[120px]',
      cell: (item) => <span className="font-bold text-foreground">{item.code}</span>,
    },
    {
      header: 'TÊN',
      headerClassName: 'text-xs font-semibold text-muted-foreground',
      cell: (item) => <span className="font-medium text-foreground">{item.name}</span>,
    },
    {
      header: 'ĐƠN GIÁ',
      headerClassName: 'text-xs font-semibold text-muted-foreground',
      cell: (item) => (
        <span className="font-semibold text-foreground">
          {item.price.toLocaleString('vi-VN')}đ
        </span>
      ),
    },
    {
      header: 'TRẠNG THÁI',
      headerClassName: 'text-xs font-semibold text-muted-foreground w-[150px]',
      cell: (item) => <OwnerStatusBadge status={item.status} />,
    },
    {
      header: 'THAO TÁC',
      headerClassName: 'text-xs font-semibold text-muted-foreground text-right w-[100px]',
      className: 'text-right',
      cell: (item) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 rounded-lg text-xs"
          onClick={() => alert(`Xem chi tiết ${item.name}`)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* KHỐI 1: Tiêu đề trang + Nút thêm mới */}
      <OwnerPageHeader
        category="Cấu hình cơ sở"
        title="Quản lý danh sách sân"
        actions={
          <>
            <Button variant="outline" className="gap-2 h-9.5 rounded-xl">
              <FileDown className="size-4" /> Xuất file
            </Button>
            <Button
              className="gap-1.5 bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold h-9.5 rounded-xl shadow-xs"
              onClick={() => alert('Mở form thêm mới')}
            >
              <Plus className="size-4 stroke-[2.5]" /> Thêm mới
            </Button>
          </>
        }
      />

      {/* KHỐI 2: Thanh tìm kiếm */}
      <OwnerFilterBar
        searchPlaceholder="Tìm theo tên hoặc mã..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* KHỐI 3: Bảng dữ liệu tự động có viền bo góc, hover mượt mà */}
      <CommonTable
        columns={columns}
        data={data}
        emptyTitle="Chưa có dữ liệu nào"
      />

      {/* KHỐI 4: Phân trang */}
      <OwnerPagination
        currentPage={page}
        pageSize={10}
        totalItems={24}
        onPageChange={setPage}
      />
    </div>
  );
}
```

---

## 🎨 3. Quy Ước Thiết Kế Của Dự Án Matchday (Team Phải Nhớ)

1. **Nút bấm chính (Primary Action Button):**
   * Luôn dùng màu **Xanh Neon Thể Thao**:
   * `className="bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold h-9.5 rounded-xl shadow-xs"`
2. **Nút bấm phụ (Secondary / Filter / Export):**
   * Luôn dùng: `<Button variant="outline" className="border-border/60 bg-card/60 h-9.5 rounded-xl">`
3. **Màu Trạng Thái (`OwnerStatusBadge`):**
   * Component này **tự động nhận biết từ khóa** để đổi màu:
     * Chứa chữ `đang sử dụng`, `hoạt động`, `đã thanh toán` $\rightarrow$ Tự ra màu **Xanh Neon**.
     * Chứa chữ `hủy`, `chưa thanh toán`, `bảo trì`, `từ chối` $\rightarrow$ Tự ra màu **Đỏ**.
     * Chứa chữ `chờ`, `tạm giữ` $\rightarrow$ Tự ra màu **Vàng**.
     * Chứa chữ `hoàn thành` $\rightarrow$ Tự ra màu **Xám trung tính**.
4. **Không tùy tiện đổi font hay kích thước tiêu đề:**
   * Tiêu đề trang luôn để trong `<OwnerPageHeader title="..." category="..." />` để cả nhóm có cùng font size và khoảng cách lề.

---

## 📁 4. Xem Trang Mẫu Thực Tế

Trang mẫu chuẩn mực 100% theo Figma đã được dựng sẵn tại:
👉 `src/features/court-owners/pages/OrdersPage.tsx`
(Truy cập đường dẫn trên trình duyệt: `http://localhost:3000/owner/orders`)

Chúc cả nhóm code nhanh, đẹp và đồng bộ 100%!
