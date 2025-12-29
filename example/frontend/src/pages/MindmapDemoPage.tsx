import React, { useRef, useState, useCallback } from 'react'
import { MindmapEditor, type Doc, DocumentLoadMenu, useQueue } from 'wysiwyg-pdf'
import { ArrowLeft, Save } from 'lucide-react'
import { saveDocument, listDocuments, getDocument } from '../api/documents'
import { uploadDocAssets } from '../utils/upload-helper'

interface MindmapDemoPageProps {
    onBack: () => void
}

export const MindmapDemoPage: React.FC<MindmapDemoPageProps> = ({ onBack }) => {
    const [templateName, setTemplateName] = useState('New Mindmap')
    const [loadDoc, setLoadDoc] = useState<Doc | null>(null)
    const [loadNonce, setLoadNonce] = useState(0)
    const latestDocRef = useRef<Doc | null>(null)
    const { addTask } = useQueue()

    const fetchRecent = useCallback(async () => {
        const response = await listDocuments({ user: 'anonymous', type: 'mindmap', limit: 5 })
        return response.items
    }, [])

    const fetchBrowse = useCallback(
        async (query: string, offset: number) => {
            const response = await listDocuments({
                user: 'anonymous',
                type: 'mindmap',
                q: query || undefined,
                limit: 20,
                offset,
            })
            return {
                items: response.items,
                hasMore: response.items.length === 20,
            }
        },
        []
    )

    const handleLoad = useCallback(async (id: string) => {
        const detail = await getDocument(id, 'anonymous')
        setLoadDoc(detail.payload as Doc)
        setLoadNonce((prev) => prev + 1)
        setTemplateName(detail.title)
    }, [])

    const handleSave = () => {
        const save = async () => {
            if (!latestDocRef.current) return

            try {
                const trimmedTitle = templateName.trim() || 'Untitled'
                if (trimmedTitle !== templateName) {
                    setTemplateName(trimmedTitle)
                }

                const docWithAssets = await uploadDocAssets(
                    {
                        ...latestDocRef.current,
                        title: trimmedTitle,
                    },
                    addTask
                )

                const result = await saveDocument({
                    user: 'anonymous',
                    type: 'mindmap',
                    title: trimmedTitle,
                    payload: docWithAssets,
                })

                if (result.status === 'exists') {
                    const confirmed = window.confirm('同名の保存データがあります。上書きしますか？')
                    if (!confirmed) return
                    await saveDocument({
                        user: 'anonymous',
                        type: 'mindmap',
                        title: trimmedTitle,
                        payload: docWithAssets,
                        force: true,
                    })
                }

                alert('Saved!')
            } catch (error) {
                console.error('[MindmapDemoPage] Error during save:', error)
                alert('Error during save. See console.')
            }
        }

        void save()
    }

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
                <input
                    value={templateName}
                    onChange={(event) => setTemplateName(event.target.value)}
                    className="border border-gray-200 rounded-md px-3 py-1 text-sm w-full max-w-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="ml-auto flex items-center gap-2">
                    <DocumentLoadMenu
                        fetchRecent={fetchRecent}
                        fetchBrowse={fetchBrowse}
                        onLoad={handleLoad}
                    />
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
                <MindmapEditor
                    showHeader={false}
                    loadDoc={loadDoc ?? undefined}
                    loadNonce={loadNonce}
                    onDocChange={(doc) => {
                        latestDocRef.current = doc
                    }}
                />
            </div>
        </div>
    )
}
