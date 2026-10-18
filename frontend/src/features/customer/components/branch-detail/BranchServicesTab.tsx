import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Coffee, Dumbbell, ShoppingBag, Sparkles, Check } from 'lucide-react';
import { useServicesByBranchQuery } from '@/api/services';
import type { ServiceByBranchDto } from '@/api/services/types';
import { getImageUrl } from '@/api/storage/useStorage';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface SelectedServiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  type: 'buy' | 'rent';
}

interface BranchServicesTabProps {
  branchId: string;
  branchName: string;
  selectedServices: Record<string, SelectedServiceItem>;
  onUpdateQuantity: (item: SelectedServiceItem, delta: number) => void;
  onApplyServices?: () => void;
}

// Fallback catalog nếu chủ sân chưa thêm dịch vụ trên hệ thống
const FALLBACK_SERVICES: Array<ServiceByBranchDto & { type: 'buy' | 'rent'; categoryName: string }> = [
  // MUA ĐỒ - Thức uống
  {
    id: 's_drink_1',
    name: 'Nước suối Aquafina 500ml',
    unit: 'chai',
    price: 10000,
    isActive: true,
    categoryId: 'c_drink',
    categoryName: 'Thức uống',
    type: 'buy',
    branchId: '',
    image: null,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 's_drink_2',
    name: 'Nước điện giải Pocari Sweat 500ml',
    unit: 'chai',
    price: 18000,
    isActive: true,
    categoryId: 'c_drink',
    categoryName: 'Thức uống',
    type: 'buy',
    branchId: '',
    image: null,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 's_drink_3',
    name: 'Nước tăng lực Redbull Thái',
    unit: 'lon',
    price: 20000,
    isActive: true,
    categoryId: 'c_drink',
    categoryName: 'Thức uống',
    type: 'buy',
    branchId: '',
    image: null,
    createdAt: '',
    updatedAt: '',
  },
  // MUA ĐỒ - Vật phẩm thể thao
  {
    id: 's_sport_1',
    name: 'Quấn cán vợt Yonex Super Grap',
    unit: 'cái',
    price: 35000,
    isActive: true,
    categoryId: 'c_sport_items',
    categoryName: 'Vật phẩm thể thao',
    type: 'buy',
    branchId: '',
    image: null,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 's_sport_2',
    name: 'Bóng Pickleball thi đấu ngoài trời',
    unit: 'quả',
    price: 25000,
    isActive: true,
    categoryId: 'c_sport_items',
    categoryName: 'Vật phẩm thể thao',
    type: 'buy',
    branchId: '',
    image: null,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 's_sport_3',
    name: 'Vớ thể thao chống trượt dệt kim',
    unit: 'đôi',
    price: 45000,
    isActive: true,
    categoryId: 'c_sport_items',
    categoryName: 'Vật phẩm thể thao',
    type: 'buy',
    branchId: '',
    image: null,
    createdAt: '',
    updatedAt: '',
  },
  // THUÊ ĐỒ - Vật phẩm thể thao
  {
    id: 's_rent_1',
    name: 'Thuê bóng đá thi đấu FIFA Quality',
    unit: 'trận',
    price: 50000,
    isActive: true,
    categoryId: 'c_sport_rent',
    categoryName: 'Vật phẩm thể thao',
    type: 'rent',
    branchId: '',
    image: null,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 's_rent_2',
    name: 'Thuê áo Pitch tập luyện (Bộ 10 áo)',
    unit: 'bộ/trận',
    price: 40000,
    isActive: true,
    categoryId: 'c_sport_rent',
    categoryName: 'Vật phẩm thể thao',
    type: 'rent',
    branchId: '',
    image: null,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 's_rent_3',
    name: 'Thuê vợt Cầu lông / Pickleball cao cấp',
    unit: 'cây/giờ',
    price: 30000,
    isActive: true,
    categoryId: 'c_sport_rent',
    categoryName: 'Vật phẩm thể thao',
    type: 'rent',
    branchId: '',
    image: null,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 's_rent_4',
    name: 'Thuê giày thi đấu chuyên dụng',
    unit: 'đôi/giờ',
    price: 35000,
    isActive: true,
    categoryId: 'c_sport_rent',
    categoryName: 'Vật phẩm thể thao',
    type: 'rent',
    branchId: '',
    image: null,
    createdAt: '',
    updatedAt: '',
  },
];

export function BranchServicesTab({
  branchId,
  branchName,
  selectedServices,
  onUpdateQuantity,
  onApplyServices,
}: BranchServicesTabProps) {
  const [mainType, setMainType] = useState<'buy' | 'rent'>('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: apiServices = [], isLoading } = useServicesByBranchQuery({ branchId });

  // Phân loại dịch vụ từ Backend hoặc Fallback
  const allServices = useMemo(() => {
    if (apiServices && apiServices.length > 0) {
      return apiServices.map((srv) => {
        const lowerName = srv.name.toLowerCase();
        const lowerUnit = srv.unit.toLowerCase();
        const isRent =
          lowerName.includes('thuê') ||
          lowerName.includes('mượn') ||
          lowerUnit.includes('giờ') ||
          lowerUnit.includes('lượt') ||
          lowerUnit.includes('trận') ||
          lowerUnit.includes('buổi');

        // Phán đoán danh mục
        let categoryName = 'Vật phẩm thể thao';
        if (
          lowerName.includes('nước') ||
          lowerName.includes('chanh') ||
          lowerName.includes('bò húc') ||
          lowerName.includes('sting') ||
          lowerName.includes('revive') ||
          lowerName.includes('pocari') ||
          lowerName.includes('aquafina')
        ) {
          categoryName = 'Thức uống';
        } else if (lowerName.includes('bánh') || lowerName.includes('kẹo') || lowerName.includes('mì')) {
          categoryName = 'Đồ ăn';
        }

        return {
          ...srv,
          type: isRent ? ('rent' as const) : ('buy' as const),
          categoryName,
        };
      });
    }

    return FALLBACK_SERVICES;
  }, [apiServices]);

  // Lọc theo loại chính (Mua đồ vs Thuê đồ)
  const servicesByMainType = useMemo(() => {
    return allServices.filter((s) => s.type === mainType);
  }, [allServices, mainType]);

  // Danh sách các categories khả dụng trong tab hiện tại
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    servicesByMainType.forEach((s) => cats.add(s.categoryName));
    return Array.from(cats);
  }, [servicesByMainType]);

  // Lọc theo search + category con
  const filteredServices = useMemo(() => {
    return servicesByMainType.filter((s) => {
      const matchSearch =
        !searchQuery.trim() ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchCat =
        selectedCategory === 'all' || s.categoryName === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [servicesByMainType, searchQuery, selectedCategory]);

  // Gom nhóm hiển thị theo category
  const groupedByCategory = useMemo(() => {
    const map: Record<string, typeof filteredServices> = {};
    filteredServices.forEach((item) => {
      if (!map[item.categoryName]) {
        map[item.categoryName] = [];
      }
      map[item.categoryName].push(item);
    });
    return map;
  }, [filteredServices]);

  // Tính tổng số món và tiền dịch vụ đã chọn
  const totalSelectedCount = Object.values(selectedServices).reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const totalSelectedPrice = Object.values(selectedServices).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* 1. Header */}
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-[#397B48]">
          DỊCH VỤ CỦA SÂN
        </span>
        <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground tracking-tight mt-0.5">
          Thêm dịch vụ & tiện ích trọn buổi chơi
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Dễ dàng mua thức uống bổ sung thể lực hoặc thuê dụng cụ chất lượng cao ngay tại sân.
        </p>
      </div>

      {/* 2. Search Bar (Khớp khung Figma) */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm tên sản phẩm hoặc đồ thuê..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/50 border border-border/50 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-[#397B48]/30 transition-all"
        />
      </div>

      {/* 3. Main Type Selector Pills [Mua đồ] [Thuê đồ] */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMainType('buy');
              setSelectedCategory('all');
            }}
            className={cn(
              'px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs',
              mainType === 'buy'
                ? 'bg-[#183424] text-white shadow-md shadow-[#183424]/20'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            Mua đồ
          </button>
          <button
            onClick={() => {
              setMainType('rent');
              setSelectedCategory('all');
            }}
            className={cn(
              'px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs',
              mainType === 'rent'
                ? 'bg-[#183424] text-white shadow-md shadow-[#183424]/20'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            Thuê đồ
          </button>
        </div>

        {/* Sub-Category Pills [Tất cả] [Thức uống] [Vật phẩm thể thao]... */}
        {availableCategories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap',
                selectedCategory === 'all'
                  ? 'bg-[#183424] text-white'
                  : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
              )}
            >
              Tất cả
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap',
                  selectedCategory === cat
                    ? 'bg-[#183424] text-white'
                    : 'bg-secondary/80 text-muted-foreground hover:text-foreground'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Service Items Grid Grouped by Category */}
      {Object.keys(groupedByCategory).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByCategory).map(([categoryName, items]) => (
            <div key={categoryName} className="space-y-3">
              <h3 className="font-heading font-black text-sm text-[#397B48] uppercase tracking-wider">
                {categoryName}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {items.map((item) => {
                  const qty = selectedServices[item.id]?.quantity || 0;
                  const imgSrc = item.image ? getImageUrl(item.image.url || item.image.key) : '';

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-card border border-border/60 hover:border-border transition-all flex items-center justify-between gap-3 shadow-xs"
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="size-12 rounded-xl bg-secondary/80 border border-border/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {imgSrc ? (
                            <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-muted-foreground">
                              {categoryName === 'Thức uống' ? (
                                <Coffee className="size-5" />
                              ) : (
                                <Dumbbell className="size-5" />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-heading font-bold text-sm text-foreground truncate">
                            {item.name}
                          </h4>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                            {formatCurrency(item.price)} / {item.unit || 'món'}
                          </p>
                        </div>
                      </div>

                      {/* Right: Quantity Stepper [- 0 +] */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              {
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                unit: item.unit,
                                quantity: qty,
                                type: item.type,
                              },
                              -1
                            )
                          }
                          disabled={qty <= 0}
                          className={cn(
                            'size-8 rounded-full flex items-center justify-center transition-all',
                            qty > 0
                              ? 'bg-secondary hover:bg-secondary/80 text-foreground active:scale-95'
                              : 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
                          )}
                          aria-label="Giảm"
                        >
                          <Minus className="size-3.5" />
                        </button>

                        <span className="w-5 text-center font-heading font-black text-sm text-foreground">
                          {qty}
                        </span>

                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              {
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                unit: item.unit,
                                quantity: qty,
                                type: item.type,
                              },
                              1
                            )
                          }
                          className="size-8 rounded-full bg-[#183424] hover:bg-[#132A1C] text-white flex items-center justify-center transition-all active:scale-95 shadow-xs"
                          aria-label="Tăng"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/60 bg-secondary/20 space-y-2">
          <p className="font-heading font-bold text-sm text-foreground">
            Không tìm thấy sản phẩm nào khớp với tìm kiếm
          </p>
          <p className="text-xs text-muted-foreground">
            Vui lòng thử từ khóa khác hoặc chuyển sang danh mục khác.
          </p>
        </div>
      )}

      {/* 5. Sticky Bottom Summary Bar (Khớp Image 5: 0 món / 0đ / Áp dụng dịch vụ) */}
      <div className="sticky bottom-4 z-20 p-4 sm:p-5 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-xl flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground font-semibold">
            {totalSelectedCount > 0 ? `${totalSelectedCount} món đã chọn` : '0 món'}
          </div>
          <div className="font-heading font-black text-xl sm:text-2xl text-foreground">
            {formatCurrency(totalSelectedPrice)}
          </div>
        </div>

        <button
          onClick={() => {
            if (onApplyServices) {
              onApplyServices();
            } else {
              toast.success(`Đã lưu ${totalSelectedCount} món dịch vụ vào đơn đặt!`);
            }
          }}
          disabled={totalSelectedCount === 0}
          className={cn(
            'px-6 py-3 rounded-xl font-heading font-bold text-xs sm:text-sm text-white transition-all shadow-md',
            totalSelectedCount > 0
              ? 'bg-[#183424] hover:bg-[#132A1C] active:scale-95 shadow-[#183424]/30'
              : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
          )}
        >
          Áp dụng dịch vụ
        </button>
      </div>
    </div>
  );
}
