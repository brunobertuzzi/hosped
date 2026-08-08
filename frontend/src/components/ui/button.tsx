import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer',
          {
            'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]':
              variant === 'default',
            'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-95 shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:scale-[1.02]':
              variant === 'gradient',
            'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30':
              variant === 'destructive',
            'border border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white':
              variant === 'outline',
            'bg-white/10 text-white hover:bg-white/15':
              variant === 'secondary',
            'hover:bg-white/10 text-white/70 hover:text-white':
              variant === 'ghost',
            'text-indigo-400 underline-offset-4 hover:underline p-0 h-auto font-normal lowercase':
              variant === 'link',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-8 rounded-lg px-3 text-[10px]': size === 'sm',
            'h-12 rounded-2xl px-8 text-sm': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
