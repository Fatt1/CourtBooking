import { useMemo, useEffect } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createCourtOwnerSchema,
  type CreateCourtOwnerValues,
} from '../../schemas/courtOwnerSchema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  UserPlus,
  Building,
  Mail,
  Phone,
  Lock,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Crown,
} from 'lucide-react';
import { useServicePackagesConfigQuery } from '@/api/subscriptions';
import { useCourtOwnersQuery } from '@/api/court-owners';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateCourtOwnerValues) => Promise<void>;
  isSubmitting?: boolean;
}

interface PackageOptionItem {
  id: string;
  name: string;
  code: string;
  badge: string;
  badgeClass: string;
  price: number;
  durationMonths: number;
  icon: typeof Sparkles;
  popular?: boolean;
}

function getPackageBadgeInfo(durationMonths: number) {
  if (durationMonths === 1) {
    return {
      badge: 'KHỞI ĐẦU',
      badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    };
  }
  if (durationMonths === 3) {
    return {
      badge: 'PHỔ BIẾN NHẤT',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    };
  }
  if (durationMonths === 6) {
    return {
      badge: 'CAO CẤP',
      badgeClass: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
    };
  }
  if (durationMonths === 12) {
    return {
      badge: 'TOÀN DIỆN',
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    };
  }
  return {
    badge: durationMonths > 6 ? 'TOÀN DIỆN' : durationMonths > 3 ? 'CAO CẤP' : 'KHỞI ĐẦU',
    badgeClass:
      durationMonths > 6
        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
        : durationMonths > 3
        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
        : 'bg-zinc-800 text-zinc-300 border border-zinc-700',
  };
}

const FALLBACK_PACKAGES: PackageOptionItem[] = [
  {
    id: 'e8379529-ece2-439c-8350-fb4e964013e9',
    name: 'Gói Basic',
    code: 'Basic',
    badge: 'KHỞI ĐẦU',
    badgeClass: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    price: 499000,
    durationMonths: 1,
    icon: ShieldCheck,
  },
  {
    id: '855b558f-7f95-4107-9df2-0f1fb5da8218',
    name: 'Gói Pro',
    code: 'Pro',
    badge: 'PHỔ BIẾN NHẤT',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    price: 1000000,
    durationMonths: 3,
    icon: Zap,
    popular: true,
  },
  {
    id: 'c57735d0-84af-46d3-87a5-f4f88f51ce70',
    name: 'Gói Ultra',
    code: 'Ultra',
    badge: 'CAO CẤP',
    badgeClass: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
    price: 2000000,
    durationMonths: 6,
    icon: Crown,
  },
  {
    id: 'd9182374-1290-41ab-8712-892348912389',
    name: 'Gói Toàn diện',
    code: 'VIP',
    badge: 'TOÀN DIỆN',
    badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    price: 3800000,
    durationMonths: 12,
    icon: Sparkles,
  },
];

export function CreateCourtOwnerDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: Props) {
  const { data: serverPackages = [] } = useServicePackagesConfigQuery();

  // Đồng bộ danh sách gói cước từ database nếu có, nếu chưa thì dùng fallback chuẩn xác
  const availablePackages: PackageOptionItem[] = useMemo(() => {
    if (serverPackages && serverPackages.length > 0) {
      return serverPackages.map((pkg) => {
        const duration = pkg.durationMonths || 1;
        const { badge, badgeClass } = getPackageBadgeInfo(duration);
        const is12M = duration === 12;
        const is6M = duration === 6;
        const is3M = duration === 3;

        return {
          id: pkg.id,
          name: pkg.name.startsWith('Gói') ? pkg.name : `Gói ${pkg.name}`,
          code: pkg.code,
          badge,
          badgeClass,
          price: pkg.price,
          durationMonths: duration,
          icon: is12M ? Sparkles : is6M ? Crown : is3M ? Zap : ShieldCheck,
          popular: is3M,
        };
      });
    }
    return FALLBACK_PACKAGES;
  }, [serverPackages]);

  const defaultPackageId = useMemo(() => {
    const proPkg = availablePackages.find((p) => p.code === 'Pro');
    return proPkg ? proPkg.id : availablePackages[0]?.id || FALLBACK_PACKAGES[1].id;
  }, [availablePackages]);

  const { data: existingOwnersData } = useCourtOwnersQuery({
    pageSize: 100,
  });

  const form = useForm<CreateCourtOwnerValues>({
    resolver: zodResolver(createCourtOwnerSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      businessName: '',
      password: '',
      packageId: defaultPackageId,
      mustChangePwd: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fullName: '',
        email: '',
        phoneNumber: '',
        businessName: '',
        password: '',
        packageId: defaultPackageId,
        mustChangePwd: true,
      });
      form.clearErrors();
    }
  }, [open, defaultPackageId, form]);

  const handleInvalid = (errors: FieldErrors<CreateCourtOwnerValues>) => {
    const errorKeys: (keyof CreateCourtOwnerValues)[] = [
      'fullName',
      'email',
      'phoneNumber',
      'password',
      'packageId',
    ];
    for (const key of errorKeys) {
      if (errors[key]) {
        form.setFocus(key);
        break;
      }
    }
  };

  const handleSubmit = async (values: CreateCourtOwnerValues) => {
    // 1. Kiểm tra Email đã tồn tại ở danh sách chủ sân hiện có
    const emailLower = values.email.trim().toLowerCase();
    const isEmailTaken = (existingOwnersData?.items || []).some(
      (o) => o.email.trim().toLowerCase() === emailLower
    );
    if (isEmailTaken) {
      form.setError('email', {
        type: 'manual',
        message: 'Email này đã tồn tại trong hệ thống.',
      });
      form.setFocus('email');
      return;
    }

    // 2. Gửi request tạo chủ sân
    try {
      await onSubmit(values);
      form.reset({
        fullName: '',
        email: '',
        phoneNumber: '',
        businessName: '',
        password: '',
        packageId: defaultPackageId,
        mustChangePwd: true,
      });
      onOpenChange(false);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        '';

      const lower = errorMsg.toLowerCase();
      if (lower.includes('email')) {
        form.setError('email', {
          type: 'manual',
          message: 'Email này đã tồn tại trong hệ thống.',
        });
        setTimeout(() => form.setFocus('email'), 50);
      } else if (lower.includes('số điện thoại') || lower.includes('phone')) {
        form.setError('phoneNumber', {
          type: 'manual',
          message: 'Số điện thoại này đã tồn tại trong hệ thống.',
        });
        setTimeout(() => form.setFocus('phoneNumber'), 50);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] border-[#1b3427] bg-[#0c1611] text-zinc-100 p-6 rounded-2xl shadow-2xl shadow-emerald-950/40 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <UserPlus className="size-4.5 stroke-[2.2]" />
            </div>
            <DialogTitle className="text-base font-bold text-white tracking-tight">
              Tạo tài khoản Chủ sân mới
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-400 leading-normal">
            Khởi tạo tài khoản đối tác quản lý cụm sân và cấp gói dịch vụ SaaS ban đầu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, handleInvalid)} className="space-y-3.5 pt-1">
            {/* Họ và tên */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold text-zinc-300">
                    Họ và tên chủ sân <span className="text-rose-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Nguyễn Minh Tuấn"
                      className={cn(
                        "h-10 rounded-xl bg-[#101f17] border-[#1a3828] text-xs text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/50 transition-all",
                        form.formState.errors.fullName && "border-rose-500/80 focus-visible:border-rose-500 focus-visible:ring-rose-500/30 ring-1 ring-rose-500/20"
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[11px] text-rose-400" />
                </FormItem>
              )}
            />

            {/* Email & Số điện thoại (2 cột) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold text-zinc-300">
                      Email đăng nhập <span className="text-rose-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                        <Input
                          type="email"
                          placeholder="minhtuan@gmail.com"
                          className={cn(
                            "h-10 pl-9 rounded-xl bg-[#101f17] border-[#1a3828] text-xs text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/50 transition-all",
                            form.formState.errors.email && "border-rose-500/80 focus-visible:border-rose-500 focus-visible:ring-rose-500/30 ring-1 ring-rose-500/20"
                          )}
                          {...field}
                          onBlur={(e) => {
                            field.onBlur();
                            const val = e.target.value.trim().toLowerCase();
                            if (val && (existingOwnersData?.items || []).some(o => o.email.trim().toLowerCase() === val)) {
                              form.setError('email', {
                                type: 'manual',
                                message: 'Email này đã tồn tại trong hệ thống.',
                              });
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px] text-rose-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold text-zinc-300">
                      Số điện thoại <span className="text-rose-400">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                        <Input
                          placeholder="0901234567"
                          className={cn(
                            "h-10 pl-9 rounded-xl bg-[#101f17] border-[#1a3828] text-xs text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/50 transition-all",
                            form.formState.errors.phoneNumber && "border-rose-500/80 focus-visible:border-rose-500 focus-visible:ring-rose-500/30 ring-1 ring-rose-500/20"
                          )}
                          {...field}
                          onBlur={(e) => {
                            field.onBlur();
                            const val = e.target.value.trim();
                            if (val && (existingOwnersData?.items || []).some(o => o.phoneNumber.trim() === val)) {
                              form.setError('phoneNumber', {
                                type: 'manual',
                                message: 'Số điện thoại này đã tồn tại trong hệ thống.',
                              });
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px] text-rose-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* Tên cụm sân / Doanh nghiệp */}
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold text-zinc-300">
                    Tên cơ sở / Cụm sân kinh doanh (Tùy chọn)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                      <Input
                        placeholder="Ví dụ: CLB Cầu Lông Minh Tuấn"
                        className="h-10 pl-9 rounded-xl bg-[#101f17] border-[#1a3828] text-xs text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/50 transition-all"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px] text-rose-400" />
                </FormItem>
              )}
            />

            {/* LỰA CHỌN 3 GÓI CƯỚC DỊCH VỤ SAAS */}
            <FormField
              control={form.control}
              name="packageId"
              render={({ field }) => (
                <FormItem className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-emerald-400" />
                      <span>Gói dịch vụ SaaS ban đầu</span>
                      <span className="text-rose-400">*</span>
                    </FormLabel>
                    <span className="text-[11px] text-emerald-400/90 font-medium">
                      Chu kỳ sử dụng niêm yết
                    </span>
                  </div>

                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {availablePackages.map((pkg) => {
                        const isSelected = field.value === pkg.id;
                        const Icon = pkg.icon;

                        return (
                          <div
                            key={pkg.id}
                            onClick={() => field.onChange(pkg.id)}
                            className={`group relative rounded-xl border p-3 cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-emerald-400 bg-gradient-to-b from-[#142e20] to-[#0c1811] ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-950/50'
                                : 'border-[#1b3427] bg-[#101f17] hover:border-[#28523c] hover:bg-[#13271d]'
                            }`}
                          >
                            {/* Header gói: Icon + Badge + Checkbox/Radio */}
                            <div className="flex items-start justify-between gap-1.5 mb-2">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide border ${pkg.badgeClass}`}
                              >
                                {pkg.badge}
                              </span>

                              <div
                                className={`size-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? 'border-emerald-400 bg-emerald-500 text-slate-950'
                                    : 'border-zinc-600 bg-transparent group-hover:border-zinc-400'
                                }`}
                              >
                                {isSelected ? (
                                  <CheckCircle2 className="size-3.5 fill-slate-950 text-emerald-400" />
                                ) : null}
                              </div>
                            </div>

                            {/* Tên gói */}
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Icon
                                className={`size-3.5 shrink-0 ${
                                  isSelected ? 'text-emerald-400' : 'text-zinc-400'
                                }`}
                              />
                              <span className="font-bold text-xs text-white">
                                {pkg.name}
                              </span>
                            </div>

                            {/* Giá & Thời hạn */}
                            <div className="space-y-0.5">
                              <div className="flex items-baseline gap-1">
                                <span className="text-sm font-extrabold text-emerald-300 tracking-tight">
                                  {pkg.price.toLocaleString('vi-VN')} đ
                                </span>
                              </div>
                              <div className="text-[10px] text-zinc-400">
                                Thời hạn: <span className="font-medium text-zinc-200">{pkg.durationMonths} tháng</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px] text-rose-400" />
                </FormItem>
              )}
            />

            {/* Mật khẩu khởi tạo */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold text-zinc-300">
                    Mật khẩu khởi tạo <span className="text-rose-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                      <Input
                        type="password"
                        placeholder="Nhập mật khẩu khởi tạo (tối thiểu 6 ký tự)"
                        className={cn(
                          "h-10 pl-9 rounded-xl bg-[#101f17] border-[#1a3828] text-xs text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/50 font-mono transition-all",
                          form.formState.errors.password && "border-rose-500/80 focus-visible:border-rose-500 focus-visible:ring-rose-500/30 ring-1 ring-rose-500/20"
                        )}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[11px] text-rose-400" />
                </FormItem>
              )}
            />

            {/* Checkbox bắt buộc đổi mật khẩu */}
            <FormField
              control={form.control}
              name="mustChangePwd"
              render={({ field }) => (
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="mustChangePwd"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="size-4 rounded-md border-[#1a3828] data-[state=checked]:bg-emerald-500 data-[state=checked]:text-black"
                  />
                  <label
                    htmlFor="mustChangePwd"
                    className="text-xs text-zinc-300 font-medium cursor-pointer select-none"
                  >
                    Bắt buộc chủ sân đổi mật khẩu khi đăng nhập lần đầu
                  </label>
                </div>
              )}
            />

            <DialogFooter className="gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-5 rounded-xl border-[#1a3828] bg-[#101f17] text-zinc-300 hover:text-white hover:bg-[#162f23] text-xs font-semibold cursor-pointer transition-all"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 rounded-xl bg-[#00c978] hover:bg-[#00b56c] text-slate-950 font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin text-slate-950" />
                ) : (
                  <UserPlus className="size-4 stroke-[2.2]" />
                )}
                <span>{isSubmitting ? 'Đang khởi tạo...' : 'Tạo tài khoản Chủ sân'}</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
