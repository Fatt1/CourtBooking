import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Sun, LogOut, User as UserIcon, Receipt, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppThemeStore } from '@/stores/useAppThemeStore';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Tìm sân', href: '/courts' },
  { label: 'Kèo giao lưu', href: '/matches' },
  { label: 'Sự kiện', href: '/events' },
  { label: 'Trợ lý AI', href: '/ai-assistant' },
];

export function PublicHeader() {
  const [openMobile, setOpenMobile] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme } = useAppThemeStore();
  const navigate = useNavigate();

  // Chỉ hiển thị thông tin người dùng khi đã đăng nhập và có role là Player
  const isPlayer = isAuthenticated && String(user?.role || '').toLowerCase() === 'player';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-18 items-center justify-between px-4 sm:px-8 max-w-7xl">
        {/* Left: Brand Logo + Theme Switcher Pill */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/"
            className="font-heading font-black text-3xl tracking-normal text-foreground transition-opacity hover:opacity-90"
          >
            Matchday<span className="text-[#397B48]">.</span>
          </Link>

          {/* Theme Switcher Pill [ Light | Dark ] */}
          <div
            className={cn(
              'flex items-center rounded-full p-0.5 text-xs transition-all border',
              theme !== 'dark'
                ? 'bg-[#E8ECE9] border-slate-300/70'
                : 'bg-[#0B1324] border-slate-800'
            )}
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 transition-all text-xs cursor-pointer',
                theme !== 'dark'
                  ? 'bg-[#18231C] text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white font-semibold'
              )}
            >
              <Sun className="size-3.5 stroke-[2.2]" />
              <span className="font-bold">Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 transition-all text-xs cursor-pointer',
                theme === 'dark'
                  ? 'bg-white text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              )}
            >
              <svg
                className="size-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3a9 9 0 0 0 0 18V3z" fill="currentColor" />
              </svg>
              <span className="font-bold">Dark</span>
            </button>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-foreground/80 hover:text-foreground hover:font-semibold transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: Auth CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {isPlayer ? (
            <div className="relative group py-2">
              {/* Nút tên / avatar: bấm vào thì mặc định vào tab đơn hàng (/account?tab=orders) */}
              <button
                type="button"
                onClick={() => navigate('/account?tab=orders')}
                className="flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 hover:bg-muted/80 px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer select-none group-hover:border-[#397B48]/50"
              >
                <div className="size-6 rounded-full bg-[#397B48]/15 text-[#397B48] flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user?.name} className="size-6 rounded-full object-cover" />
                  ) : (
                    <UserIcon className="size-3.5 text-[#397B48]" />
                  )}
                </div>
                <span className="max-w-[130px] truncate text-foreground font-bold">
                  {user?.name || user?.email?.split('@')[0]}
                </span>
              </button>

              {/* Dropdown Menu xổ xuống khi hover vào */}
              <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block z-50 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="w-52 rounded-2xl border border-border/80 bg-card p-1.5 shadow-2xl text-xs space-y-0.5 relative before:content-[''] before:absolute before:-top-1.5 before:right-6 before:size-3 before:bg-card before:border-t before:border-l before:border-border/80 before:rotate-45">
                  <Link
                    to="/account?tab=profile"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-foreground hover:bg-secondary/70 transition-colors font-semibold"
                  >
                    <UserIcon className="size-4 text-muted-foreground" />
                    <span>Tài Khoản Của Tôi</span>
                  </Link>

                  <Link
                    to="/account?tab=orders"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-foreground hover:bg-secondary/70 transition-colors font-semibold"
                  >
                    <Receipt className="size-4 text-[#397B48]" />
                    <span>Đơn Mua</span>
                  </Link>

                  <Link
                    to="/account?tab=joined_matches"
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-foreground hover:bg-secondary/70 transition-colors font-semibold"
                  >
                    <Users className="size-4 text-[#397B48]" />
                    <span>Kèo Đã Tham Gia</span>
                  </Link>

                  <div className="my-1 border-t border-border/60" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-semibold text-left cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    <span>Đăng Xuất</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-foreground/90 hover:text-foreground px-3 py-2 transition-colors"
              >
                Đăng nhập
              </Link>
              <Button
                asChild
                className="bg-[#18231A] text-white hover:bg-black font-semibold text-sm px-5 py-2.5 rounded-md shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <Link to="/register">Tạo tài khoản</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Drawer */}
        <div className="flex md:hidden">
          <Sheet open={openMobile} onOpenChange={setOpenMobile}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mở menu">
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle className="font-heading font-black text-2xl tracking-normal text-left">
                  Matchday<span className="text-[#397B48]">.</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpenMobile(false)}
                    className="text-base font-medium py-2 hover:text-[#397B48] transition-colors border-b border-border/50"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 flex flex-col gap-3">
                  {isPlayer ? (
                    <>
                      <div className="flex items-center gap-2.5 rounded-xl border bg-muted/40 p-2.5 text-xs font-semibold">
                        <div className="size-7 rounded-full bg-[#397B48]/15 text-[#397B48] flex items-center justify-center font-bold shrink-0">
                          <UserIcon className="size-4" />
                        </div>
                        <span className="truncate">{user?.name || user?.email}</span>
                      </div>

                      <Button
                        variant="outline"
                        asChild
                        onClick={() => setOpenMobile(false)}
                        className="w-full justify-start gap-2.5 border-border/80 text-foreground hover:bg-[#397B48]/10 hover:text-[#397B48] rounded-xl font-semibold text-xs py-2.5"
                      >
                        <Link to="/account?tab=profile">
                          <UserIcon className="size-4 text-muted-foreground" />
                          <span>Tài Khoản Của Tôi</span>
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        asChild
                        onClick={() => setOpenMobile(false)}
                        className="w-full justify-start gap-2.5 border-border/80 text-foreground hover:bg-[#397B48]/10 hover:text-[#397B48] rounded-xl font-semibold text-xs py-2.5"
                      >
                        <Link to="/account?tab=orders">
                          <Receipt className="size-4 text-[#397B48]" />
                          <span>Đơn Mua</span>
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2.5 text-destructive rounded-xl font-semibold text-xs py-2.5 mt-1"
                        onClick={() => {
                          setOpenMobile(false);
                          handleLogout();
                        }}
                      >
                        <LogOut className="size-4" />
                        <span>Đăng Xuất</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild onClick={() => setOpenMobile(false)} className="rounded-xl">
                        <Link to="/login">Đăng nhập</Link>
                      </Button>
                      <Button asChild onClick={() => setOpenMobile(false)} className="bg-[#18231A] text-white rounded-xl">
                        <Link to="/register">Tạo tài khoản</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
