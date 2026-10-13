import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Search,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  X,
  Package,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  useUpdateOrderServicesMutation,
  type DailyOrderServiceItemDto,
  type OrderServiceInputItem,
} from '@/api/orders';
import { useServiceCategoriesQuery } from '@/api/service-categories';
import { useServicesByBranchQuery, type ServiceByBranchDto } from '@/api/services';
import { getImageUrl } from '@/api/storage';

export interface SelectedServiceItem {
  serviceId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unit?: string | null;
}

interface ProductCatalogItem {
  id: string;
  name: string;
  price: number;
  unit?: string;
  category: string;
  imageUrl?: string | null;
}


export interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'update' | 'create'; // Mặc định tự suy ra: nếu có orderId là 'update', ngược lại là 'create'
  orderId?: string;
  orderCode?: string;
  branchId?: string;
  currentServices?: DailyOrderServiceItemDto[] | SelectedServiceItem[];
  onSuccess?: () => void;
  onConfirm?: (items: SelectedServiceItem[]) => void;
  confirmText?: string;
}

export function AddServiceModal({
  open,
  onOpenChange,
  mode: propMode,
  orderId,
  orderCode,
  branchId,
  currentServices = [],
  onSuccess,
  onConfirm,
  confirmText,
}: AddServiceModalProps) {
  // Xác định mode: 'update' (cập nhật đơn hiện tại) hay 'create' (tạo đơn mới / thanh toán)
  const isUpdateMode = propMode ? propMode === 'update' : Boolean(orderId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [items, setItems] = useState<SelectedServiceItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: updateServices, isPending: isUpdating } =
    useUpdateOrderServicesMutation();

  // Khởi tạo giỏ hàng khi mở modal từ dịch vụ hiện có
  useEffect(() => {
    if (open) {
      if (currentServices && currentServices.length > 0) {
        setItems(
          currentServices.map((s) => ({
            serviceId: s.serviceId,
            name:
              'serviceName' in s
                ? (s.serviceName as string)
                : (s as SelectedServiceItem).name,
            unitPrice: s.unitPrice,
            quantity: s.quantity,
            unit: s.unit,
          }))
        );
      } else {
        setItems([]);
      }
      setSearchQuery('');
      setSelectedCategory('Tất cả');
    }
  }, [open, currentServices]);

  // Phím tắt F3 để focus nhanh vào ô tìm kiếm sản phẩm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === 'F3') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // 1. Lấy danh mục dịch vụ từ hook useServiceCategoriesQuery (GET /api/v1/owner/service-categories)
  const { data: remoteCategories } = useServiceCategoriesQuery();

  // 2. Lấy danh sách dịch vụ chi nhánh từ hook useServicesByBranchQuery (GET /api/v1/services/{branchId})
  const { data: remoteServices, isLoading: isServicesLoading } = useServicesByBranchQuery({ branchId });

  // Map categoryId sang tên danh mục từ API
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    if (remoteCategories) {
      remoteCategories.forEach((c) => {
        map.set(c.id, c.name);
      });
    }
    return map;
  }, [remoteCategories]);

  // Danh sách sản phẩm thực tế từ backend
  const productList = useMemo<ProductCatalogItem[]>(() => {
    if (!remoteServices || remoteServices.length === 0) {
      return [];
    }
    return remoteServices.map((s: ServiceByBranchDto) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      unit: s.unit,
      category: s.categoryName || categoryMap.get(s.categoryId) || 'Khác',
      imageUrl: s.image?.key ? getImageUrl(s.image.key) : null,
    }));
  }, [remoteServices, categoryMap]);

  // Lấy danh sách category duy nhất từ remoteCategories và productList
  const categories = useMemo(() => {
    const list = ['Tất cả'];
    if (remoteCategories && remoteCategories.length > 0) {
      remoteCategories.forEach((c) => {
        if (c.name && !list.includes(c.name)) list.push(c.name);
      });
      return list;
    }
    productList.forEach((p) => {
      if (p.category && !list.includes(p.category)) list.push(p.category);
    });
    return list;
  }, [remoteCategories, productList]);

  // Lọc sản phẩm theo Category và Từ khóa tìm kiếm
  const filteredProducts = useMemo(() => {
    return productList.filter((p) => {
      const matchCat =
        selectedCategory === 'Tất cả' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchCat && matchSearch;
    });
  }, [productList, selectedCategory, searchQuery]);

  // Thao tác giỏ hàng: Thêm / tăng số lượng khi click vào card
  const handleSelectProduct = (product: ProductCatalogItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.serviceId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.serviceId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          serviceId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
          unit: product.unit,
        },
      ];
    });
  };

  // Tăng số lượng
  const handleIncrement = (serviceId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.serviceId === serviceId ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  };

  // Giảm số lượng (nếu giảm về 0 thì tự động xóa)
  const handleDecrement = (serviceId: string) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.serviceId === serviceId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  // Hủy / xóa sạch toàn bộ giỏ hàng
  const handleClearCart = () => {
    if (items.length === 0) return;
    setItems([]);
  };

  // Xử lý nút bấm chính
  const handleAction = async () => {
    if (isUpdateMode) {
      // 1. CẬP NHẬT ĐƠN HÀNG ĐANG CÓ: Call API update-service
      if (!orderId) {
        toast.error('Thiếu mã đơn hàng để cập nhật dịch vụ');
        return;
      }
      try {
        const payload: OrderServiceInputItem[] = items.map((i) => ({
          serviceId: i.serviceId,
          quantity: i.quantity,
        }));

        await updateServices({
          orderId,
          services: payload,
        });

        toast.success('Đã cập nhật dịch vụ cho đơn hàng thành công!');
        onOpenChange(false);
        onSuccess?.();
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Không thể cập nhật dịch vụ';
        toast.error(msg);
      }
    } else {
      // 2. ĐANG THÊM ĐƠN HÀNG / POS: Thanh toán / Trả về danh sách dịch vụ
      onConfirm?.(items);
      toast.success('Đã xác nhận dịch vụ!');
      onOpenChange(false);
    }
  };

  // Tính tổng
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[86vh] max-h-[740px] bg-[#070D1A] border border-border/70 text-slate-100 p-0 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        <DialogTitle className="sr-only">
          {isUpdateMode ? 'Cập nhật dịch vụ đơn hàng' : 'Chọn dịch vụ & Bán lẻ POS'}
        </DialogTitle>

        {/* ================================================================= */}
        {/* CỘT TRÁI: TÌM KIẾM, DANH MỤC & GRID SẢN PHẨM */}
        {/* ================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-border/60 bg-[#070D1A]">
          {/* 1. Thanh tìm kiếm nhanh */}
          <div className="p-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm nhanh (F3)..."
                className="w-full h-10 rounded-xl bg-[#0e172a] border border-border/60 pl-10 pr-9 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#a3e635]/60 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Danh mục (Pills Tabs) */}
          <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-[#131d31] hover:bg-[#1a2742] text-slate-300 border border-border/50'
                    }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 3. Grid sản phẩm */}
          <div className="p-4 pt-1 flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
            {isServicesLoading ? (
              <div className="col-span-full py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <div className="size-6 border-2 border-[#a3e635] border-t-transparent rounded-full animate-spin" />
                <span>Đang tải danh sách dịch vụ...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <Package className="size-8 stroke-1 text-slate-600" />
                <span>Chi nhánh chưa có dịch vụ nào hoặc không tìm thấy sản phẩm</span>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const inCart = items.find((i) => i.serviceId === product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className="relative rounded-2xl bg-[#0e172a] hover:bg-[#131d31] border border-border/50 hover:border-[#a3e635]/60 p-3 flex flex-col items-center justify-between text-center transition-all cursor-pointer group shadow-xs hover:shadow-md active:scale-[0.98]"
                  >
                    {/* Badge số lượng nếu đã chọn trong giỏ */}
                    {inCart && (
                      <span className="absolute top-2 right-2 size-5 rounded-full bg-[#a3e635] text-black font-black text-[10px] flex items-center justify-center shadow-xs">
                        {inCart.quantity}
                      </span>
                    )}

                    {/* Khung ảnh sản phẩm */}
                    <div className="size-20 sm:size-24 rounded-xl bg-[#131d31] group-hover:bg-[#1a2742] flex items-center justify-center mb-2 overflow-hidden border border-border/40 transition-colors">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="size-7 text-slate-500 group-hover:text-slate-300 transition-colors" />
                      )}
                    </div>

                    {/* Tên sản phẩm */}
                    <div className="font-semibold text-xs text-slate-200 group-hover:text-white line-clamp-2 min-h-[32px] flex items-center justify-center">
                      {product.name}
                    </div>

                    {/* Giá tiền nổi bật màu lime */}
                    <div className="font-bold text-xs sm:text-sm text-[#a3e635] mt-1">
                      {product.price.toLocaleString('vi-VN')}đ
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* CỘT PHẢI: HÓA ĐƠN & DỊCH VỤ ĐÃ CHỌN */}
        {/* ================================================================= */}
        <div className="w-full md:w-[360px] lg:w-[400px] shrink-0 flex flex-col bg-[#0B1324] border-t md:border-t-0 border-border/60">
          {/* Header Hóa đơn & Nút Hủy */}
          <div className="p-4 pb-6 flex items-center justify-between border-b border-border/60">



          </div>

          {/* Danh sách các món đã chọn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center py-12 gap-2">
                <ShoppingBag className="size-8 stroke-1 text-slate-600" />
                <span>Chưa có món nào được chọn.</span>
                <span className="text-[11px] text-slate-600">
                  Nhấn vào sản phẩm bên trái để thêm vào đơn.
                </span>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.serviceId}
                  className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/40 last:border-0"
                >
                  {/* Tên & đơn giá */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="font-semibold text-xs text-white truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {item.unitPrice.toLocaleString('vi-VN')}đ
                    </div>
                  </div>

                  {/* Bộ nút Stepper [-] [số lượng] [+] */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDecrement(item.serviceId)}
                      className="size-6 rounded-lg bg-[#131d31] hover:bg-[#1a2742] border border-border/60 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleIncrement(item.serviceId)}
                      className="size-6 rounded-lg bg-[#131d31] hover:bg-[#1a2742] border border-border/60 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  {/* Thành tiền */}
                  <div className="text-right min-w-[70px] shrink-0 font-bold text-xs sm:text-sm text-white">
                    {(item.quantity * item.unitPrice).toLocaleString('vi-VN')}đ
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tổng kết & Nút hành động */}
          <div className="p-4 border-t border-border/60 bg-[#070D1A]/60 space-y-3">
            {/* Tạm tính (Không có giảm giá) */}
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Tạm tính ({totalQuantity} món)</span>
              <span className="font-semibold text-white">
                {totalPrice.toLocaleString('vi-VN')}đ
              </span>
            </div>

            {/* Tổng thu */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm sm:text-base font-bold text-white">
                Tổng thu
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#a3e635]">
                {totalPrice.toLocaleString('vi-VN')}đ
              </span>
            </div>

            {/* Nút hành động chính:
                - Nếu update order: "Cập nhật dịch vụ" (gọi API update-service)
                - Nếu đang thêm đơn hàng: "Thanh toán"
            */}
            <Button
              type="button"
              disabled={isUpdating}
              onClick={handleAction}
              className="w-full h-11 bg-[#a3e635] hover:bg-[#8ece28] text-black font-bold text-sm rounded-xl cursor-pointer shadow-lg shadow-[#a3e635]/15 transition-all"
            >
              {isUpdating
                ? 'Đang cập nhật...'
                : isUpdateMode
                  ? 'Cập nhật dịch vụ'
                  : confirmText || 'Thanh toán'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
