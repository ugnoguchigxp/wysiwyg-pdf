/**
 * Button Component
 * Theme-based button with clear visual distinction between variants
 *
 * Variant Design:
 * - Action Level: default (objectPrimary), secondary (objectSecondary), tertiary (objectTertiary)
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
  'inline-flex min-h-[44px] min-w-[64px] items-center justify-center gap-2 whitespace-nowrap rounded-[6px] border border-solid text-base font-semibold shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed hover:brightness-[var(--theme-hover-brightness)] active:shadow-none active:translate-y-[1px]',
  {
    variants: {
      variant: {
        // Action Level (objectPrimary/Secondary/Tertiary)
        default: 'bg-theme-object-primary text-theme-text-on-color border-theme-contrast',
        secondary: 'bg-theme-object-secondary text-theme-text-on-color border-theme-contrast',
        tertiary: 'bg-theme-object-tertiary text-theme-text-on-color border-theme-contrast',

        // Semantic (success/cancel/delete/warning/info)
        positive: 'bg-theme-success text-theme-text-on-color border-theme-contrast',
        negative: 'bg-theme-bg-tertiary text-theme-text-primary border-theme-contrast',
        delete: 'bg-theme-danger text-theme-text-on-color border-theme-contrast',
        warning: 'bg-theme-warning text-theme-text-on-color border-theme-contrast',
        pause: 'bg-theme-warning text-theme-text-on-color border-theme-contrast',
        info: 'bg-theme-accent text-theme-text-on-color border-theme-contrast',

        // Special Styles
        outline: 'bg-transparent border-theme-border text-theme-text-primary',
        ghost: 'bg-transparent border-transparent text-theme-text-primary shadow-none',
        text: 'bg-transparent border-transparent text-theme-text-primary shadow-none hover:bg-theme-object-primary hover:text-theme-text-on-color',
        abort: 'bg-theme-bg-tertiary text-theme-text-primary border-theme-contrast',
        link: 'bg-transparent text-theme-accent underline-offset-4 underline shadow-none border-none min-h-0 min-w-0 hover:brightness-100',

        // Outline Variants
        'outline-positive': 'bg-transparent border-theme-success text-theme-success',
        'outline-negative': 'bg-transparent border-theme-bg-tertiary text-theme-text-primary',
        'outline-abort': 'bg-transparent border-theme-bg-tertiary text-theme-text-secondary',
        'outline-delete': 'bg-transparent border-theme-danger text-theme-danger',
        'outline-info': 'bg-transparent border-theme-accent text-theme-accent',
        'outline-warning': 'bg-transparent border-theme-warning text-theme-text-primary',

        // Circle Variants
        'circle-help':
          'bg-theme-accent text-theme-text-on-color border-none shadow-sm rounded-full min-w-0 hover:brightness-110',
        'circle-alert':
          'bg-theme-warning text-theme-text-on-color border-none shadow-sm rounded-full min-w-0 hover:brightness-110',

        // Floating Action Button
        fab: 'bg-theme-object-primary text-theme-text-on-color border-theme-contrast rounded-full shadow-sm hover:shadow-md min-h-0 min-w-0',
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
