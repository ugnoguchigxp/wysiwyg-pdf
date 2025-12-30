import React, { useRef, useState, useCallback, useEffect } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { SlideEditor, type Doc, DocumentLoadMenu, useQueue } from 'wysiwyg-pdf'
import { saveDocument, listDocuments, getDocument } from '../api/documents'
import { uploadDocAssets } from '../utils/upload-helper'

interface SlideEditorPageProps {
    onBack: () => void
}

export const SlideEditorPage: React.FC<SlideEditorPageProps> = ({ onBack }) => {
    const [templateName, setTemplateName] = useState('New Presentation')
    const [loadDoc, setLoadDoc] = useState<Doc | null>(null)
    const [loadNonce, setLoadNonce] = useState(0)
    const [isMasterEditMode, setIsMasterEditMode] = useState(false)
    const templateNameRef = useRef(templateName)
    const isMasterEditModeRef = useRef(false)

    useEffect(() => {
        templateNameRef.current = templateName
    }, [templateName])
    useEffect(() => {
        isMasterEditModeRef.current = isMasterEditMode
    }, [isMasterEditMode])
    const latestDocRef = useRef<Doc | null>(null)
    const { addTask } = useQueue()

    // Saved Masters for template dropdown
    const [savedMasters, setSavedMasters] = useState<{ id: string; title: string }[]>([])

    // Fetch saved masters on mount
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const response = await listDocuments({ user: 'anonymous', type: 'slide-master', limit: 50 })
                setSavedMasters(response.items.map(item => ({ id: item.id, title: item.title })))
            } catch (error) {
                console.error('Failed to fetch saved masters:', error)
            }
        }
        fetchMasters()
    }, [])

    // Handle loading a saved master into current document
    const handleLoadSavedMaster = useCallback(async (masterId: string) => {
        try {
            const detail = await getDocument(masterId, 'anonymous')
            const masterDoc = detail.payload as Doc
            // Apply master surfaces and nodes to current document
            // This replaces all master surfaces in the current doc with the loaded ones
            if (latestDocRef.current) {
                const currentDoc = latestDocRef.current
                // Get loaded master surfaces (those without masterId)
                const loadedMasterSurfaces = masterDoc.surfaces.filter(s => !s.masterId)
                const loadedMasterNodes = masterDoc.nodes.filter(n =>
                    loadedMasterSurfaces.some(m => m.id === n.s)
                )
                // Keep current slides (those with masterId)
                const currentSlides = currentDoc.surfaces.filter(s => !!s.masterId)
                const currentSlideNodes = currentDoc.nodes.filter(n =>
                    currentSlides.some(sl => sl.id === n.s)
                )
                // Merge: loaded masters + current slides
                const newDoc: Doc = {
                    ...currentDoc,
                    surfaces: [...loadedMasterSurfaces, ...currentSlides],
                    nodes: [...loadedMasterNodes, ...currentSlideNodes]
                }
                setLoadDoc(newDoc)
                setLoadNonce(prev => prev + 1)
            }
        } catch (error) {
            console.error('Failed to load saved master:', error)
            alert('マスターの読み込みに失敗しました')
        }
    }, [])

    const fetchRecent = useCallback(async () => {
        const docType = isMasterEditModeRef.current ? 'slide-master' : 'slide'
        const response = await listDocuments({ user: 'anonymous', type: docType, limit: 5 })
        return response.items
    }, [])

    const fetchBrowse = useCallback(
        async (query: string, offset: number) => {
            const docType = isMasterEditModeRef.current ? 'slide-master' : 'slide'
            const response = await listDocuments({
                user: 'anonymous',
                type: docType,
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

    const handleSave = useCallback(async (e?: React.MouseEvent | React.FormEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        if (!latestDocRef.current) {
            console.error('[SlideEditorPage] latestDocRef.current is null!')
            return
        }

        try {
            const trimmedTitle = templateNameRef.current.trim() || 'Untitled'

            console.log('[SlideEditorPage] Uploading assets...', trimmedTitle)
            const docWithAssets = await uploadDocAssets(
                {
                    ...latestDocRef.current,
                    title: trimmedTitle,
                },
                addTask
            )

            console.log('[SlideEditorPage] Assets uploaded. Saving document...')
            const docType = isMasterEditModeRef.current ? 'slide-master' : 'slide'
            let result = await saveDocument({
                user: 'anonymous',
                type: docType,
                title: trimmedTitle,
                payload: docWithAssets,
            })

            if (result.status === 'exists') {
                console.log('[SlideEditorPage] Title exists, asking confirm...')
                const confirmed = window.confirm('同名の保存データがあります。上書きしますか？')
                if (!confirmed) return

                result = await saveDocument({
                    user: 'anonymous',
                    type: docType,
                    title: trimmedTitle,
                    payload: docWithAssets,
                    force: true,
                })
            }

            console.log('[SlideEditorPage] Save success:', result)
            alert('Saved!')
        } catch (error) {
            console.error('[SlideEditorPage] Save failed:', error)
            alert('Failed to save presentation: ' + (error instanceof Error ? error.message : String(error)))
        }
    }, [addTask])

    return (
        <div className="h-screen w-screen flex flex-col bg-background">
            {/* Header */}
            <div className="h-14 border-b border-border bg-secondary flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
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
                    onDocChange={useCallback((doc: Doc) => {
                        latestDocRef.current = doc
                        if (templateNameRef.current !== doc.title) {
                            setTemplateName(doc.title)
                        }
                    }, [])}
                    onMasterModeChange={setIsMasterEditMode}
                    savedMasters={savedMasters}
                    onLoadSavedMaster={handleLoadSavedMaster}
                    toolbarActions={
                        isMasterEditMode ? (
                            // Master Edit Mode: Only Save (Load is in TopToolbar as テンプレートをロード)
                            <button
                                type="button"
                                onClick={handleSave}
                                title="マスターを保存"
                                className="flex items-center gap-1 h-8 px-3 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                マスター保存
                            </button>
                        ) : (
                            // Slide Edit Mode: Show Slide Load/Save
                            <>
                                <DocumentLoadMenu
                                    fetchRecent={fetchRecent}
                                    fetchBrowse={fetchBrowse}
                                    onLoad={handleLoad}
                                    triggerClassName="px-2 py-1 text-xs"
                                    triggerTooltip="ロード"
                                />
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    title="保存"
                                    className="flex items-center gap-1 h-8 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                >
                                    <Save className="h-4 w-4" />
                                    Save
                                </button>
                            </>
                        )
                    }
                />
            </div>
        </div>
    )
}
