import { HexAlphaColorPicker } from 'react-colorful'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { WidgetInput } from './shared'

interface ColorInputProps {
    value: string
    onChange: (value: string) => void
}

export const ColorInput: React.FC<ColorInputProps> = ({ value, onChange }) => {
    return (
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <div
                        className="w-8 h-8 rounded border border-border cursor-pointer relative overflow-hidden"
                        style={{
                            background:
                                'conic-gradient(#eee 0 25%, white 0 50%, #eee 0 75%, white 0)',
                            backgroundSize: '8px 8px',
                        }}
                    >
                        <div
                            className="absolute inset-0 w-full h-full"
                            style={{ backgroundColor: value }}
                        />
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                    <HexAlphaColorPicker
                        color={value === 'transparent' ? '#00000000' : value}
                        onChange={onChange}
                    />
                    <div className="mt-3 flex items-center">
                        <WidgetInput
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="uppercase flex-1"
                        />
                        <button
                            className="w-10 h-10 border border-border rounded ml-2 flex items-center justify-center bg-muted hover:bg-muted/80 relative overflow-hidden"
                            onClick={() => onChange('transparent')}
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
