import React, { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { importExcel } from '../api/documents'

interface ExcelImportPageProps {
    onBack: () => void
    onComplete: (id: string) => void
}

export const ExcelImportPage: React.FC<ExcelImportPageProps> = ({ onBack, onComplete }) => {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = e.dataTransfer.files
        if (files.length > 0 && files[0].name.match(/\.xlsx?$/)) {
            setFile(files[0])
            setError(null)
        } else {
            setError('Please select a valid Excel file (.xlsx or .xls)')
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0])
            setError(null)
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setIsUploading(true)
        setError(null)

        try {
            const result = await importExcel(file)
            onComplete(result.id)
        } catch (err) {
            console.error('Upload failed', err)
            setError('Failed to upload and convert the file. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-background text-foreground">
            <header className="h-14 border-b border-border bg-secondary flex items-center px-4 shrink-0 gap-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold">Import Excel to PDF</h1>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="max-w-xl w-full">
                    <div
                        className={`
              border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
              flex flex-col items-center justify-center gap-4
              ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-border bg-card'}
              ${file ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
            `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <>
                                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                    <FileSpreadsheet className="w-8 h-8 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium">{file.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setFile(null)
                                        if (fileInputRef.current) fileInputRef.current.value = ''
                                    }}
                                    className="text-sm text-red-500 hover:text-red-700 underline"
                                >
                                    Remove
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium mb-1">Upload Excel File</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Drag and drop or click to select
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileSelect}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                                >
                                    Select File
                                </button>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-4 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            className={`
                flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all
                ${!file || isUploading
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
                                }
              `}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Converting...
                                </>
                            ) : (
                                <>
                                    Convert to PDF Template
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}
