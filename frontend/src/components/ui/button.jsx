import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-[#0D9488] to-[#0D9488] text-white shadow-md shadow-[#0D9488]/25 hover:shadow-lg hover:shadow-[#0D9488]/35 hover:-translate-y-0.5',
        secondary:
          'bg-[#F0FDFA] text-[#0D9488] border border-[#E2E8F0] hover:bg-[#FFE4ED] hover:border-[#FFB8CD]',
        outline:
          'border border-[#E2E8F0] bg-white text-slate-800 hover:bg-[#FFF5F8] hover:border-[#0D9488] hover:text-[#0D9488]',
        ghost:
          'text-slate-700 hover:bg-[#F0FDFA] hover:text-[#0D9488]',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-sm',
        link:
          'text-[#0D9488] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-2xl px-6 text-base',
        icon: 'h-9 w-9 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };

