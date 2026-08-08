import * as React from 'react';
import { cn } from '../../lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-white/10 border border-white/5',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
