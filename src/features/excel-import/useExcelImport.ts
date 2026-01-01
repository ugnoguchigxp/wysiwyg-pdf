import { useCallback, useRef, useState } from 'react'
import { excelToDoc } from './excelToDoc'
import type { ExcelImportOptions } from './types'
import type { Doc } from '../../types/canvas'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

interface UseExcelImportReturn {
  /** ファイル選択ダイアログを開く */
  openFilePicker: () => void
  /** 変換中フラグ */
  isLoading: boolean
  /** 最後のエラーメッセージ */
  error: string | null
}

export function useExcelImport(onSuccess: (doc: Doc) => void, options: ExcelImportOptions = {}): UseExcelImportReturn {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 隠し input を初期化
  if (typeof document !== 'undefined' && !inputRef.current) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx'
    input.style.display = 'none'
    document.body.appendChild(input)
    inputRef.current = input
  }

  const openFilePicker = useCallback(() => {
    const input = inputRef.current
    if (!input) return

    input.onchange = async () => {
      const file = input.files?.[0]
      input.value = '' // reset
      if (!file) return

      // バリデーション
      if (!file.name.endsWith('.xlsx')) {
        setError('xlsx ファイルを選択してください')
        return
      }
      if (file.size > MAX_SIZE) {
        setError('ファイルサイズは 10MB 以下にしてください')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const buffer = await file.arrayBuffer()
        const doc = await excelToDoc(buffer, options)
        onSuccess(doc)
      } catch (e) {
        setError(e instanceof Error ? e.message : '変換に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    input.click()
  }, [onSuccess, options])

  return { openFilePicker, isLoading, error }
}
