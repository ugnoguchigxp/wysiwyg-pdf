import React, { useState } from 'react';
import { SignatureKonvaEditor } from 'wysiwyg-pdf/modules/konva-editor/signature-editor/SignatureKonvaEditor';

interface SignatureDemoPageProps {
    onBack: () => void;
}

export const SignatureDemoPage: React.FC<SignatureDemoPageProps> = ({ onBack }) => {
    const [savedSignature, setSavedSignature] = useState<string | null>(null);

    const handleSave = (dataUrl: string) => {
        setSavedSignature(dataUrl);
        alert('Signature saved! Check the preview below.');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2 font-medium"
                    >
                        ← Back
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Signature Editor Demo</h1>
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
    );
};
