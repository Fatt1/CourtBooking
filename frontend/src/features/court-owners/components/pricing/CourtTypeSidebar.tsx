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
                'w-full text-left p-4 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer border',
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-800 dark:border-slate-700 shadow-md shadow-slate-900/10'
                  : 'bg-card text-foreground border-border/70 hover:bg-accent/60 hover:border-border font-medium'
              )}
            >
              <div className="leading-snug">{type.name}</div>
              {type.totalCourts && (
                <div
                  className={cn(
                    'text-xs mt-1 font-normal',
                    isSelected ? 'text-slate-300' : 'text-muted-foreground'
                  )}
                >
                  {type.totalCourts} sân con
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
