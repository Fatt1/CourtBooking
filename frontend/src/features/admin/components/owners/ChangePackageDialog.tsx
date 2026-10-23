import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type CourtOwnerItem } from '@/api/court-owners';
import { RefreshCw, Loader2, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePackageSchema, type ChangePackageValues } from '../../schemas/courtOwnerSchema';
import { useServicePackagesConfigQuery } from '@/api/subscriptions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: CourtOwnerItem | null;
  onSubmit: (
    ownerId: string,
    newPackageId: string,
    packageName: string,
    ownerName: string,
    businessName: string,
    price: number
  ) => Promise<void>;
  isSubmitting?: boolean;
}

interface PackageOption {
  id: string;
  code: string;
  name: string;
  price: number;
  durationMonths: number;
  badge?: string;
  description: string;
  features: string[];
}

const DEFAULT_PACKAGES: PackageOption[] = [
  {
    id: 'e8379529-ece2-439c-8350-fb4e964013e9',
    code: 'Basic',
    name: 'Basic',
    price: 499000,
    durationMonths: 1,
    badge: 'KHỞI ĐẦU',
    description: '',
    features: [],
  },
  {
    id: '855b558f-7f95-4107-9df2-0f1fb5da8218',
    code: 'Pro',
    name: 'Pro',
    price: 1000000,
    durationMonths: 3,
    badge: 'PHỔ BIẾN NHẤT',
    description: '',
    features: [],
  },
  {
    id: 'c57735d0-84af-46d3-87a5-f4f88f51ce70',
    code: 'Ultra',
    name: 'Ultra',
    price: 2000000,
    durationMonths: 6,
    badge: 'TOÀN DIỆN',
    description: '',
    features: [],
  },
];

export function ChangePackageDialog({
  open,
  onOpenChange,
  owner,
  onSubmit,
  isSubmitting,
}: Props) {
  const { data: dbPackages = [] } = useServicePackagesConfigQuery();

  const packages: PackageOption[] = useMemo(() => {
    if (dbPackages.length > 0) {
      return dbPackages.map((p) => {
        const lower = p.name.toLowerCase();
        const badge = lower.includes('pro')
          ? 'PHỔ BIẾN NHẤT'
          : lower.includes('ultra') || lower.includes('vip')
          ? 'TOÀN DIỆN'
          : 'KHỞI ĐẦU';
        return {
          id: p.id,
          code: p.name,
          name: p.name,
          price: p.price,
          durationMonths: p.durationMonths,
          badge,
          description: p.description,
          features: [],
        };
      });
    }
    return DEFAULT_PACKAGES;
  }, [dbPackages]);

  // Bắt lỗi input bằng Zod Schema (hạn chế if-else thủ công)
  const form = useForm<ChangePackageValues>({
    resolver: zodResolver(changePackageSchema),
    defaultValues: {
      newPackageId: '',
    },
  });

  const selectedPkgId = form.watch('newPackageId');

  // Chỉ thiết lập gói mặc định khi mở modal hoặc đổi owner
  useEffect(() => {
    if (!open || !owner || packages.length === 0) return;

    if (owner.currentPackageName) {
      const lower = owner.currentPackageName.toLowerCase();
      const matched = packages.find(
        (p) => p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase())
      );
      if (matched) {
        form.setValue('newPackageId', matched.id, { shouldValidate: true });
        return;
      }
    }

    // Nếu chưa có gói, mặc định chọn gói đầu tiên hoặc Pro
    form.setValue('newPackageId', packages[1]?.id || packages[0]?.id, { shouldValidate: true });
  }, [open, owner?.id, owner?.currentPackageName, packages, form]);

  if (!owner) return null;

  const currentPkg = packages.find((p) => p.id === selectedPkgId) || packages[0];

  const handleConfirm = form.handleSubmit(async (values) => {
    const chosenPkg = packages.find((p) => p.id === values.newPackageId) || currentPkg;
    await onSubmit(
      owner.id,
      chosenPkg.id,
      chosenPkg.name,
      owner.fullName,
      owner.businessName || `Cụm sân ${owner.fullName}`,
      chosenPkg.price
    );
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] border-[#1b2b22] bg-[#0c1410] text-zinc-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-[#1b2b22]">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <RefreshCw className="size-4 text-emerald-400" />
            </div>
            <DialogTitle className="text-base font-bold text-white">
              Đổi gói dịch vụ SaaS
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400">
            Nâng cấp hoặc chuyển đổi gói đăng ký cho chủ sân. Lịch sử đổi gói sẽ được ghi nhận tự động.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Thông tin chủ sân */}
          <div className="rounded-xl bg-[#111915] border border-[#1b2b22] p-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Chủ sân:</span>
              <span className="font-bold text-white">{owner.fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Gói đang sử dụng:</span>
              <span className="font-semibold text-emerald-400">
                {owner.currentPackageName || 'Basic'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Hạn hiện tại:</span>
              <span>{owner.packageEndDate || 'Chưa thiết lập'}</span>
            </div>
          </div>

          {/* Danh sách các gói cước để chọn */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Chọn gói cước mới áp dụng:</span>
              <span className="text-[11px] font-normal text-emerald-400">
                Giá niêm yết theo chu kỳ
              </span>
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {packages.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                const isCurrent =
                  owner.currentPackageName?.toLowerCase().includes(pkg.code.toLowerCase()) ||
                  (pkg.id === 'pkg-basic' && owner.currentPackageName?.toLowerCase().includes('cơ bản')) ||
                  (pkg.id === 'pkg-pro' && owner.currentPackageName?.toLowerCase().includes('nâng cao')) ||
                  (pkg.id === 'pkg-ultra' && (owner.currentPackageName?.toLowerCase().includes('ultra') || owner.currentPackageName?.toLowerCase().includes('vip') || owner.currentPackageName?.toLowerCase().includes('doanh nghiệp')));

                return (
                  <div
                    key={pkg.id}
                    onClick={() => form.setValue('newPackageId', pkg.id, { shouldValidate: true })}
                    className={`relative rounded-xl border p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-[#12241a] shadow-lg shadow-emerald-500/10'
                        : 'border-[#1b2b22] bg-[#111915] hover:border-[#274032] hover:bg-[#14201a]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                              : 'border-zinc-600 bg-transparent'
                          }`}
                        >
                          {isSelected && <div className="size-1.5 rounded-full bg-slate-950" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{pkg.name}</span>
                            {pkg.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  pkg.id === 'pkg-pro'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : pkg.id === 'pkg-ultra'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                }`}
                              >
                                {pkg.badge}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                Đang dùng
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-emerald-400">
                          {pkg.price.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[10px] text-zinc-500">/ {pkg.durationMonths} tháng</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lưu ý chính sách chuyển đổi */}
          <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-300">
            <ShieldCheck className="size-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>
              Gói dịch vụ mới sẽ có hiệu lực ngay lập tức. Lịch sử đổi gói sẽ được ghi nhận và hiển thị trong tab <strong>Lịch sử</strong>.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-3 border-t border-[#1b2b22]">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl border-[#1b2b22] bg-[#111915] text-zinc-300 hover:text-white hover:bg-[#16241c] text-xs cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin text-slate-950" />}
            <span>{isSubmitting ? 'Đang cập nhật...' : 'Xác nhận đổi gói'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
