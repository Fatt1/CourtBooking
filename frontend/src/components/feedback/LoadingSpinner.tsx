import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  label = 'Đang tải...',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-10',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-6 text-muted-foreground', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {label && <p className="text-sm font-medium">{label}</p>}
    </div>
  );
}
