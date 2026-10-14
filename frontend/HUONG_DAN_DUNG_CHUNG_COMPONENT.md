Email: owner@courtbooking.com
Mật khẩu: Owner@123456

Cách 1: Chạy toàn bộ Backend bằng Docker (Nhanh & Tiện nhất khi làm FE)
Dùng cách này khi bạn tập trung làm giao diện (Frontend) hoặc kiểm thử hệ thống mà không cần sửa code C#.

Bật ứng dụng Docker Desktop trên máy tính.
Khởi động Backend: Mở PowerShell (hoặc Terminal) và gõ:
powershell
cd d:\DoAN\QLDA_DOTNET\CourtBooking\backend\CourtBooking
docker compose up -d
(Lệnh này sẽ tự khởi chạy SQL Server, SeaweedFS, Seq và container API courtbooking-api).
Khởi động Frontend: Mở thêm 1 tab terminal khác và gõ:
powershell
cd d:\DoAN\QLDA_DOTNET\CourtBooking\frontend
npm run dev
Để tắt Backend khi dùng xong:
powershell
cd d:\DoAN\QLDA_DOTNET\CourtBooking\backend\CourtBooking
docker compose down
TIP

Nếu bạn có sửa code C# bên Backend và muốn Docker cập nhật lại bản mới nhất, chỉ cần thêm cờ --build: docker compose up -d --build courtbooking.api
# 📘 CẨM NANG & HƯỚNG DẪN PHÁT TRIỂN GIAO DIỆN CHỦ SÂN (OWNER PORTAL)
### *Dành cho Thành Viên Nhóm & Hướng Dẫn Kèm Prompt Chuẩn Cho AI Coding Agent*

> **MỤC TIÊU CỐT LÕI:**
> Đảm bảo toàn bộ 12 màn hình quản lý của Chủ sân (*Lịch đặt, Danh mục, Quản lý sân, Chi nhánh, Bảng giá, Sản phẩm, POS...*) **ĐỒNG BỘ 100% GIAO DIỆN THEO CHUẨN FIGMA MATCHDAY**.
> 
> ⚠️ **QUY TẮC BẮT BUỘC:** Không tự ý code lại Sidebar, Header, Table từ đầu. Mọi trang đều được lắp ghép từ **Bộ Lego Component dùng chung** có sẵn tại `src/features/court-owners/components/shared/` và kết nối API qua tầng tập trung `src/api/`.

---

## 🏛️ 1. Kiến Trúc Dự Án Đã Chuẩn Hóa (Cần Hiểu Rõ)

Dự án hiện tại được tổ chức rất chặt chẽ theo các tầng chính:

1. **Tầng API tập trung (`src/api/`):**
   * Mọi thao tác gọi Backend (Queries, Mutations, Types DTOs) được gom vào `src/api/<tên-module>/`.
   * Ví dụ: Chi nhánh ở `src/api/branches/`, Tài khoản ở `src/api/auth/`, Danh mục dịch vụ ở `src/api/service-categories/`.
   * Sử dụng instance Axios cấu hình sẵn JWT tại `@/api/axiosClient`.
   * Khi làm trang mới (ví dụ Lịch đặt, Danh mục, Sân con), hãy tạo hook API tại `src/api/<tên-module>/use<Module>.ts`.

2. **Khung giao diện bao ngoài Chủ sân (`OwnerLayout` & `OwnerProtectedRoute`):**
   * Vị trí: `src/components/layouts/OwnerLayout.tsx` (đi kèm `OwnerHeader.tsx` và `OwnerSidebar.tsx`).
   * Tách biệt hoàn toàn với `AdminLayout` (dành riêng cho Super Admin hệ thống).
   * Đã có sẵn **Sidebar 12 mục menu** chuẩn Figma Matchday (active xanh neon `#a3e635`).
   * Đã có sẵn **Header** chọn chi nhánh cụm sân (kết nối trực tiếp từ Backend), nút switch Dark/Light, chuông thông báo, avatar.
   * Vị trí hiển thị nội dung chính của từng trang được đánh dấu bằng thẻ `<Outlet />`.
   * Được bảo vệ tự động bằng `OwnerProtectedRoute` (yêu cầu đăng nhập tài khoản Chủ sân).
   * 👉 **Bạn KHÔNG CẦN và KHÔNG ĐƯỢC code lại Sidebar/Header trong file trang con!**

3. **Cấu hình đường dẫn tại `src/app/router.tsx`:**
   * Tất cả các trang của Chủ sân đều nằm trong nhánh `/owner/...` và được bọc bởi `OwnerLayout`.
   * Khi tạo trang mới, chỉ cần khai báo thêm 1 dòng vào danh sách `children` của route `/owner`.

4. **Tầng tiện ích & Dữ liệu (`src/lib/` & `src/data/`):**
   * Định dạng tiền tệ và ngày giờ: Dùng `@/lib/format` (`formatVND`, `formatDate`, `formatDateTime`, `formatPhone`).
   * Dữ liệu địa chỉ hành chính Việt Nam: Đặt tại `src/data/province.json` và `src/data/ward.json`, tra cứu qua `@/lib/vietnamLocations`.

---

## 🧩 2. Danh Sách Các "Khối Lego" Dùng Chung (Import & Sử Dụng)

Tất cả các khối dùng chung cho Chủ sân được lưu tập trung tại:
```tsx
import { 
  OwnerPageHeader, 
  OwnerFilterBar, 
  OwnerStatusBadge, 
  OwnerPagination,
  OwnerModal 
} from '@/features/court-owners/components/shared';
// Hoặc import ngắn gọn: from '@/features/court-owners/components';

import { CommonTable, ColumnDef } from '@/components/common/CommonTable';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/lib/format';
```

### Bảng tra cứu component và công dụng:

| Component | Vị trí thư mục | Mục đích sử dụng | Props quan trọng |
| :--- | :--- | :--- | :--- |
| **`OwnerPageHeader`** | `components/shared/` | Tiêu đề trang H1 + Phân mục nhỏ + Cụm nút hành động bên phải | `title`, `category`, `actions` |
| **`OwnerFilterBar`** | `components/shared/` | Thanh tìm kiếm + Tabs phân loại có gạch chân neon + Dropdown lọc | `tabs`, `activeTab`, `onTabChange`, `searchValue`, `onSearchChange`, `children` |
| **`CommonTable`** | `components/common/` | Bảng dữ liệu tự động có viền bo góc, hover mượt, skeleton loading, empty state | `columns`, `data`, `isLoading`, `onRowClick`, `containerClassName` |
| **`OwnerStatusBadge`** | `components/shared/` | Huy hiệu trạng thái tự động nhận diện từ khóa để ra đúng màu Figma | `status` (chuỗi trạng thái bất kỳ), `variant` |
| **`OwnerPagination`** | `components/shared/` | Thanh phân trang dưới cùng ("Hiển thị X - Y kết quả" + Nút Trước / Tiếp) | `currentPage`, `pageSize`, `totalItems`, `onPageChange` |
| **`OwnerModal`** | `components/shared/` | Hộp thoại thêm mới / chỉnh sửa chuẩn nền tối `#0B1324` bo tròn `rounded-2xl` | `open`, `onOpenChange`, `title`, `onSubmit`, `onCancel`, `submitText`, `cancelText` |

> 💡 **Lưu ý về Component riêng của từng màn hình:**
> Nếu màn hình của bạn có các component phức tạp riêng biệt (ví dụ trang Chi nhánh có Modal form lớn 4 bước, thẻ Card chi nhánh riêng...), hãy tạo thư mục con tại:
> `src/features/court-owners/components/<tên-màn-hình>/` (Ví dụ đã có sẵn: `components/branches/BranchFormModal.tsx`).

---

## 🎨 3. Quy Ước Thiết Kế Chuẩn Matchday (Bắt Buộc Nhớ)

1. **Nút hành động chính (Primary Button / Thêm mới / Đặt sân):**
   * Luôn dùng màu **Xanh Neon Thể Thao (`#a3e635`)**, chữ đen đậm, bo góc `rounded-xl`:
   ```tsx
   <Button className="h-9.5 rounded-xl bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold shadow-xs gap-1.5">
     <Plus className="size-4 stroke-[2.5]" />
     <span>Tạo mới...</span>
   </Button>
   ```

2. **Nút phụ / Xuất báo cáo / Bộ lọc:**
   * Dùng nút viền tối:
   ```tsx
   <Button variant="outline" className="h-9.5 rounded-xl border-border/60 bg-card/60 hover:bg-accent font-medium gap-2">
     <FileDown className="size-4" /> Xuất file
   </Button>
   ```

3. **Nút thao tác trên từng dòng bảng (Actions):**
   * Nút Sửa (Pencil): Ô vuông bo góc nhỏ `size-8 rounded-lg border border-border/60 bg-card/60 hover:bg-accent`
   * Nút Xóa (Trash): Ô vuông bo góc nhỏ `size-8 rounded-lg border border-border/60 bg-card/60 hover:bg-destructive/20 hover:text-destructive`

4. **Trạng thái màu sắc (`OwnerStatusBadge`):**
   * Component tự động đổi màu khi truyền chuỗi:
     * Chứa chữ `đang sử dụng`, `hoạt động`, `đã thanh toán` ➔ **Xanh Neon (`#a3e635`)**
     * Chứa chữ `hủy`, `chưa thanh toán`, `bảo trì`, `từ chối` ➔ **Đỏ Rose**
     * Chứa chữ `chờ`, `tạm giữ` ➔ **Vàng Amber**
     * Chứa chữ `hoàn thành` ➔ **Xám Slate**

5. **Form Input trong Modal (`OwnerModal`):**
   * Ô Input nền tối `#080E1C`, viền focus xanh neon `#a3e635`:
   ```tsx
   <input 
     className="w-full h-12 rounded-xl bg-[#080E1C] px-4 text-sm text-white placeholder:text-muted-foreground/60 border border-border/70 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
     placeholder="..."
   />
   ```

---

## 💻 4. Code Mẫu Hoàn Chỉnh (Template) Để Copy Tạo Trang Mới

Khi tạo một trang mới (ví dụ: `src/features/court-owners/pages/CourtsPage.tsx`), copy đoạn mã chuẩn dưới đây:

```tsx
import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommonTable, ColumnDef } from '@/components/common/CommonTable';
import { formatVND } from '@/lib/format';
import {
  OwnerPageHeader,
  OwnerFilterBar,
  OwnerStatusBadge,
  OwnerPagination,
  OwnerModal,
} from '@/features/court-owners/components/shared';

// 1. Khai báo kiểu dữ liệu của màn hình
interface CourtItem {
  id: string;
  code: string;
  name: string;
  sportType: string;
  pricePerHour: number;
  status: string; // 'Hoạt động' | 'Bảo trì' | 'Đang sử dụng'
}

const mockData: CourtItem[] = [
  { id: '1', code: 'SAN-01', name: 'Sân cầu lông 1 (Thảm VIP)', sportType: 'Cầu lông', pricePerHour: 120000, status: 'Đang sử dụng' },
  { id: '2', code: 'SAN-02', name: 'Sân cầu lông 2 (Thảm tiêu chuẩn)', sportType: 'Cầu lông', pricePerHour: 100000, status: 'Hoạt động' },
  { id: '3', code: 'SAN-03', name: 'Sân Pickleball VIP 1', sportType: 'Pickleball', pricePerHour: 150000, status: 'Bảo trì' },
];

export function CourtsPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: 100000 });

  // Lọc tìm kiếm
  const filteredData = useMemo(() => {
    return mockData.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // 2. Định nghĩa danh sách cột hiển thị trên bảng
  const columns: ColumnDef<CourtItem>[] = [
    {
      header: 'MÃ SÂN',
      headerClassName: 'text-xs font-semibold text-muted-foreground w-[120px]',
      cell: (item) => <span className="font-bold text-foreground">{item.code}</span>,
    },
    {
      header: 'TÊN SÂN',
      headerClassName: 'text-xs font-semibold text-muted-foreground min-w-[200px]',
      cell: (item) => (
        <div>
          <div className="font-bold text-foreground">{item.name}</div>
          <div className="text-xs text-muted-foreground">{item.sportType}</div>
        </div>
      ),
    },
    {
      header: 'GIÁ / GIỜ',
      headerClassName: 'text-xs font-semibold text-muted-foreground min-w-[140px]',
      cell: (item) => (
        <span className="font-semibold text-foreground">
          {formatVND(item.pricePerHour)}
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
      headerClassName: 'text-xs font-semibold text-muted-foreground text-right w-[110px] pr-4',
      className: 'text-right pr-4',
      cell: (item) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => alert(`Sửa ${item.name}`)}
            className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-card/60 hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => alert(`Xóa ${item.name}`)}
            className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-card/60 hover:bg-destructive/20 hover:text-destructive text-muted-foreground"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Tiêu đề trang + Nút thêm mới */}
      <OwnerPageHeader
        category="Quản lý cơ sở"
        title="Danh sách sân"
        actions={
          <>
            <Button variant="outline" className="gap-2 h-9.5 rounded-xl border-border/60 bg-card/60">
              <FileDown className="size-4" /> Xuất file
            </Button>
            <Button
              className="gap-1.5 bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold h-9.5 rounded-xl shadow-xs"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="size-4 stroke-[2.5]" /> Tạo mới sân
            </Button>
          </>
        }
      />

      {/* 2. Thanh tìm kiếm */}
      <OwnerFilterBar
        searchPlaceholder="Tìm theo mã sân, tên sân..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* 3. Bảng dữ liệu tự động bo góc, hover */}
      <CommonTable
        columns={columns}
        data={filteredData}
        emptyTitle="Chưa có sân nào"
      />

      {/* 4. Thanh phân trang */}
      <OwnerPagination
        currentPage={currentPage}
        pageSize={10}
        totalItems={mockData.length}
        onPageChange={setCurrentPage}
      />

      {/* 5. Modal Thêm Mới chuẩn Figma */}
      <OwnerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Thông tin sân"
        onSubmit={() => {
          alert('Lưu thành công');
          setIsModalOpen(false);
        }}
        submitText="Lưu thông tin"
        cancelText="Hủy"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white flex items-center gap-1">
              Tên sân <span className="text-rose-500">*</span>
            </label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập tên sân..."
              className="w-full h-12 rounded-xl bg-[#080E1C] px-4 text-sm text-white border border-border/70 focus:outline-none focus:border-[#a3e635] focus:ring-1 focus:ring-[#a3e635]"
            />
          </div>
        </div>
      </OwnerModal>
    </div>
  );
}
```

---

## 🤖 5. PROMPT CHUẨN DÀNH CHO AI AGENT (CURSOR / COPILOT / CHATGPT / CLAUDE)

> 💡 **Cách dùng cho bạn trong nhóm:**
> Khi bắt đầu làm một trang mới bằng công cụ AI (như Cursor Composer, GitHub Copilot Chat, ChatGPT, Claude, Antigravity...), hãy **copy toàn bộ nội dung trong khung dưới đây** và gửi cho AI. 
> Chỉ cần điền tên màn hình cần làm vào phần `[TÊN TRANG]`!

```markdown
Bạn là lập trình viên Frontend Senior phụ trách dự án CourtBooking (React + TypeScript + Vite + Tailwind CSS).

HÃY ĐỌC VÀ TUÂN THỦ NGHIÊM NGẶT CÁC QUY TẮC SAU ĐÂY:
1. Đọc file hướng dẫn kiến trúc: "frontend/HUONG_DAN_DUNG_CHUNG_COMPONENT.md".
2. KHÔNG TỰ CODE LẠI Sidebar, Header hay Table HTML từ đầu. Trang quản lý của Chủ sân (Owner) đã có Layout bao bọc sẵn thông qua thẻ <Outlet /> của OwnerLayout (tại src/components/layouts/OwnerLayout.tsx, bọc OwnerProtectedRoute).
3. BẮT BUỘC SỬ DỤNG các Component Lego & Tiện ích dùng chung từ:
   import {
     OwnerPageHeader,
     OwnerFilterBar,
     OwnerStatusBadge,
     OwnerPagination,
     OwnerModal,
   } from '@/features/court-owners/components/shared';
   import { CommonTable, ColumnDef } from '@/components/common/CommonTable';
   import { Button } from '@/components/ui/button';
   import { formatVND, formatDate } from '@/lib/format';

4. QUY TẮC TẦNG API:
   - Nếu viết API gọi Backend (React Query / TanStack Query), đặt tại: `src/api/[tên-module]/` (gồm `use[Module].ts`, `types.ts`, `index.ts`), export ra `src/api/index.ts`.
   - Sử dụng instance `axiosClient` từ `@/api/axiosClient`.

5. QUY ƯỚC THIẾT KẾ MATCHDAY (FIGMA):
   - Nền Dark Slate sang trọng (#0B1324).
   - Nút chính (Primary CTA): Luôn dùng màu Xanh Neon thể thao: `className="bg-[#a3e635] text-black hover:bg-[#8ece28] font-bold h-9.5 rounded-xl shadow-xs"`.
   - Nút phụ (Secondary/Export): Dùng `variant="outline"` với `className="border-border/60 bg-card/60 h-9.5 rounded-xl"`.
   - Bảng dữ liệu: Dùng CommonTable, hiển thị tiền dùng `formatVND(amount)`, ngày giờ dùng `formatDate(date)`.
   - Cột thao tác: Gồm nút Sửa (Pencil) và Xóa (Trash).
   - Modal form: Dùng OwnerModal (tiêu đề lớn, input nền tối #080E1C viền focus #a3e635, nút [Hủy] nền tối và [Lưu...] xanh neon).
   - Nếu cần chọn Tỉnh/Huyện/Xã: Dùng helper từ `@/lib/vietnamLocations` (dữ liệu tĩnh tại `src/data/`).

NHIỆM VỤ CỤ THỂ BÂY GIỜ:
- Hãy tạo trang: [ĐIỀN TÊN TRANG TẠI ĐÂY, ví dụ: Quản lý sân con (CourtsPage) / Quản lý sản phẩm (ProductsPage) / Bảng giá (PricingPage)]
- Đặt file page tại: `src/features/court-owners/pages/[TênFilePage].tsx`
- Nếu có component phức tạp riêng cho trang này, đặt tại: `src/features/court-owners/components/[tên-module]/`
- Đăng ký route tương ứng tại `src/app/router.tsx` trong nhánh `/owner/[tên-route]`.
- Tạo dữ liệu mẫu mockData phong phú, có đủ các trạng thái và hỗ trợ tương tác tìm kiếm + mở modal thêm mới/chỉnh sửa.
- Kiểm tra TypeScript để đảm bảo build không lỗi.
```

---

## 🗺️ 6. Danh Sách 12 Đường Dẫn Quản Lý Của Chủ Sân (Tham Khảo)

| STT | Tên Menu Trên Sidebar | Đường Dẫn URL | Tên File Trang Tương Ứng | Trạng Thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Tổng quan** | `/owner` | `DashboardPage.tsx` | Đang phát triển |
| 2 | **Lịch đặt sân** | `/owner/orders` | `OrdersPage.tsx` | ✅ Đã hoàn thành chuẩn mẫu |
| 3 | **Trạng thái sân** | `/owner/court-status` | `CourtStatusPage.tsx` | Chờ làm |
| 4 | **Quản lý sân** | `/owner/courts` | `CourtsPage.tsx` | Chờ làm |
| 5 | **Chi nhánh** | `/owner/branches` | `BranchesPage.tsx` | ✅ Đã kết nối API thật |
| 6 | **Giá và khung giờ** | `/owner/pricing` | `PricingPage.tsx` | Chờ làm |
| 7 | **Danh mục dịch vụ** | `/owner/service-categories`| `ServiceCategoriesPage.tsx`| ✅ Đã hoàn thành chuẩn mẫu |
| 8 | **Sản phẩm** | `/owner/products` | `ProductsPage.tsx` | Chờ làm |
| 9 | **Bán hàng tại quầy**| `/owner/pos` | `PosPage.tsx` | Chờ làm |
| 10 | **Ví và giao dịch** | `/owner/wallet` | `WalletPage.tsx` | Chờ làm |
| 11 | **Báo cáo** | `/owner/reports` | `ReportsPage.tsx` | Chờ làm |
| 12 | **Gói dịch vụ** | `/owner/packages` | `PackagesPage.tsx` | Chờ làm |

---

## 📁 7. Ba Trang Mẫu Để Tham Khảo Trực Tiếp
Khi cần xem cách ghép nối thực tế, mở 3 file mẫu chuẩn mực nhất của dự án:
1. 📄 [OrdersPage.tsx](file:///d:/DoAN/QLDA_DOTNET/CourtBooking/frontend/src/features/court-owners/pages/OrdersPage.tsx) – Trang có Tabs, Bộ lọc ngày, Bảng dữ liệu đa cột và xem chi tiết.
2. 📄 [ServiceCategoriesPage.tsx](file:///d:/DoAN/QLDA_DOTNET/CourtBooking/frontend/src/features/court-owners/pages/ServiceCategoriesPage.tsx) – Trang có Nút tạo mới, Bảng dữ liệu thao tác Sửa/Xóa và Modal form nhập liệu chuẩn Figma.
3. 📄 [BranchesPage.tsx](file:///d:/DoAN/QLDA_DOTNET/CourtBooking/frontend/src/features/court-owners/pages/BranchesPage.tsx) – Trang kết nối API Backend hoàn chỉnh, Form modal 4 bước chọn địa chỉ Việt Nam.

*(Đường dẫn xem trên trình duyệt: [http://localhost:3000/owner/orders](http://localhost:3000/owner/orders) và [http://localhost:3000/owner/service-categories](http://localhost:3000/owner/service-categories))*
