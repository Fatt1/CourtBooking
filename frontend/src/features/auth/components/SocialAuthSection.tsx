import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExternalLoginMutation } from '@/api/auth';
import { getApiErrorMessage } from '@/types/api';
import { loginWithFacebook, renderGoogleButton } from '@/lib/socialAuth';

interface SocialAuthSectionProps {
  mode?: 'login' | 'register';
  redirectUrl?: string;
}

export function SocialAuthSection({ mode = 'login', redirectUrl }: SocialAuthSectionProps) {
  const navigate = useNavigate();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { mutateAsync: externalLogin } = useExternalLoginMutation();

  const handleExternalSuccess = async (provider: 'Google' | 'Facebook', token: string) => {
    try {
      if (provider === 'Google') setIsGoogleLoading(true);
      if (provider === 'Facebook') setIsFacebookLoading(true);

      await externalLogin({ provider, token });
      toast.success(
        mode === 'register'
          ? `Đăng ký và liên kết ${provider} thành công!`
          : `Đăng nhập bằng ${provider} thành công!`
      );

      const searchParams = new URLSearchParams(window.location.search);
      const target = redirectUrl || searchParams.get('redirect') || '/';
      navigate(target);
    } catch (err: unknown) {
      toast.error(
        getApiErrorMessage(
          err,
          `Đăng nhập bằng ${provider} thất bại. Vui lòng thử lại sau!`
        )
      );
    } finally {
      setIsGoogleLoading(false);
      setIsFacebookLoading(false);
    }
  };

  // Khởi tạo Google One-Tap / Button render
  useEffect(() => {
    if (!googleBtnRef.current) return;

    let isMounted = true;
    const computedWidth = googleBtnRef.current.clientWidth
      ? Math.min(Math.max(googleBtnRef.current.clientWidth, 280), 400)
      : 384;

    renderGoogleButton(
      googleBtnRef.current,
      (idToken) => {
        if (isMounted) {
          handleExternalSuccess('Google', idToken);
        }
      },
      {
        text: mode === 'register' ? 'signup_with' : 'continue_with',
        theme: 'outline',
        size: 'large',
        width: computedWidth,
      }
    ).catch(() => {
      // Fallback nếu không tải được GSI
    });

    return () => {
      isMounted = false;
    };
  }, [mode]);

  const handleFacebookLogin = async () => {
    try {
      setIsFacebookLoading(true);
      const accessToken = await loginWithFacebook();
      await handleExternalSuccess('Facebook', accessToken);
    } catch (err: any) {
      toast.error(err?.message || 'Đăng nhập Facebook không thành công.');
      setIsFacebookLoading(false);
    }
  };

  const isPending = isGoogleLoading || isFacebookLoading;

  return (
    <div className="space-y-4 pt-1">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/80" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2.5 text-muted-foreground font-semibold text-[11px] tracking-wider">
            {mode === 'register' ? 'Hoặc đăng ký bằng' : 'Hoặc tiếp tục với'}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Nút Google chuẩn từ Google Identity Services - căn giữa tuyệt đối */}
        <div className="w-full flex justify-center items-center min-h-[44px]">
          {isGoogleLoading ? (
            <Button
              type="button"
              variant="outline"
              disabled
              className="w-full h-11 rounded-xl border-border/80 font-medium text-xs cursor-wait"
            >
              <Loader2 className="mr-2 size-4 animate-spin text-muted-foreground" />
              Đang xác thực Google...
            </Button>
          ) : (
            <div
              ref={googleBtnRef}
              className="w-full flex justify-center items-center text-center [&>div]:!mx-auto [&>div]:!flex [&>div]:!justify-center [&>iframe]:!mx-auto"
            />
          )}
        </div>

        {/* Nút Facebook Custom chuẩn phong cách */}
        <Button
          type="button"
          variant="outline"
          onClick={handleFacebookLogin}
          disabled={isPending}
          className="w-full h-11 rounded-xl border-border/80 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold text-xs transition-colors cursor-pointer shadow-xs gap-2.5"
        >
          {isFacebookLoading ? (
            <Loader2 className="size-4 animate-spin text-[#1877F2]" />
          ) : (
            <svg
              className="size-4 text-[#1877F2] fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )}
          <span>
            {mode === 'register' ? 'Đăng ký với Facebook' : 'Tiếp tục với Facebook'}
          </span>
        </Button>
      </div>
    </div>
  );
}
