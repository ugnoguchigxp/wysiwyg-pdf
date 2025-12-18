import { ChevronDown } from 'lucide-react'
import * as React from 'react'
import { cn } from '../../utils/utils'

export interface IEditableSelectProps {
  value: string | number
  onChange: (value: string) => void
  options: (string | number)[]
  className?: string
  placeholder?: string
}

export const EditableSelect: React.FC<IEditableSelectProps> = ({
  value,
  onChange,
  options,
  className,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionClick = (option: string | number) => {
    onChange(String(option))
    setIsOpen(false)
  }

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <div className="flex items-center w-full border border-border rounded bg-background focus-within:ring-1 focus-within:ring-ring">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-1.5 py-1 text-[11px] bg-transparent border-none focus:outline-none text-foreground"
          onFocus={() => setIsOpen(true)}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-1 py-1 text-muted-foreground hover:bg-accent focus:outline-none"
          tabIndex={-1}
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-background border border-border rounded shadow-lg scrollbar-thin">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleOptionClick(option)}
              className="w-full px-2 py-1 text-[11px] text-left text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
