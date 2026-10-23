import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FixedTimeBlock } from './types';

interface FixedTimeBlocksSectionProps {
  blocks: FixedTimeBlock[];
  onAddBlock: () => void;
  onEditBlock?: (block: FixedTimeBlock) => void;
  onDeleteBlock: (block: FixedTimeBlock) => void;
}

export function FixedTimeBlocksSection({
  blocks,
  onAddBlock,
  onEditBlock,
  onDeleteBlock,
}: FixedTimeBlocksSectionProps) {
  return (
    <div className="space-y-3.5 pb-6 border-b border-border/60">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base text-foreground">
          Khung giờ bắt buộc (Cố định liền mạch)
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddBlock}
          className="h-9 px-3.5 rounded-xl border-border/80 bg-background hover:bg-accent font-semibold text-xs gap-1.5 cursor-pointer"
        >
          <Plus className="size-3.5 stroke-[2.5]" />
          <span>Thêm khung giờ</span>
        </Button>
      </div>

      {blocks.length === 0 ? (
        <div className="text-xs text-muted-foreground italic py-2">
          Chưa có khung giờ cố định bắt buộc nào cho loại sân này.
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-border/80 bg-card hover:bg-accent/40 text-foreground transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {block.timeRange}
                </span>
                <span className="text-muted-foreground font-normal text-xs">|</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {block.daysText}
                </span>
                <span className="text-muted-foreground font-normal text-xs">|</span>
                <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {block.appliedCourtsText || 'Tất cả các sân'}
                </span>
              </div>
              <div className="flex items-center gap-1 border-l border-border/60 pl-2 ml-1 shrink-0">
                {onEditBlock && (
                  <button
                    type="button"
                    onClick={() => onEditBlock(block)}
                    title="Chỉnh sửa khung giờ bắt buộc"
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteBlock(block)}
                  title="Xóa khung giờ bắt buộc"
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground leading-relaxed">
        Khách hàng buộc phải thuê toàn bộ thời gian trong khung giờ này, không được chia nhỏ.
      </p>
    </div>
  );
}
