import { createColumnHelper } from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  Hash,
  Image as ImageIcon,
  Keyboard,
  Link,
  Type,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { SimpleSearchInput } from '@/components/ui/SimpleSearchInput'
import { SimpleTreeTable } from '@/components/ui/SimpleTreeTable'
import { useI18n } from '@/i18n/I18nContext'
import type { IDataSchema, ISchemaField } from '@/types/schema'
import type { BindingInfo } from './BindingSelector'

type HierarchyItem = {
  id: string
  label: string
  type: ISchemaField['type'] | 'category'
  categoryId?: string
  categoryLabel?: string
  fieldCount?: number
  raw?: ISchemaField | IDataSchema['categories'][number]
  subRows?: HierarchyItem[]
}

const columnHelper = createColumnHelper<HierarchyItem>()

const FIELD_TYPES: Array<ISchemaField['type']> = ['string', 'number', 'date', 'image', 'array']

interface DataBindingModalProps {
  isOpen: boolean
  onClose: () => void
  schema: IDataSchema
  onSelect: (binding: BindingInfo) => void
  mode: 'field' | 'repeater'
  useExcelFormat?: boolean // {Table}.[Field] 形式を使用するか
}

// Icon mapper helper
const getFieldIcon = (type: ISchemaField['type']) => {
  switch (type) {
    case 'string':
      return <Type size={16} className="text-gray-500" />
    case 'number':
      return <Hash size={16} className="text-gray-500" />
    case 'date':
      return <Calendar size={16} className="text-gray-500" />
    case 'image':
      return <ImageIcon size={16} className="text-gray-500" />
    case 'array':
      return <Link size={16} className="text-gray-500" />
    default:
      return <Type size={16} className="text-gray-500" />
  }
}

const getItemKey = (item: HierarchyItem) =>
  item.type === 'category' ? `cat:${item.id}` : `field:${item.categoryId || '_'}:${item.id}`

const isTextLikeTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable ||
    Boolean(el.closest('[role="textbox"]'))
  )
}

export const DataBindingModal: React.FC<DataBindingModalProps> = ({
  isOpen,
  onClose,
  schema,
  onSelect,
  mode,
  useExcelFormat = true,
}) => {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<HierarchyItem[]>([])
  const [selectedRepeater, setSelectedRepeater] = useState<HierarchyItem | null>(null)
  const [delimiter, setDelimiter] = useState('-')
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | ISchemaField['type']>('all')
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setSearchQuery('')
    setSelectedItems([])
    setSelectedRepeater(null)
    setDelimiter('-')
    setActiveTypeFilter('all')
    setHighlightedKey(null)
  }, [isOpen, mode])

  const hierarchyItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const matchesQuery = (item: {
      label: string
      id: string
      categoryLabel?: string
      type?: string
    }) => {
      if (!query) return true
      return [item.label, item.id, item.categoryLabel || '', item.type || '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    }

    const rootItems: HierarchyItem[] = schema.categories.map((cat) => {
      const children: HierarchyItem[] = cat.fields
        .filter((field) => activeTypeFilter === 'all' || field.type === activeTypeFilter)
        .map((field) => ({
          id: field.id,
          label: field.label,
          type: field.type,
          categoryId: cat.id,
          categoryLabel: cat.label,
          raw: field,
        }))

      return {
        id: cat.id,
        label: cat.label,
        type: 'category',
        fieldCount: cat.fields.length,
        raw: cat,
        subRows: children,
      }
    })

    if (mode === 'repeater') {
      return rootItems.filter((cat) =>
        matchesQuery({
          label: cat.label,
          id: cat.id,
          type: 'category',
        })
      )
    }

    return rootItems.reduce<HierarchyItem[]>((acc, cat) => {
      const catMatches = matchesQuery({
        label: cat.label,
        id: cat.id,
        type: 'category',
      })

      const matchingChildren = cat.subRows?.filter((child) => matchesQuery(child))

      if (catMatches) {
        acc.push({
          ...cat,
          subRows:
            matchingChildren && matchingChildren.length > 0 ? matchingChildren : cat.subRows || [],
        })
      } else if (matchingChildren && matchingChildren.length > 0) {
        acc.push({
          ...cat,
          subRows: matchingChildren,
        })
      }
      return acc
    }, [])
  }, [activeTypeFilter, mode, schema, searchQuery])

  const selectableItems = useMemo(() => {
    if (mode === 'repeater') return hierarchyItems.filter((item) => item.type === 'category')
    return hierarchyItems.flatMap((cat) => cat.subRows || [])
  }, [hierarchyItems, mode])

  useEffect(() => {
    if (selectableItems.length === 0) {
      setHighlightedKey(null)
      return
    }
    const stillExists = highlightedKey
      ? selectableItems.some((item) => getItemKey(item) === highlightedKey)
      : false
    if (!stillExists) {
      setHighlightedKey(getItemKey(selectableItems[0]))
    }
  }, [highlightedKey, selectableItems])

  const typeCounts = useMemo(() => {
    return schema.categories.reduce<Record<ISchemaField['type'], number>>(
      (acc, cat) => {
        cat.fields.forEach((field) => {
          acc[field.type] = (acc[field.type] || 0) + 1
        })
        return acc
      },
      { string: 0, number: 0, date: 0, image: 0, array: 0 }
    )
  }, [schema.categories])

  const generateBindingString = (items: HierarchyItem[]) => {
    if (items.length === 0) return ''

    return items
      .map((item) => {
        if (useExcelFormat && item.type !== 'category' && item.categoryLabel) {
          return `{${item.categoryLabel}}.[${item.label}]`
        }
        return item.id
      })
      .join(delimiter)
  }

  const handleRowClick = (item: HierarchyItem) => {
    if (mode === 'repeater') {
      if (item.type === 'category') {
        setSelectedRepeater(item)
      }
      return
    }

    if (item.type === 'category') return

    const isSelected = selectedItems.some((i) => getItemKey(i) === getItemKey(item))
    if (isSelected) {
      setSelectedItems(selectedItems.filter((i) => getItemKey(i) !== getItemKey(item)))
    } else {
      setSelectedItems([...selectedItems, item])
    }
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newItems = [...selectedItems]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newItems.length) return

    const [movedItem] = newItems.splice(index, 1)
    newItems.splice(targetIndex, 0, movedItem)
    setSelectedItems(newItems)
  }

  const applyError = useMemo(() => {
    if (mode === 'field' && selectedItems.length > 1 && delimiter.length === 0) {
      return t(
        'data_binding_delimiter_required',
        'Delimiter is required when multiple items are selected.'
      )
    }
    return ''
  }, [delimiter.length, mode, selectedItems.length, t])

  const bindingPreview =
    mode === 'field' ? generateBindingString(selectedItems) : selectedRepeater?.id || ''
  const selectedCount = mode === 'field' ? selectedItems.length : selectedRepeater ? 1 : 0
  const canApply =
    mode === 'field' ? selectedItems.length > 0 && !applyError : Boolean(selectedRepeater)

  const selectedRepeaterFields = useMemo(() => {
    const raw = selectedRepeater?.raw
    if (!raw || !('fields' in raw) || !Array.isArray(raw.fields)) return [] as ISchemaField[]
    return raw.fields as ISchemaField[]
  }, [selectedRepeater])

  const handleApply = () => {
    if (!canApply) return

    if (mode === 'repeater') {
      if (!selectedRepeater) return
      onSelect({
        field: selectedRepeater.id,
        sourceId: selectedRepeater.id,
        fieldId: selectedRepeater.id,
        path: selectedRepeater.id,
      })
      onClose()
      return
    }

    if (selectedItems.length === 0) return

    const bindingString = generateBindingString(selectedItems)

    onSelect({
      field: bindingString,
      sourceId: selectedItems[0].categoryId || '',
      fieldId: selectedItems[0].id,
      path: bindingString,
    })
    onClose()
  }

  const handleDialogKeyDown = (event: React.KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      if (canApply) {
        event.preventDefault()
        handleApply()
      }
      return
    }

    if (isTextLikeTarget(event.target)) return
    if (selectableItems.length === 0) return

    const currentIndex = highlightedKey
      ? selectableItems.findIndex((item) => getItemKey(item) === highlightedKey)
      : 0

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const delta = event.key === 'ArrowDown' ? 1 : -1
      const baseIndex = currentIndex >= 0 ? currentIndex : 0
      const nextIndex = (baseIndex + delta + selectableItems.length) % selectableItems.length
      setHighlightedKey(getItemKey(selectableItems[nextIndex]))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const target = selectableItems[Math.max(0, currentIndex)]
      if (!target) return
      const targetKey = getItemKey(target)
      const alreadySelected =
        mode === 'repeater'
          ? selectedRepeater?.id === target.id
          : selectedItems.some((item) => getItemKey(item) === targetKey)

      handleRowClick(target)

      if (mode === 'repeater' && alreadySelected && canApply) {
        handleApply()
      }
    }
  }

  const fieldColumns = useMemo(
    () => [
      columnHelper.accessor('label', {
        id: 'label',
        header: t('data_binding_name', 'Name'),
        cell: (info) => {
          const item = info.row.original
          const key = getItemKey(item)
          const isSelected = selectedItems.some((i) => getItemKey(i) === key)
          const isHighlighted = highlightedKey === key
          return (
            <div
              className={`flex items-center gap-2 rounded px-1 py-0.5 ${isHighlighted ? 'bg-primary/10' : ''}`}
            >
              {item.type !== 'category' && (
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}
                >
                  {isSelected && <Check size={12} className="text-primary-foreground" />}
                </div>
              )}
              <span
                className={
                  item.type === 'category'
                    ? 'font-bold text-foreground'
                    : 'font-medium text-muted-foreground'
                }
              >
                {info.getValue()}
              </span>
            </div>
          )
        },
      }),
      columnHelper.accessor('type', {
        id: 'type',
        header: t('data_binding_type', 'Type'),
        cell: (info) => {
          const typeValue = info.getValue()
          if (typeValue === 'category') {
            return (
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('data_binding_category', 'Category')}
              </span>
            )
          }
          return (
            <div className="flex items-center gap-2">
              {getFieldIcon(typeValue as ISchemaField['type'])}
              <span className="text-xs text-muted-foreground capitalize">{typeValue}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor('id', {
        id: 'id',
        header: t('data_binding_id', 'ID'),
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
    ],
    [highlightedKey, selectedItems, t]
  )

  const repeaterColumns = useMemo(
    () => [
      columnHelper.accessor('label', {
        id: 'label',
        header: t('data_binding_category', 'Category'),
        cell: (info) => {
          const item = info.row.original
          const isSelected = selectedRepeater?.id === item.id
          const isHighlighted = highlightedKey === getItemKey(item)
          return (
            <div
              className={`flex items-center gap-2 rounded px-1 py-0.5 ${isHighlighted ? 'bg-primary/10' : ''}`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}
              >
                {isSelected && <Check size={12} className="text-primary-foreground" />}
              </div>
              <span className="font-semibold text-foreground">{info.getValue()}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor((row) => String(row.fieldCount ?? 0), {
        id: 'fieldCount',
        header: t('fields', 'Fields'),
        cell: (info) => <span className="text-xs text-muted-foreground">{info.getValue()}</span>,
      }),
      columnHelper.accessor('id', {
        id: 'id',
        header: t('data_binding_id', 'ID'),
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
    ],
    [highlightedKey, selectedRepeater?.id, t]
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!w-[86vw] !max-w-[1320px] !h-[86vh] max-h-[900px] flex flex-col p-0 gap-0"
        onKeyDown={handleDialogKeyDown}
      >
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle>
            {mode === 'field'
              ? t('data_binding_select_field', 'Select Field')
              : t('data_binding_select_repeater', 'Select Repeater')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 py-2 border-b border-border bg-background/95 flex items-center gap-3">
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {selectedCount} {t('selected', 'selected')}
          </div>
          <div className="min-w-0 flex-1 px-2 py-1 bg-background rounded border border-border text-xs font-mono truncate">
            {bindingPreview || <span className="opacity-40 italic">{t('preview', 'Preview')}</span>}
          </div>
          {mode === 'field' && selectedItems.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setSelectedItems([])}>
              {t('clear', 'Clear')}
            </Button>
          )}
        </div>

        <div className="flex-1 flex overflow-hidden bg-secondary">
          <div
            className={`flex flex-col p-4 overflow-hidden ${mode === 'field' ? 'flex-[3] border-r border-border' : 'flex-1'}`}
          >
            <div className="w-full max-w-sm mb-3 shrink-0">
              <SimpleSearchInput
                placeholder={t('search_placeholder', 'Search...')}
                value={searchQuery}
                onSearch={setSearchQuery}
                autoFocus
              />
            </div>

            {mode === 'field' && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className={`px-2 py-1 rounded border text-xs ${activeTypeFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground'}`}
                  onClick={() => setActiveTypeFilter('all')}
                >
                  {t('all', 'All')}
                </button>
                {FIELD_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`px-2 py-1 rounded border text-xs capitalize ${activeTypeFilter === type ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground'}`}
                    onClick={() => setActiveTypeFilter(type)}
                  >
                    {type} ({typeCounts[type] || 0})
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 min-h-0 overflow-auto bg-background rounded-md border border-border">
              {mode === 'field' ? (
                <SimpleTreeTable
                  data={hierarchyItems}
                  columns={fieldColumns}
                  onRowClick={handleRowClick}
                  getRowId={getItemKey}
                  getSubRows={(row) => row.subRows}
                  className="border-0 rounded-none shadow-none"
                />
              ) : (
                <SimpleTreeTable
                  data={hierarchyItems}
                  columns={repeaterColumns}
                  onRowClick={handleRowClick}
                  getRowId={getItemKey}
                  className="border-0 rounded-none shadow-none"
                />
              )}
            </div>

            {mode === 'repeater' && (
              <div className="mt-3 rounded-md border border-border bg-background p-3 text-xs">
                <div className="font-semibold text-foreground mb-1">
                  {t('source', 'Source')} {selectedRepeater ? `: ${selectedRepeater.label}` : ''}
                </div>
                {!selectedRepeater ? (
                  <div className="text-muted-foreground">
                    {t('data_binding_select_repeater', 'Select Repeater')}
                  </div>
                ) : (
                  <>
                    <div className="text-muted-foreground mb-2">
                      {selectedRepeaterFields.length} {t('fields', 'fields')}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedRepeaterFields.slice(0, 6).map((field) => (
                        <span
                          key={field.id}
                          className="rounded border border-border bg-secondary px-2 py-0.5"
                        >
                          {field.label}
                        </span>
                      ))}
                      {selectedRepeaterFields.length > 6 && (
                        <span className="text-muted-foreground">
                          +{selectedRepeaterFields.length - 6}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {mode === 'field' && (
            <div className="flex-[2] flex flex-col p-4 overflow-hidden">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                {t('selected_items_order', 'Selected Items & Order')}
              </h3>

              <div className="mb-3 flex flex-wrap gap-1.5 min-h-[32px]">
                {selectedItems.map((item) => (
                  <span
                    key={getItemKey(item)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                  >
                    {item.label}
                    <button
                      onClick={() =>
                        setSelectedItems(
                          selectedItems.filter((i) => getItemKey(i) !== getItemKey(item))
                        )
                      }
                      className="text-muted-foreground hover:text-destructive"
                      type="button"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex-1 min-h-0 overflow-auto mb-4 bg-background rounded-md border border-border">
                {selectedItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                    <Check size={32} className="opacity-20 mb-2" />
                    <p className="text-xs">
                      {t(
                        'data_binding_empty_hint',
                        'Select fields from the left to build your binding statement.'
                      )}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {selectedItems.map((item, index) => (
                      <li
                        key={getItemKey(item)}
                        className="p-2 flex items-center justify-between group hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-bold truncate">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {item.categoryLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-muted disabled:opacity-20"
                            type="button"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === selectedItems.length - 1}
                            className="p-1 rounded hover:bg-muted disabled:opacity-20"
                            type="button"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            onClick={() =>
                              setSelectedItems(
                                selectedItems.filter((i) => getItemKey(i) !== getItemKey(item))
                              )
                            }
                            className="p-1 rounded hover:bg-destructive hover:text-destructive-foreground ml-1"
                            type="button"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="shrink-0 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">
                    {t('delimiter', 'Delimiter')}
                  </label>
                  <input
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                    placeholder="e.g. -, /, space"
                  />
                  {applyError && <p className="mt-1 text-xs text-destructive">{applyError}</p>}
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase mb-1 block">
                    {t('preview', 'Preview')}
                  </label>
                  <div className="px-3 py-2 bg-background rounded border border-border text-sm font-mono break-all min-h-[2.5rem] flex items-center">
                    {bindingPreview || (
                      <span className="opacity-30 italic">{t('preview', 'Preview')}...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border bg-background flex justify-between items-center">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Keyboard size={14} />
            <span>
              {t(
                'data_binding_shortcuts',
                'Arrows: move focus / Enter: select / Ctrl+Enter: apply'
              )}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              {t('cancel', 'Cancel')}
            </Button>
            <Button variant="default" size="sm" onClick={handleApply} disabled={!canApply}>
              {t('apply', 'Apply')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
