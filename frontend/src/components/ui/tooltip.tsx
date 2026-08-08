import * as React from 'react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-[#0f0f20] border border-white/15 rounded-xl shadow-xl whitespace-nowrap pointer-events-none transition-all duration-200 animate-in fade-in-0 zoom-in-95',
            {
              'bottom-full mb-2 left-1/2 -translate-x-1/2': side === 'top',
              'top-full mt-2 left-1/2 -translate-x-1/2': side === 'bottom',
              'right-full mr-2 top-1/2 -translate-y-1/2': side === 'left',
              'left-full ml-2 top-1/2 -translate-y-1/2': side === 'right',
            },
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export { Tooltip };
