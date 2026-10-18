import React from 'react';
import {
  ShieldCheck,
  Info,
  FileText,
} from 'lucide-react';
import type { PublicBranchDetailDto } from '@/api/branches';
import type { BranchDetailTab } from './BranchTabsNav';

interface BranchInfoTabProps {
  branch: PublicBranchDetailDto;
  onNavigateToTab?: (tab: BranchDetailTab) => void;
  recentReviews?: Array<{
    id: string;
    playerName?: string;
    rating: number;
    comment?: string | null;
  }>;
}

export function BranchInfoTab({ branch }: BranchInfoTabProps) {
  return (
    <div className="space-y-8">
      {/* 1. MÔ TẢ CHI NHÁNH (Lấy đúng nội dung do chủ sân nhập qua TipTap) */}
      <section className="space-y-3">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#397B48]">
            GIỚI THIỆU CHI NHÁNH
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground tracking-tight mt-0.5">
            Thông tin chi tiết
          </h2>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50 shadow-xs">
          {branch.description && branch.description.trim() ? (
            <div
              className="tiptap-rendered-content max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: branch.description }}
            />
          ) : (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground py-2">
              <Info className="size-4 text-muted-foreground/60 flex-shrink-0" />
              <span>Chủ sân chưa cập nhật phần mô tả cho chi nhánh này.</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. CHÍNH SÁCH VÀ QUY ĐỊNH CHI NHÁNH (Lấy từ policy do chủ sân nhập) */}
      <section className="space-y-3">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#397B48]">
            CHÍNH SÁCH CHI NHÁNH
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-foreground tracking-tight mt-0.5">
            Chính sách & Quy định đặt sân
          </h2>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border/50 shadow-xs">
          {branch.policy && branch.policy.trim() ? (
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-xl bg-[#397B48]/10 text-[#397B48] flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="size-5" />
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-sm sm:text-base leading-relaxed text-foreground/90 whitespace-pre-line font-medium">
                  {branch.policy}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground py-2">
              <Info className="size-4 text-muted-foreground/60 flex-shrink-0" />
              <span>Chủ sân chưa cập nhật điều khoản hoặc chính sách đặt sân cho chi nhánh này.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


