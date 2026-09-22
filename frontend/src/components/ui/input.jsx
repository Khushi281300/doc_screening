import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F0FDFA] px-3.5 py-2 text-sm text-[#0F172A] ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#A17D8D] focus-visible:outline-none focus-visible:border-[#0D9488] focus-visible:ring-2 focus-visible:ring-[#0D9488]/30 focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };

