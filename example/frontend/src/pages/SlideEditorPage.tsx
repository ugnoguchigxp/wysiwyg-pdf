import React, { useRef, useState, useCallback } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { SlideEditor, type Doc, DocumentLoadMenu } from 'wysiwyg-pdf'
import { saveDocument, listDocuments, getDocument } from '../api/documents'

interface SlideEditorPageProps {
    onBack: () => void
}

export const SlideEditorPage: React.FC<SlideEditorPageProps> = ({ onBack }) => {
    const [templateName, setTemplateName] = useState('New Presentation')
    const [loadDoc, setLoadDoc] = useState<Doc | null>(null)
    const [loadNonce, setLoadNonce] = useState(0)
    const latestDocRef = useRef<Doc | null>(null)

    const fetchRecent = useCallback(async () => {
        const response = await listDocuments({ user: 'anonymous', type: 'slide', limit: 5 })
        return response.items
    }, [])

    const fetchBrowse = useCallback(
        async (query: string, offset: number) => {
            const response = await listDocuments({
                user: 'anonymous',
                type: 'slide',
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

                const docToSave: Doc = {
                    ...latestDocRef.current,
                    title: trimmedTitle,
                }

                const result = await saveDocument({
                    user: 'anonymous',
                    type: 'slide',
                    title: trimmedTitle,
                    payload: docToSave,
                })

                if (result.status === 'exists') {
                    const confirmed = window.confirm('同名の保存データがあります。上書きしますか？')
                    if (!confirmed) return
                    await saveDocument({
                        user: 'anonymous',
                        type: 'slide',
                        title: trimmedTitle,
                        payload: docToSave,
                        force: true,
                    })
                }

                alert('Saved!')
            } catch (error) {
                console.error('[SlideEditorPage] Error during save:', error)
                alert('Error during save. See console.')
            }
        }

        void save()
    }

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
                    <div className="flex items-center gap-3">
                        <h1 className="text-base font-semibold text-foreground leading-none">
                            Slide Editor
                        </h1>
                    </div>
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-hidden">
                <SlideEditor
                    loadDoc={loadDoc ?? undefined}
                    loadNonce={loadNonce}
                    onDocChange={(doc) => {
                        latestDocRef.current = doc
                        if (templateName !== doc.title) {
                            setTemplateName(doc.title)
                        }
                    }}
                    toolbarActions={
                        <>
                            <DocumentLoadMenu
                                fetchRecent={fetchRecent}
                                fetchBrowse={fetchBrowse}
                                onLoad={handleLoad}
                                triggerClassName="px-2 py-1 text-xs"
                                triggerTooltip="ロード"
                            />
                            <button
                                onClick={handleSave}
                                title="保存"
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                            >
                                <Save className="w-3.5 h-3.5" />
                                Save
                            </button>
                        </>
                    }
                />
            </div>
        </div>
    )
}
