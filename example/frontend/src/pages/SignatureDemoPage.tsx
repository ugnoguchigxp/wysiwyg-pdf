import React, { useState } from 'react'
import { SignatureKonvaEditor } from 'wysiwyg-pdf'
import { DocumentLoadMenu } from '../components/DocumentLoadMenu'
import { saveDocument } from '../api/documents'

interface SignatureDemoPageProps {
    onBack: () => void;
}

export const SignatureDemoPage: React.FC<SignatureDemoPageProps> = ({ onBack }) => {
    const [savedSignature, setSavedSignature] = useState<string | null>(null)
    const [templateName, setTemplateName] = useState('New Signature')

    const handleSave = (dataUrl: string) => {
        const save = async () => {
            try {
                const trimmedTitle = templateName.trim() || 'Untitled'
                if (trimmedTitle !== templateName) {
                    setTemplateName(trimmedTitle)
                }

                const result = await saveDocument({
                    user: 'anonymous',
                    type: 'signature',
                    title: trimmedTitle,
                    payload: dataUrl,
                })

                if (result.status === 'exists') {
                    const confirmed = window.confirm('同名の保存データがあります。上書きしますか？')
                    if (!confirmed) return
                    await saveDocument({
                        user: 'anonymous',
                        type: 'signature',
                        title: trimmedTitle,
                        payload: dataUrl,
                        force: true,
                    })
                }

                setSavedSignature(dataUrl)
                alert('Signature saved!')
            } catch (error) {
                console.error('[SignatureDemoPage] Error during save:', error)
                alert('Error during save. See console.')
            }
        }

        void save()
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={onBack}
                        className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2 font-medium"
                    >
                        ← Back
                    </button>
                    <input
                        value={templateName}
                        onChange={(event) => setTemplateName(event.target.value)}
                        className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-full max-w-xs bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <DocumentLoadMenu
                        user="anonymous"
                        type="signature"
                        onLoad={({ payload, title }) => {
                            setSavedSignature(payload as string)
                            setTemplateName(title)
                        }}
                    />
                </div>
            </header>

            <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Draw your signature</h2>
                    <div className="flex justify-center bg-gray-100 rounded-lg p-8 border border-dashed border-gray-300">
                        <SignatureKonvaEditor
                            width={600}
                            height={300}
                            onSave={handleSave}
                            onCancel={onBack}
                            initialDataUrl={savedSignature ?? undefined}
                        />
                    </div>
                </div>

                {savedSignature && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fade-in">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Saved Signature Preview</h3>
                        <div className="p-4 border border-gray-200 rounded-lg bg-white inline-block">
                            <img src={savedSignature} alt="Saved Signature" className="max-w-md border border-gray-100" />
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
};
