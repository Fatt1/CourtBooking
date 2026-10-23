import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  KeyRound,
  ShieldCheck,
  Gem,
  Calendar,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OwnerPageHeader, OwnerModal } from '@/features/court-owners/components/shared';
import {
  useOwnerProfileQuery,
  useUpdateOwnerProfileMutation,
  useOwnerChangePasswordMutation,
} from '@/api/auth';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Format chuỗi ngày YYYY-MM-DD sang DD/MM/YYYY
 */
function formatDateVN(dateStr?: string | null): string {
  if (!dateStr) return '--/--/----';
  if (dateStr.includes('/')) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Tính số ngày còn lại đến ngày kết thúc gói
 */
function calculateDaysRemaining(endDateStr?: string | null): number | null {
  if (!endDateStr) return null;
  const targetDate = new Date(endDateStr);
  if (isNaN(targetDate.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function OwnerProfilePage() {
  const navigate = useNavigate();

  // Queries & Mutations
  const { data: profile, isLoading, isError, refetch } = useOwnerProfileQuery();
  const updateProfileMutation = useUpdateOwnerProfileMutation();
  const changePasswordMutation = useOwnerChangePasswordMutation();

  // Form Thông tin cá nhân
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [taxCode, setTaxCode] = useState('');

  // Modal Đổi mật khẩu
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Đồng bộ state từ query data
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setEmail(profile.email || '');
      setPhoneNumber(profile.phoneNumber || '');
      setBusinessName(profile.businessName || '');
      setTaxCode(profile.taxCode || '');
    }
  }, [profile]);

  // Reset form về dữ liệu ban đầu
  const handleResetForm = () => {
    if (profile) {
      setFullName(profile.fullName || '');
      setEmail(profile.email || '');
      setPhoneNumber(profile.phoneNumber || '');
      setBusinessName(profile.businessName || '');
      setTaxCode(profile.taxCode || '');
      toast.info('Đã hoàn tác thông tin về ban đầu');
    }
  };

  // Lưu thông tin cá nhân
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }
    if (!email.trim()) {
      toast.error('Vui lòng nhập địa chỉ email');
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    if (!businessName.trim()) {
      toast.error('Vui lòng nhập tên thương hiệu / doanh nghiệp');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        businessName: businessName.trim(),
        taxCode: taxCode.trim() || null,
      });
      toast.success('Cập nhật thông tin cá nhân thành công!');
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail
        || (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.message
        || 'Cập nhật thất bại. Vui lòng kiểm tra lại thông tin.';
      toast.error(errorMsg);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.detail
        || (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data?.message
        || 'Mật khẩu hiện tại không chính xác hoặc không thỏa mãn yêu cầu bảo mật.';
      setPasswordError(errorMsg);
    }
  };

  const currentPkg = profile?.currentPackage;
  const daysRemaining = calculateDaysRemaining(currentPkg?.endDate);
  const isExpired = daysRemaining !== null && daysRemaining <= 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Tiêu đề trang */}
      <OwnerPageHeader
        title="Thông tin cá nhân & Doanh nghiệp"
        description="Quản lý hồ sơ đối tác Chủ sân, thông tin thương hiệu kinh doanh và gói dịch vụ SaaS đang áp dụng."
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="size-8 animate-spin rounded-full border-2 border-[#a3e635] border-t-transparent" />
            <span className="text-sm">Đang tải thông tin cá nhân...</span>
          </div>
        </div>
      ) : isError ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
          <AlertCircle className="size-10 text-rose-500 mb-2" />
          <p className="font-semibold text-rose-500">Không thể tải thông tin hồ sơ</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-4 border-rose-500/40 text-rose-500 hover:bg-rose-500/20"
          >
            Tải lại
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CỘT 1 (BÊN TRÁI): Card Gói dịch vụ hiện tại & Card Bảo mật */}
          <div className="space-y-6 lg:col-span-1">
            {/* Card Gói dịch vụ SaaS hiện tại */}
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur-md">
              {/* Hiệu ứng nền nhẹ */}
              <div className="absolute -top-12 -right-12 size-36 rounded-full bg-[#a3e635]/10 blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#a3e635]/15 text-[#a3e635]">
                    <Gem className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Gói Dịch Vụ Hiện Tại</h3>
                    <p className="text-[11px] text-muted-foreground">Thuê bao quản lý sân SaaS</p>
                  </div>
                </div>

                {currentPkg ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                      isExpired
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : 'bg-[#a3e635]/20 text-[#4d7c0f] dark:text-[#a3e635]'
                    )}
                  >
                    {isExpired ? 'Đã hết hạn' : 'Đang hoạt động'}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Chưa đăng ký
                  </span>
                )}
              </div>

              {currentPkg ? (
                <div className="space-y-3.5">
                  <div className="rounded-xl border border-border/50 bg-background/60 p-3.5">
                    <p className="text-xs text-muted-foreground">Tên gói cước</p>
                    <p className="text-base font-extrabold text-[#65a30d] dark:text-[#a3e635] mt-0.5">
                      {currentPkg.packageName}
                    </p>
                    <p className="text-xs font-semibold text-foreground mt-1">
                      {formatCurrency(currentPkg.price)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/30 p-2.5 border border-border/30">
                      <span className="text-muted-foreground block text-[11px]">Ngày bắt đầu</span>
                      <span className="font-semibold text-foreground mt-0.5 block">
                        {formatDateVN(currentPkg.startDate)}
                      </span>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-2.5 border border-border/30">
                      <span className="text-muted-foreground block text-[11px]">Ngày kết thúc</span>
                      <span className="font-semibold text-foreground mt-0.5 block">
                        {formatDateVN(currentPkg.endDate)}
                      </span>
                    </div>
                  </div>

                  {daysRemaining !== null && !isExpired && (
                    <div className="flex items-center gap-2 rounded-xl bg-[#a3e635]/10 p-2.5 text-xs text-[#4d7c0f] dark:text-[#a3e635] font-semibold">
                      <Sparkles className="size-4 shrink-0" />
                      <span>Còn lại {daysRemaining} ngày sử dụng</span>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 rounded-xl border-border/70 hover:bg-muted/70 text-xs font-semibold cursor-pointer"
                    onClick={() => navigate('/owner/packages')}
                  >
                    <span>Xem lịch sử & bảng giá gói</span>
                    <ExternalLink className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground space-y-3">
                  <p>Hiện bạn chưa kích hoạt gói dịch vụ SaaS nào.</p>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl bg-[#a3e635] text-black font-bold hover:bg-[#8ece28] cursor-pointer"
                    onClick={() => navigate('/owner/packages')}
                  >
                    Chọn gói dịch vụ ngay
                  </Button>
                </div>
              )}
            </div>

            {/* Card Đổi mật khẩu & Bảo mật */}
            <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur-md space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Bảo Mật Tài Khoản</h3>
                  <p className="text-[11px] text-muted-foreground">Đổi mật khẩu định kỳ</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Đổi mật khẩu định kỳ giúp bảo vệ tài khoản quản trị cụm sân và dữ liệu khách hàng của bạn an toàn hơn.
              </p>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold text-xs cursor-pointer"
                onClick={() => {
                  setPasswordError(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setIsPasswordModalOpen(true);
                }}
              >
                <KeyRound className="size-3.5" />
                <span>Đổi mật khẩu</span>
              </Button>
            </div>
          </div>

          {/* CỘT 2-3 (BÊN PHẢI): Form Cập nhật thông tin cá nhân & Doanh nghiệp */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSaveProfile}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-md space-y-6"
            >
              {/* Header của Form */}
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[#a3e635] text-black font-extrabold text-sm shadow-xs">
                    {fullName ? fullName.slice(0, 2).toUpperCase() : 'MD'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Thông Tin Cá Nhân & Doanh Nghiệp
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Chỉnh sửa thông tin đại diện pháp lý và đơn vị quản lý cụm sân
                    </p>
                  </div>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#a3e635]/15 px-3 py-1 text-xs font-bold text-[#65a30d] dark:text-[#a3e635]">
                  <ShieldCheck className="size-3.5" />
                  <span>Đối tác Chủ sân</span>
                </div>
              </div>

              {/* Nhóm 1: Thông tin người đại diện */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <User className="size-3.5 text-[#a3e635]" />
                  <span>Thông tin người đại diện</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Họ và tên */}
                  <div className="space-y-1.5">
                    <label htmlFor="fullName" className="text-xs font-semibold text-foreground">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn Chủ Sân"
                        className="pl-9 rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#a3e635]"
                        required
                      />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-1.5">
                    <label htmlFor="phoneNumber" className="text-xs font-semibold text-foreground">
                      Số điện thoại liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ví dụ: 0912345678"
                        className="pl-9 rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#a3e635]"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="email" className="text-xs font-semibold text-foreground">
                      Email đăng nhập & nhận hóa đơn <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ví dụ: owner@example.com"
                        className="pl-9 rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#a3e635]"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Email này được dùng làm tên đăng nhập vào hệ thống quản lý của Chủ sân.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nhóm 2: Thông tin kinh doanh / Pháp nhân */}
              <div className="space-y-4 pt-2 border-t border-border/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Building2 className="size-3.5 text-[#a3e635]" />
                  <span>Thông tin đơn vị kinh doanh</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tên thương hiệu / Doanh nghiệp */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="businessName" className="text-xs font-semibold text-foreground">
                      Tên thương hiệu / Doanh nghiệp <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Ví dụ: CLB Cầu Lông & Pickleball Sài Gòn Star"
                        className="pl-9 rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#a3e635]"
                        required
                      />
                    </div>
                  </div>

                  {/* Mã số thuế */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="taxCode" className="text-xs font-semibold text-foreground">
                      Mã số thuế (nếu có)
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="taxCode"
                        value={taxCode}
                        onChange={(e) => setTaxCode(e.target.value)}
                        placeholder="Ví dụ: 0312345678"
                        className="pl-9 rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#a3e635]"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Mã số thuế dùng để xuất hóa đơn điện tử cho các gói dịch vụ và thanh toán hệ thống.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetForm}
                  disabled={updateProfileMutation.isPending}
                  className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RotateCcw className="size-3.5 mr-1.5" />
                  Đặt lại
                </Button>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="gap-2 rounded-xl bg-[#a3e635] text-black font-extrabold hover:bg-[#8ece28] text-xs px-5 cursor-pointer shadow-md"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <div className="size-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / POPUP ĐỔI MẬT KHẨU */}
      <OwnerModal
        open={isPasswordModalOpen}
        onOpenChange={setIsPasswordModalOpen}
        hideFooter={true}
        title="Đổi Mật Khẩu Tài Khoản"
        description="Nhập mật khẩu hiện tại và thiết lập mật khẩu mới an toàn cho tài khoản của bạn."
      >
        <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
          {passwordError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Mật khẩu hiện tại */}
          <div className="space-y-1.5">
            <label htmlFor="currentPassword" className="text-xs font-semibold text-foreground">
              Mật khẩu hiện tại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu đang sử dụng"
                className="pr-10 rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#a3e635]"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="text-xs font-semibold text-foreground">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="pr-10 rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#a3e635]"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="pr-10 rounded-xl border-border/60 text-sm focus-visible:ring-1 focus-visible:ring-[#a3e635]"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={changePasswordMutation.isPending}
              className="rounded-xl text-xs font-semibold border-border/60 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="gap-2 rounded-xl bg-[#a3e635] text-black font-extrabold hover:bg-[#8ece28] text-xs px-5 cursor-pointer shadow-md"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <div className="size-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Xác nhận đổi</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </OwnerModal>
    </div>
  );
}
