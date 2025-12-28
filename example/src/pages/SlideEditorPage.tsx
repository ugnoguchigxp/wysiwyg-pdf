import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { SlideEditor } from 'wysiwyg-pdf'

interface SlideEditorPageProps {
    onBack: () => void
}

export const SlideEditorPage: React.FC<SlideEditorPageProps> = ({ onBack }) => {
    return (
        <div className="h-screen w-screen flex flex-col bg-background">
            {/* Header */}
            <div className="h-14 border-b border-border bg-secondary flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-base font-semibold text-foreground leading-none">
                            Slide Presentation Editor
                        </h1>
                        <span className="text-xs text-muted-foreground mt-1">
                            PowerPoint-like slide creation and export demo
                        </span>
                    </div>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden">
                <SlideEditor />
            </div>
        </div>
    )
}
