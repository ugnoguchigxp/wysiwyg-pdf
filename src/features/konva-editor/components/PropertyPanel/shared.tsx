import type React from 'react'
import { cn } from '@/lib/utils'
import type { GridLayout } from '@/features/konva-editor/constants/propertyPanelConfig'

export const WidgetLabel: React.FC<{
    htmlFor?: string
    children: React.ReactNode
    className?: string
}> = ({ htmlFor, children, className }) => (
    <label
        htmlFor={htmlFor}
        className={cn('block text-[13px] text-muted-foreground mb-0.5', className)}
    >
        {children}
    </label>
)

export const WidgetInput: React.FC<
    React.InputHTMLAttributes<HTMLInputElement> & { inputClassName?: string }
> = ({ className, inputClassName, ...props }) => (
    <input
        className={cn(
            'w-full px-1.5 py-1 border border-border rounded text-[13px]',
            'bg-background text-foreground',
            'focus:outline-none focus:ring-1 focus:ring-ring',
            inputClassName,
            className
        )}
        {...props}
    />
)

export const WidgetSelect: React.FC<
    React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }
> = ({ className, children, ...props }) => (
    <select
        className={cn(
            'w-full px-1.5 py-1 border border-border rounded text-[13px]',
            'bg-background text-foreground',
            'focus:outline-none focus:ring-1 focus:ring-ring',
            className
        )}
        {...props}
    >
        {children}
    </select>
)

export const GridContainer: React.FC<{
    grid?: GridLayout
    children: React.ReactNode
}> = ({ grid, children }) => {
    if (!grid) return <>{children}</>
    return (
        <div
            className="grid w-full"
            style={{
                gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
                gap: `${grid.gap ?? 8}px`,
            }}
        >
            {children}
        </div>
    )
}
