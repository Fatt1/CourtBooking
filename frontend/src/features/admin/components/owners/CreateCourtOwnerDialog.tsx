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
import { Loader2, UserPlus, Building, Mail, Phone, Lock, Sparkles } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateCourtOwnerValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateCourtOwnerDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: Props) {
  const form = useForm<CreateCourtOwnerValues>({
    resolver: zodResolver(createCourtOwnerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      businessName: '',
      password: 'Owner@123456',
      packageId: '499.000 đ/tháng',
      mustChangePwd: true,
    },
  });

  const handleSubmit = async (values: CreateCourtOwnerValues) => {
    await onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[530px] border-[#1b3427] bg-[#0c1611] text-zinc-100 p-6 rounded-2xl shadow-2xl shadow-emerald-950/40">
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

            {/* Gói dịch vụ mặc định & Mật khẩu khởi tạo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <FormLabel className="text-xs font-semibold text-zinc-300">
                  Gói dịch vụ mặc định
                </FormLabel>
                <div className="relative">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-400" />
                  <Input
                    readOnly
                    disabled
                    value="499.000 đ / tháng"
                    className="h-10 pl-9 rounded-xl bg-[#101f17]/80 border-[#1a3828] text-xs font-semibold text-emerald-300 select-none cursor-not-allowed opacity-90"
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold text-zinc-300">
                      Mật khẩu khởi tạo
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                        <Input
                          placeholder="Owner@123456"
                          className="h-10 pl-9 rounded-xl bg-[#101f17] border-[#1a3828] text-xs text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/50 font-mono transition-all"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[11px] text-rose-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* Checkbox bắt buộc đổi mật khẩu */}
            <FormField
              control={form.control}
              name="mustChangePwd"
              render={({ field }) => (
                <div className="flex items-center gap-2 pt-1.5">
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

            <DialogFooter className="gap-2.5 pt-4">
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
