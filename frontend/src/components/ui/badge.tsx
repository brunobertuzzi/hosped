import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'border-indigo-500/30 bg-indigo-500/15 text-indigo-300':
            variant === 'default',
          'border-white/10 bg-white/5 text-white/70':
            variant === 'secondary',
          'border-red-500/30 bg-red-500/15 text-red-400':
            variant === 'destructive',
          'border-white/20 text-white':
            variant === 'outline',
          'border-emerald-500/30 bg-emerald-500/15 text-emerald-400':
            variant === 'success',
          'border-amber-500/30 bg-amber-500/15 text-amber-300':
            variant === 'warning',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
