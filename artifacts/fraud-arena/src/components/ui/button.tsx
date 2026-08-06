import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { PixelChevron } from '@/components/bureau/pixel-chevron';

/**
 * Button — the CTA construction from the Bureau guideline.
 *
 * Fixed by the system, not by the caller: radius 0, Denim Medium, 16/18px
 * padding, 12px gap, and a pixel chevron after the label. State changes are
 * opacity only over 200ms — hover takes filled buttons to 0.82, press adds no
 * shrink and no bounce, and there are no shadows or colour shifts anywhere.
 * Focus and disabled are handled globally in index.css.
 */
const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-3 whitespace-nowrap',
    'font-sans font-medium tracking-[-0.02em]',
    'transition-opacity duration-[var(--dur-base)] ease-[var(--ease-standard)]',
    'disabled:pointer-events-none',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ),
  {
    variants: {
      variant: {
        /* Electric Violet marks where the system is doing work. */
        default: 'bg-violet-700 text-white hover:opacity-[0.82]',
        /* The white CTA, for use on near-black fields. */
        light: 'bg-white text-russian hover:opacity-[0.82]',
        /* The dark CTA, for use on white or ice cards. */
        dark: 'bg-russian text-white hover:opacity-[0.82]',
        secondary:
          'bg-ink-800 text-white border border-ink-700 hover:border-violet-700 transition-colors',
        outline:
          'border border-[var(--border-hairline-on-dark)] text-white hover:border-violet-700 transition-colors',
        destructive: 'bg-coral-600 text-russian hover:opacity-[0.82]',
        ghost: 'border border-transparent text-white hover:opacity-[0.82]',
        link: 'text-white underline decoration-1 underline-offset-4 opacity-70 hover:opacity-100',
      },
      size: {
        /* 16px vertical, 18px horizontal, 20px Denim Medium. */
        default: 'px-[18px] py-4 text-display-md',
        sm: 'px-3 py-2 text-body-sm',
        lg: 'px-6 py-5 text-card-title',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** The pixel chevron that follows every CTA label. Off for icon buttons. */
  chevron?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, chevron = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {chevron && !asChild ? (
          <>
            {children}
            <PixelChevron />
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
