import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Link2, Unlink2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useExternalLoginsQuery,
  useLinkExternalLoginMutation,
  useUnlinkExternalLoginMutation,
} from '@/api/auth';
import { getApiErrorMessage } from '@/types/api';
import { loginWithFacebook, renderGoogleButton } from '@/lib/socialAuth';

export function SocialAccountLinkingSection() {
  const { data: linkedProviders, isLoading, refetch } = useExternalLoginsQuery();
  const { mutateAsync: linkExternal, isPending: isLinking } = useLinkExternalLoginMutation();
  const { mutateAsync: unlinkExternal, isPending: isUnlinking } = useUnlinkExternalLoginMutation();

  const [confirmProvider, setConfirmProvider] = useState<string | null>(null);
  const [isFacebookConnecting, setIsFacebookConnecting] = useState(false);
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);

  const googleContainerRef = useRef<HTMLDivElement>(null);

  const isGoogleLinked = linkedProviders?.some(
    (p) => p.provider.toLowerCase() === 'google'
  );
  const isFacebookLinked = linkedProviders?.some(
    (p) => p.provider.toLowerCase() === 'facebook'
  );

  // Khởi tạo nút Google liên kết khi tài khoản chưa liên kết Google
  useEffect(() => {
    if (isGoogleLinked || !googleContainerRef.current) return;

    let isMounted = true;
    renderGoogleButton(
      googleContainerRef.current,
      async (idToken) => {
        if (!isMounted) return;
        try {
          setIsGoogleConnecting(true);
          await linkExternal({ provider: 'Google', token: idToken });
          toast.success('Liên kết tài khoản Google thành công!');
          refetch();
        } catch (err: unknown) {
          toast.error(
            getApiErrorMessage(err, 'Liên kết Google thất bại. Vui lòng thử lại!')
          );
        } finally {
          setIsGoogleConnecting(false);
        }
      },
      {
        text: 'continue_with',
        theme: 'outline',
        size: 'medium',
        width: 170,
      }
    ).catch(() => {
      // Ignored
    });

    return () => {
      isMounted = false;
    };
  }, [isGoogleLinked, linkExternal, refetch]);

  const handleLinkFacebook = async () => {
    try {
      setIsFacebookConnecting(true);
      const accessToken = await loginWithFacebook();
      await linkExternal({ provider: 'Facebook', token: accessToken });
      toast.success('Liên kết tài khoản Facebook thành công!');
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Liên kết Facebook thất bại.');
    } finally {
      setIsFacebookConnecting(false);
    }
  };

  const handleConfirmUnlink = async () => {
    if (!confirmProvider) return;
    try {
      await unlinkExternal(confirmProvider);
      toast.success(`Đã hủy liên kết với ${confirmProvider}.`);
      setConfirmProvider(null);
      refetch();
    } catch (err: unknown) {
      toast.error(
        getApiErrorMessage(err, `Hủy liên kết ${confirmProvider} thất bại!`)
      );
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-black text-xl text-foreground">
              Tài khoản mạng xã hội liên kết
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#397B48]/10 text-[#397B48]">
              <ShieldCheck className="size-3" />
              Đăng nhập nhanh
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Liên kết tài khoản Google hoặc Facebook để đăng nhập nhanh chóng chỉ với 1 click.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center justify-center gap-2.5 text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-[#397B48]" />
          <span className="text-xs font-semibold">Đang tải danh sách liên kết...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Google */}
          <div className="p-5 rounded-xl border border-border/70 bg-muted/20 flex flex-col justify-between gap-4 transition-all hover:border-border hover:shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-white dark:bg-zinc-900 border border-border/60 flex items-center justify-center shadow-xs shrink-0">
                  <svg className="size-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Tài khoản Google</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isGoogleLinked
                      ? 'Đã liên kết thành công với tài khoản này'
                      : 'Chưa liên kết tài khoản Google'}
                  </p>
                </div>
              </div>

              {isGoogleLinked ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#397B48]/15 text-[#397B48] shrink-0">
                  <CheckCircle2 className="size-3" />
                  Đã kết nối
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground shrink-0">
                  Chưa kết nối
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-end">
              {isGoogleLinked ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmProvider('Google')}
                  className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-bold gap-1.5 h-8 px-3 cursor-pointer"
                >
                  <Unlink2 className="size-3.5" />
                  <span>Hủy liên kết</span>
                </Button>
              ) : isGoogleConnecting ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="rounded-xl text-xs font-bold gap-1.5 h-8 cursor-wait"
                >
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Đang liên kết...</span>
                </Button>
              ) : (
                <div ref={googleContainerRef} className="h-8 flex items-center" />
              )}
            </div>
          </div>

          {/* Card Facebook */}
          <div className="p-5 rounded-xl border border-border/70 bg-muted/20 flex flex-col justify-between gap-4 transition-all hover:border-border hover:shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-white dark:bg-zinc-900 border border-border/60 flex items-center justify-center shadow-xs shrink-0">
                  <svg className="size-5 text-[#1877F2] fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Tài khoản Facebook</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isFacebookLinked
                      ? 'Đã liên kết thành công với tài khoản này'
                      : 'Chưa liên kết tài khoản Facebook'}
                  </p>
                </div>
              </div>

              {isFacebookLinked ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#397B48]/15 text-[#397B48] shrink-0">
                  <CheckCircle2 className="size-3" />
                  Đã kết nối
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground shrink-0">
                  Chưa kết nối
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-end">
              {isFacebookLinked ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmProvider('Facebook')}
                  className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-bold gap-1.5 h-8 px-3 cursor-pointer"
                >
                  <Unlink2 className="size-3.5" />
                  <span>Hủy liên kết</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleLinkFacebook}
                  disabled={isFacebookConnecting || isLinking}
                  className="rounded-xl border-border/80 text-foreground hover:bg-muted font-bold text-xs h-8 px-3.5 cursor-pointer gap-1.5"
                >
                  {isFacebookConnecting ? (
                    <Loader2 className="size-3.5 animate-spin text-[#1877F2]" />
                  ) : (
                    <Link2 className="size-3.5 text-[#1877F2]" />
                  )}
                  <span>{isFacebookConnecting ? 'Đang kết nối...' : 'Liên kết Facebook'}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialog xác nhận hủy liên kết */}
      <Dialog open={!!confirmProvider} onOpenChange={(open) => !open && setConfirmProvider(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="gap-2">
            <div className="size-11 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertCircle className="size-6" />
            </div>
            <DialogTitle className="font-heading font-black text-lg">
              Xác nhận hủy liên kết {confirmProvider}?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Sau khi hủy liên kết, bạn sẽ không thể sử dụng tài khoản {confirmProvider} này để
              đăng nhập nhanh vào CourtBooking nữa trừ khi thực hiện liên kết lại.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmProvider(null)}
              disabled={isUnlinking}
              className="rounded-xl text-xs font-bold"
            >
              Giữ lại liên kết
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmUnlink}
              disabled={isUnlinking}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              {isUnlinking && <Loader2 className="size-3.5 animate-spin" />}
              <span>Đồng ý hủy</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
