import React from 'react'
import { MindmapEditor } from 'wysiwyg-pdf'
import { ArrowLeft } from 'lucide-react'

interface MindmapDemoPageProps {
    onBack: () => void
}

export const MindmapDemoPage: React.FC<MindmapDemoPageProps> = ({ onBack }) => {
    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden">
            <div className="h-12 border-b bg-white flex items-center px-4 shadow-sm z-20 shrink-0">
                <button
                    onClick={onBack}
                    className="mr-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
                    title="Back to Dashboard"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <span className="font-semibold text-slate-700">Mindmap Editor Demo</span>
            </div>
            <div className="flex-1 overflow-hidden relative">
                <MindmapEditor />
            </div>
        </div>
    )
}
