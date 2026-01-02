import type { Doc } from '../../types/canvas'
import type { ExcelImportOptions } from './types'
import { useExcelImport } from './useExcelImport'

interface Props {
  onImport: (doc: Doc) => void
  options?: ExcelImportOptions
  className?: string
}

export function ExcelImportButton({ onImport, options, className }: Props) {
  const { openFilePicker, isLoading, error } = useExcelImport(onImport, options)

  return (
    <button
      type="button"
      onClick={openFilePicker}
      disabled={isLoading}
      className={className}
      title={error ?? undefined}
    >
      {isLoading ? '変換中…' : 'Excel 読み込み'}
    </button>
  )
}
