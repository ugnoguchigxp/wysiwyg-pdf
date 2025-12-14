import React from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EditableSelect } from '@/components/ui/EditableSelect'

const FIBONACCI_grid_SIZES = [2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377]

interface SettingsDrawerProps {
    isOpen: boolean
    onClose: () => void
    showGrid: boolean
    onShowGridChange: (show: boolean) => void
    gridSize: number
    onGridSizeChange: (size: number) => void
    snapStrength: number
    onSnapStrengthChange: (strength: number) => void
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
    isOpen,
    onClose,
    showGrid,
    onShowGridChange,
    gridSize,
    onGridSizeChange,
    snapStrength,
    onSnapStrengthChange,
}) => {
    const { t } = useTranslation()

    return (
        <div
            className={`absolute top-0 right-0 h-full w-64 bg-theme-bg-secondary shadow-xl border-l-[3px] border-theme-border z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
        >
            <div className="flex items-center justify-between p-4 border-b border-theme-border">
                <h3 className="font-semibold text-theme-text-primary">{t('settings_title', 'Settings')}</h3>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-theme-bg-tertiary text-theme-text-secondary transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* Grid Toggle */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-theme-text-primary">
                            {t('settings_show_grid', 'Show Grid')}
                        </label>
                        <input
                            type="checkbox"
                            checked={showGrid}
                            onChange={(e) => onShowGridChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    </div>

                    {showGrid && (
                        <div className="flex items-center justify-between pl-2">
                            <label className="text-xs font-medium text-theme-text-secondary">
                                {t('settings_grid_size', 'Grid Size (pt)')}
                            </label>
                            <div className="w-24">
                                <EditableSelect
                                    value={gridSize}
                                    onChange={(val) => {
                                        const num = parseFloat(String(val))
                                        if (!isNaN(num) && num > 0) {
                                            onGridSizeChange(num)
                                        }
                                    }}
                                    options={FIBONACCI_grid_SIZES}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Snap to Grid */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-theme-text-primary">
                            {t('settings_snap_to_grid', 'Snap to Grid')}
                        </label>
                        <input
                            type="checkbox"
                            checked={snapStrength > 0}
                            onChange={(e) => onSnapStrengthChange(e.target.checked ? gridSize : 0)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
