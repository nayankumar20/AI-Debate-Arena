import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'glass rounded-2xl p-6 sm:p-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
