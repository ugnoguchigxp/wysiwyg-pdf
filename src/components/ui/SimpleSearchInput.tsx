import { Search } from 'lucide-react'
import React from 'react'
import { useI18n } from '@/i18n/I18nContext'

export interface SimpleSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (query: string) => void
}

export const SimpleSearchInput = React.memo(
  React.forwardRef<HTMLInputElement, SimpleSearchInputProps>(
    ({ onSearch, placeholder, ...props }, ref) => {
      const { t } = useI18n()
      const effectivePlaceholder = placeholder ?? t('search_placeholder', 'Search...')

      return (
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--muted-foreground))',
              fontSize: '18px',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={ref}
            type="text"
            style={{
              width: '100%',
              paddingLeft: '40px',
              paddingRight: '16px',
              paddingTop: '10px',
              paddingBottom: '10px',
              fontSize: '14px',
              lineHeight: '1.5',
              border: '1px solid',
              borderColor: 'hsl(var(--border))',
              backgroundColor: 'hsl(var(--secondary))',
              color: 'hsl(var(--foreground))',
              borderRadius: '6px',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              transition: 'all 150ms ease-in-out',
            }}
            placeholder={effectivePlaceholder}
            onChange={(e) => onSearch?.(e.target.value)}
            {...props}
          />
        </div>
      )
    }
  )
)

SimpleSearchInput.displayName = 'SimpleSearchInput'
