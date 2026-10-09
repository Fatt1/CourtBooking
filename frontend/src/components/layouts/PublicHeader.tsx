import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Sun, Moon, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
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

  const isManagementRole =
    user?.role === 'SystemAdmin' || user?.role === 'CourtOwner' || user?.role === 'Staff';

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
          <div className="flex items-center rounded-full border border-border/80 bg-muted/50 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'flex items-center gap-1 rounded-full px-2.5 py-1 transition-all cursor-pointer',
                theme === 'light'
                  ? 'bg-foreground text-background shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sun className="size-3" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'flex items-center gap-1 rounded-full px-2.5 py-1 transition-all cursor-pointer',
                theme === 'dark'
                  ? 'bg-foreground text-background shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Moon className="size-3" />
              <span>Dark</span>
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
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {isManagementRole && (
                <Button variant="outline" asChild size="sm" className="gap-2 border-[#397B48]/40 text-[#397B48] hover:bg-[#397B48]/10 rounded-xl">
                  <Link to="/admin">
                    <ShieldCheck className="size-4" />
                    <span>Quản trị</span>
                  </Link>
                </Button>
              )}
              <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-xs font-medium">
                <UserIcon className="size-3.5 text-[#397B48]" />
                <span className="max-w-[120px] truncate">{user?.name || user?.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Đăng xuất" className="rounded-xl">
                <LogOut className="size-4 text-muted-foreground hover:text-destructive" />
              </Button>
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
                  {isAuthenticated ? (
                    <>
                      {isManagementRole && (
                        <Button className="w-full bg-[#397B48] rounded-xl" asChild onClick={() => setOpenMobile(false)}>
                          <Link to="/admin">Trang Quản Trị</Link>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full text-destructive rounded-xl"
                        onClick={() => {
                          setOpenMobile(false);
                          handleLogout();
                        }}
                      >
                        Đăng xuất
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
