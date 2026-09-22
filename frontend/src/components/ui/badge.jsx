import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-gradient-to-r from-[#0D9488] to-[#0D9488] text-white shadow-sm',
        secondary:
          'border-[#E2E8F0] bg-[#F0FDFA] text-[#0D9488]',
        outline:
          'border-[#E2E8F0] text-[#7A3B52] bg-white',
        destructive:
          'border-red-200 bg-red-50 text-red-700',
        success:
          'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning:
          'border-amber-200 bg-amber-50 text-amber-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

