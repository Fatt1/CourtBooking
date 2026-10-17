import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ShoppingCart, History } from 'lucide-react';
import { useBranchStore } from '@/stores/useBranchStore';

export function PosLayout() {
  const location = useLocation();
  const [historyLocation, setHistoryLocation] = useState('/owner/pos/history');
  const branchId = useBranchStore((state) => state.selectedBranchId);
  const previousBranch = useRef(branchId);
  useEffect(() => {
    if (location.pathname === '/owner/pos/history') setHistoryLocation(location.pathname + location.search);
  }, [location.pathname, location.search]);
  useEffect(() => {
    if (previousBranch.current && previousBranch.current !== branchId) setHistoryLocation((current) => {
      const url = new URL(current, window.location.origin);
      url.searchParams.delete('orderId'); url.searchParams.delete('page');
      return url.pathname + url.search;
    });
    previousBranch.current = branchId;
  }, [branchId]);
  const historyHref = location.pathname === '/owner/pos/history' ? location.pathname + location.search : historyLocation;
  return <div className="space-y-6">
    <nav aria-label="Bán hàng tại quầy" className="flex gap-1 border-b border-border">
      {[{ to: '/owner/pos', label: 'Bán hàng', icon: ShoppingCart, end: true },
        { to: historyHref, label: 'Lịch sử hóa đơn', icon: History, end: false }].map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${isActive ? 'border-brand-green text-brand-green dark:text-emerald-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          <Icon className="size-4" />{label}
        </NavLink>
      ))}
    </nav>
    <Outlet />
  </div>;
}
