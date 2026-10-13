import { cn } from '@/lib/utils';
import { useAppThemeStore } from '@/stores/useAppThemeStore';
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
  const theme = useAppThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

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
                  ? isDark
                    ? 'bg-white text-slate-950 border-white shadow-md'
                    : 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : isDark
                    ? 'bg-[#0E1B2E] text-white border-[#1C2B42] hover:bg-[#152740]'
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
