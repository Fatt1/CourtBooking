import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

/**
 * Khung giao diện chuẩn dành riêng cho Cổng Quản Trị Hệ Thống CourtOS (Admin Console).
 * Khớp chuẩn thiết kế Figma:
 * - AdminSidebar: Logo CourtOS, Workspace Card, menu 5 mục có badge, profile footer.
 * - AdminHeader: Breadcrumb điều hướng động, tìm kiếm hệ thống ⌘K, thông báo, avatar.
 * - Footer: Bản quyền CourtOS Console.
 */
export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0f0d] text-slate-100 font-sans">
      {/* Sidebar Responsive: Toggle trên Mobile, cố định trên Desktop */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <Outlet />
          </div>

          {/* Footer thông tin chuẩn CourtOS */}
          <footer className="mt-8 pt-4 border-t border-[#16241c] flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
            <div>
              © 2026 CourtOS. Không gian quản trị hệ thống.
            </div>
            <div>
              Bản UI tương tác - Dữ liệu minh họa
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
