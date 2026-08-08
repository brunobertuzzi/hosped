import * as React from 'react';
import { cn } from '../../lib/utils';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'warning' | 'success';
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-2xl border p-4 backdrop-blur-xl [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-white [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11',
        {
          'bg-indigo-500/10 border-indigo-500/30 text-white':
            variant === 'default',
          'bg-red-500/10 border-red-500/30 text-red-300 [&>svg]:text-red-400':
            variant === 'destructive',
          'bg-amber-500/10 border-amber-500/30 text-amber-300 [&>svg]:text-amber-400':
            variant === 'warning',
          'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 [&>svg]:text-emerald-400':
            variant === 'success',
        },
        className
      )}
      {...props}
    />
  )
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 text-sm font-extrabold leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-xs opacity-90 leading-relaxed font-normal', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
