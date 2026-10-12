import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { OwnerSidebar } from './OwnerSidebar';
import { OwnerHeader } from './OwnerHeader';

/**
 * Khung giao diện chuẩn dành riêng cho Cổng Chủ Sân (Court Owner Portal).
 * Bao gồm:
 * - OwnerSidebar: 12 mục menu chuẩn Figma Matchday (xanh neon).
 * - OwnerHeader: Bộ chọn chi nhánh sân động từ Backend, switch Dark/Light, avatar MD.
 * - Outlet: Nội dung của các trang nghiệp vụ chủ sân (/owner/orders, /owner/branches...).
 */
export function OwnerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar Responsive: Toggle trên Mobile, cố định trên Desktop */}
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <OwnerHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
