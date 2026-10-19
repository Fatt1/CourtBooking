import { cn } from '@/lib/utils';
import { CourtTypeOption } from './types';

interface CourtTypeSidebarProps {
  courtTypes: CourtTypeOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CourtTypeSidebar({
  courtTypes,
  selectedId,
  onSelect,
}: CourtTypeSidebarProps) {

  return (
    <div className="w-full lg:w-72 shrink-0 space-y-3">
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
        Loại sân
      </div>

      <div className="flex flex-col gap-2.5">
        {courtTypes.map((type) => {
          const isSelected = type.id === selectedId;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={cn(
                'w-full text-left p-4.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer border',
                isSelected
                  ? 'bg-foreground text-background border-foreground shadow-sm'
                  : 'bg-card text-foreground border-border/80 hover:bg-accent/60'
              )}
            >
              <div className="leading-snug">{type.name}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
