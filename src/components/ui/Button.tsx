/**
 * Button Component
 * Token-based button with clear visual distinction between variants
 *
 * Variant Design:
 * - Action Level: default (objectPrimary), secondary (objectSecondary), tertiary (objectTertiary)
 * - Context: ghost (transparent), link (text), outline (border)
 * - Semantic: positive (success), negative (cancel), delete (danger), warning, info (accent)
 * - Special: outline, ghost, link, fab (floating action button)
 */

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
// import { useTheme } from '@src/contexts/ThemeContext';
import { Check, X } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../utils/utils'

const buttonVariants = cva(
  'inline-flex min-h-[44px] min-w-[64px] items-center justify-center gap-2 whitespace-nowrap rounded-[6px] border border-solid text-base font-semibold shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed hover:brightness-95 active:shadow-none active:translate-y-[1px]',
  {
    variants: {
      variant: {
        // Action Level (objectPrimary/Secondary/Tertiary)
        default: 'bg-primary text-primary-foreground border-border',
        secondary: 'bg-secondary text-secondary-foreground border-border',
        tertiary: 'bg-muted text-muted-foreground border-border',

        // Semantic (success/cancel/delete/warning/info)
        positive: 'bg-primary text-primary-foreground border-border',
        negative: 'bg-secondary text-secondary-foreground border-border',
        delete: 'bg-destructive text-destructive-foreground border-border',
        warning: 'bg-accent text-accent-foreground border-border',
        pause: 'bg-accent text-accent-foreground border-border',
        info: 'bg-accent text-accent-foreground border-border',

        // Special Styles
        outline: 'bg-transparent border-input text-foreground',
        ghost: 'bg-transparent border-transparent text-foreground shadow-none',
        text: 'bg-transparent border-transparent text-foreground shadow-none hover:bg-accent hover:text-accent-foreground',
        abort: 'bg-secondary text-secondary-foreground border-border',
        link: 'bg-transparent text-primary underline-offset-4 underline shadow-none border-none min-h-0 min-w-0 hover:brightness-100',

        // Outline Variants
        'outline-positive': 'bg-transparent border-primary text-primary',
        'outline-negative': 'bg-transparent border-input text-foreground',
        'outline-abort': 'bg-transparent border-input text-muted-foreground',
        'outline-delete': 'bg-transparent border-destructive text-destructive',
        'outline-info': 'bg-transparent border-accent text-accent',
        'outline-warning': 'bg-transparent border-accent text-accent',

        // Circle Variants
        'circle-help':
          'bg-accent text-accent-foreground border-none shadow-sm rounded-full min-w-0 hover:brightness-110',
        'circle-alert':
          'bg-accent text-accent-foreground border-none shadow-sm rounded-full min-w-0 hover:brightness-110',

        // Floating Action Button
        fab: 'bg-primary text-primary-foreground border-border rounded-full shadow-sm hover:shadow-md min-h-0 min-w-0',
      },
      size: {
        default: 'px-4 py-2 text-base',
        sm: 'px-3 py-1.5 text-sm min-h-[36px] min-w-[48px]',
        lg: 'px-6 py-3 text-lg min-h-[52px] min-w-[80px]',
        icon: 'h-11 w-11 p-0',
        fab: 'h-14 w-14 p-0',
        circle: 'h-8 w-8 min-h-[32px] min-w-[32px] p-0 text-sm rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ElementType
  loading?: boolean
  success?: boolean
  error?: boolean
}

const ButtonComponent = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      icon: Icon,
      children,
      disabled,
      loading = false,
      success = false,
      error = false,
      ...props
    },
    ref
  ) => {
    // deleted useTheme

    const statefulVariant = success ? 'positive' : error ? 'delete' : variant
    const resolvedVariant = (statefulVariant || 'default') as VariantProps<
      typeof buttonVariants
    >['variant']

    const textColorClass = ''

    if (asChild) {
      return (
        <Slot
          className={cn(
            buttonVariants({ variant: resolvedVariant, size }),
            textColorClass,
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    // Render content based on state
    const renderContent = () => {
      if (success) {
        return <Check className="h-5 w-5 flex-shrink-0" />
      }

      if (error) {
        return <X className="h-5 w-5 flex-shrink-0" />
      }

      if (loading) {
        return (
          <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )
      }

      return (
        <>
          {Icon && <Icon className={cn('h-5 w-5', children ? 'mr-2' : '')} />}
          {children}
        </>
      )
    }

    return (
      <button
        className={cn(
          buttonVariants({ variant: resolvedVariant, size }),
          textColorClass,
          (loading || success || error) && 'hover:!brightness-100',
          className
        )}
        ref={ref}
        disabled={disabled || loading || success || error}
        {...props}
      >
        {renderContent()}
      </button>
    )
  }
)

export const Button = React.memo(ButtonComponent)
Button.displayName = 'Button'

export { buttonVariants }
