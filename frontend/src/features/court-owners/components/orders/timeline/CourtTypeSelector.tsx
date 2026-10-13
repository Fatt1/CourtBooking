import { Check } from 'lucide-react';
import type { CourtTypePricingConfigDto } from '@/api/pricing';

interface CourtTypeSelectorProps {
  courtTypesConfig: CourtTypePricingConfigDto[];
  selectedCourtTypeIds: string[];
  selectedPriceTableIds: Record<string, string>;
  onToggleCourtType: (courtTypeId: string) => void;
  onSelectPriceTable: (courtTypeId: string, priceTableId: string) => void;
  isLoading?: boolean;
}

export function CourtTypeSelector({
  courtTypesConfig,
  selectedCourtTypeIds,
  selectedPriceTableIds,
  onToggleCourtType,
  onSelectPriceTable,
  isLoading,
}: CourtTypeSelectorProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-[#0f172a]/60 p-6 text-center space-y-2">
        <div className="inline-block size-5 animate-spin rounded-full border-2 border-[#a3e635] border-t-transparent" />
        <p className="text-xs text-slate-400">Đang tải cấu hình loại sân và bảng giá...</p>
      </div>
    );
  }

  if (!courtTypesConfig || courtTypesConfig.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
        Chi nhánh chưa có cấu hình loại sân hoặc bảng giá nào.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#a3e635]">
          THIẾT LẬP BUỔI CHƠI
        </span>
        <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
          Chọn loại sân và loại khách
        </h3>
        <p className="text-xs text-slate-400">
          Có thể chọn nhiều loại sân. Mỗi loại sân áp dụng một nhóm khách do chủ sân cấu hình.
        </p>
      </div>

      <div className="space-y-2.5">
        {courtTypesConfig.map((ct) => {
          const isSelected = selectedCourtTypeIds.includes(ct.courtTypeId);
          const activePriceTableId = selectedPriceTableIds[ct.courtTypeId];

          return (
            <div
              key={ct.courtTypeId}
              className={`rounded-2xl border transition-all p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-[#131d31] border-[#a3e635]/60 shadow-sm'
                  : 'bg-[#0f172a]/60 border-border/50 hover:border-border/80'
              }`}
            >
              {/* Bên trái: Checkbox + Tên loại sân + Số sân */}
              <div
                className="flex items-center gap-3 cursor-pointer select-none"
                onClick={() => onToggleCourtType(ct.courtTypeId)}
              >
                <div
                  className={`size-5 rounded-md border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[#a3e635] border-[#a3e635] text-black font-bold'
                      : 'border-slate-500 bg-[#0B1324]'
                  }`}
                >
                  {isSelected && <Check className="size-3.5 stroke-[3]" />}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {ct.courtTypeName}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {ct.availableCourts?.length || 0} sân khả dụng • bước nhảy {ct.minutesConfig}p
                  </p>
                </div>
              </div>

              {/* Bên phải: Danh sách nhóm khách / Bảng giá (Pills) */}
              <div className="flex items-center gap-2 flex-wrap sm:justify-end pl-8 sm:pl-0">
                {ct.priceTables && ct.priceTables.length > 0 ? (
                  ct.priceTables.map((pt) => {
                    const isPtActive = activePriceTableId === pt.id;

                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSelected) {
                            onToggleCourtType(ct.courtTypeId);
                          }
                          onSelectPriceTable(ct.courtTypeId, pt.id);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                          isPtActive
                            ? 'bg-emerald-700/80 border-emerald-500 text-white shadow-xs'
                            : 'bg-[#1a2742] border-border/50 text-slate-300 hover:text-white hover:bg-[#223354]'
                        }`}
                      >
                        {pt.name}
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-500 italic">
                    Chưa có bảng giá
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
