import { FilePlus, Upload } from 'lucide-react'
import type React from 'react'
import { useRef } from 'react'
import type { Surface } from '@/types/canvas'
import { generateUUID } from '@/utils/browser'

interface BulkImageImportProps {
  onImport: (newSurfaces: Surface[]) => void
}

export const BulkImageImport: React.FC<BulkImageImportProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newSurfaces: Surface[] = []

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue

      // Convert image to data URL for local preview/background
      // In production, this would be uploaded to R2 and reference assetId
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (event) => resolve(event.target?.result as string)
        reader.readAsDataURL(file)
      })

      // Get image dimensions
      const img = new Image()
      await new Promise((resolve) => {
        img.onload = resolve
        img.src = dataUrl
      })

      // Scale height relative to A4 (210mm width)
      // or just use 210x297 if mismatch, but for manga we usually want exact aspect
      const aspectRatio = img.height / img.width
      const surfaceWidth = 210
      const surfaceHeight = 210 * aspectRatio

      newSurfaces.push({
        id: `page-${generateUUID()}`,
        type: 'page',
        w: surfaceWidth,
        h: surfaceHeight,
        bg: dataUrl,
        margin: { t: 0, r: 0, b: 0, l: 0 },
      })
    }

    if (newSurfaces.length > 0) {
      onImport(newSurfaces)
    }

    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-4 border-b border-border bg-secondary/50">
      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Upload size={16} /> Bulk Page Import
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Upload multiple manga pages. Each image will create a new editor page.
      </p>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 text-sm transition-colors"
      >
        <FilePlus size={18} /> Select Images
      </button>
    </div>
  )
}
