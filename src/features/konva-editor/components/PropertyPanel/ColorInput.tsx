import { HexAlphaColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { WidgetInput } from './shared'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/utils'

interface ColorInputProps {
    value: string
    onChange: (color: string, options?: { saveToHistory?: boolean }) => void
    disabled?: boolean
    className?: string
}

export const ColorInput: React.FC<ColorInputProps> = ({ value, onChange, disabled, className }) => {
    const [isOpen, setIsOpen] = useState(false)
    const popoverRef = useRef<HTMLDivElement>(null)
    const [localColor, setLocalColor] = useState(value)

    useEffect(() => {
        setLocalColor(value)
    }, [value])

    // Standard Radix Popover behavior for open/close

    const handleColorDrag = (newColor: string) => {
        setLocalColor(newColor)
    }

    const handleInteractionEnd = () => {
        onChange(localColor, { saveToHistory: true })
    }

    return (
        <div className={cn("relative", className)} ref={popoverRef}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <div
                        className={cn(
                            'w-full h-8 px-2 border border-border rounded flex items-center gap-2 cursor-pointer bg-background hover:bg-accent hover:text-accent-foreground',
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <div
                            className="w-4 h-4 rounded-sm border border-gray-200 shadow-sm"
                            style={{ backgroundColor: value }}
                        />
                        <span className="text-[12px] truncate flex-1">{value}</span>
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-3"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div
                        onPointerUp={handleInteractionEnd}
                    >
                        <HexAlphaColorPicker
                            color={localColor === 'transparent' ? '#00000000' : localColor}
                            onChange={handleColorDrag}
                        />
                    </div>
                    <div className="mt-3 flex items-center">
                        <WidgetInput
                            value={localColor}
                            onChange={(e) => {
                                setLocalColor(e.target.value)
                                onChange(e.target.value, { saveToHistory: true })
                            }}
                            className="uppercase flex-1"
                        />
                        <button
                            type="button"
                            className="w-10 h-10 border border-border rounded ml-2 flex items-center justify-center bg-muted hover:bg-muted/80 relative overflow-hidden"
                            onClick={() => {
                                setLocalColor('transparent')
                                onChange('transparent', { saveToHistory: true })
                            }}
                            title="Transparent"
                        >
                            <div className="absolute inset-0" style={{
                                background: 'conic-gradient(#eee 0 25%, white 0 50%, #eee 0 75%, white 0)',
                                backgroundSize: '8px 8px',
                                opacity: 0.5
                            }} />
                            <div className="absolute inset-0 border-t border-red-500 transform rotate-45" />
                        </button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
