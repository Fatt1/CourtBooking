import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateCourtOwnerValues) => Promise<void>;
  isSubmitting?: boolean;
}

interface PackageOptionItem {
  id: string;
  name: string;
  code: 'Basic' | 'Pro' | 'Ultra';
  badge: string;
  price: number;
  durationMonths: number;
  highlight: string;
  icon: typeof Sparkles;
  popular?: boolean;
}

const FALLBACK_PACKAGES: PackageOptionItem[] = [
  {
    id: 'e8379529-ece2-439c-8350-fb4e964013e9',
    name: 'Gói Basic',
    code: 'Basic',
    badge: 'KHỞI ĐẦU',
    price: 499000,
    durationMonths: 1,
    highlight: 'Tối đa 1 cơ sở / 5 sân',
    icon: ShieldCheck,
  },
  {
    id: '855b558f-7f95-4107-9df2-0f1fb5da8218',
    name: 'Gói Pro',
    code: 'Pro',
    badge: 'PHỔ BIẾN NHẤT',
    price: 1000000,
    durationMonths: 3,
    highlight: 'Tối đa 3 cơ sở / 20 sân',
    icon: Zap,
    popular: true,
  },
  {
    id: 'c57735d0-84af-46d3-87a5-f4f88f51ce70',
    name: 'Gói Ultra',
    code: 'Ultra',
    badge: 'TOÀN DIỆN',
    price: 2000000,
    durationMonths: 6,
    highlight: 'Không giới hạn quy mô',
    icon: Crown,
  },
];

export function CreateCourtOwnerDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: Props) {
  const { data: serverPackages = [] } = useServicePackagesConfigQuery();

  // Đồng bộ danh sách 3 gói cước từ database nếu có, nếu chưa thì dùng fallback chuẩn xác
  const availablePackages: PackageOptionItem[] = useMemo(() => {
    if (serverPackages && serverPackages.length > 0) {
      return serverPackages.slice(0, 3).map((pkg) => {
        const nameLower = (pkg.name || '').toLowerCase();
        const isUltra = nameLower.includes('ultra') || nameLower.includes('vip');
        const isPro = nameLower.includes('pro');
        const code: 'Basic' | 'Pro' | 'Ultra' = isUltra ? 'Ultra' : isPro ? 'Pro' : 'Basic';
        return {
          id: pkg.id,
          name: pkg.name.startsWith('Gói') ? pkg.name : `Gói ${pkg.name}`,
          code,
          badge: isUltra ? 'TOÀN DIỆN' : isPro ? 'PHỔ BIẾN NHẤT' : 'KHỞI ĐẦU',
          price: pkg.price,
          durationMonths: pkg.durationMonths || (isUltra ? 6 : isPro ? 3 : 1),
          highlight: isUltra
            ? 'Không giới hạn quy mô'
            : isPro
            ? 'Tối đa 3 cơ sở / 20 sân'
            : 'Tối đa 1 cơ sở / 5 sân',
          icon: isUltra ? Crown : isPro ? Zap : ShieldCheck,
          popular: isPro,
        };
      });
    }
    return FALLBACK_PACKAGES;
  }, [serverPackages]);

  const defaultPackageId = useMemo(() => {
    const proPkg = availablePackages.find((p) => p.code === 'Pro');
    return proPkg ? proPkg.id : availablePackages[0]?.id || FALLBACK_PACKAGES[1].id;
  }, [availablePackages]);

  const form = useForm<CreateCourtOwnerValues>({
    resolver: zodResolver(createCourtOwnerSchema),
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

  const handleSubmit = async (values: CreateCourtOwnerValues) => {
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
    } catch {
      // Giữ mở dialog để người dùng kiểm tra và sửa thông tin nếu gặp lỗi
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3.5 pt-1">
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
                      className="h-10 rounded-xl bg-[#101f17] border-[#1a3828] text-xs text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/50 transition-all"
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
                          className="h-10 pl-9 rounded-xl bg-[#101f17] border-[#1a3828] text-xs text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/50 transition-all"
                          {...field}
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
                          className="h-10 pl-9 rounded-xl bg-[#101f17] border-[#1a3828] text-xs text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/50 transition-all"
                          {...field}
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
                      <span>Gói dịch vụ SaaS ban đầu (Chọn 1 trong 3 gói)</span>
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
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide ${
                                  pkg.code === 'Pro'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : pkg.code === 'Ultra'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                }`}
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
                              <div className="text-[10px] text-emerald-400/80 font-medium truncate pt-0.5">
                                • {pkg.highlight}
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
                        placeholder="Nhập mật khẩu khởi tạo (tối thiểu 6 ký tự)"
                        className="h-10 pl-9 rounded-xl bg-[#101f17] border-[#1a3828] text-xs text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/50 font-mono transition-all"
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
