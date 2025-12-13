import { Calendar, Hash, Image as ImageIcon, Link, Type } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createColumnHelper } from '@tanstack/react-table'
import { SimpleTreeTable } from '../../../../../../components/ui/SimpleTreeTable'
import { Button } from '../../../../../../components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../../../components/ui/Dialog'
import { SimpleSearchInput } from '../../../../../../components/ui/SimpleSearchInput'
import type { IDataSchema, ISchemaField } from '../../../../../../types/schema'
import type { BindingInfo } from './BindingSelector'

type HierarchyItem = {
  id: string
  label: string
  type: ISchemaField['type'] | 'category'
  categoryId?: string
  categoryLabel?: string
  raw?: ISchemaField | IDataSchema['categories'][number]
  subRows?: HierarchyItem[]
}

const columnHelper = createColumnHelper<HierarchyItem>()

interface DataBindingModalProps {
  isOpen: boolean
  onClose: () => void
  schema: IDataSchema
  onSelect: (binding: BindingInfo) => void
  mode: 'field' | 'repeater'
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

export const DataBindingModal: React.FC<DataBindingModalProps> = ({
  isOpen,
  onClose,
  schema,
  onSelect,
  mode,
}) => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  // Filter logic (Hierarchical)
  const hierarchyItems = useMemo(() => {
    const query = searchQuery.toLowerCase()

    // Map categories to hierarchy items
    const rootItems: HierarchyItem[] = schema.categories.map((cat) => {
      // Map fields to children
      const children: HierarchyItem[] = cat.fields.map((field) => ({
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
        raw: cat,
        subRows: children,
      }
    })

    if (!query) return rootItems

    // Filter: If category matches, show it. If child matches, show it + parent.
    return rootItems.reduce<HierarchyItem[]>((acc, cat) => {
      const catMatches = cat.label.toLowerCase().includes(query)

      // Filter children
      const matchingChildren = cat.subRows?.filter((child) =>
        child.label.toLowerCase().includes(query)
      )

      if (catMatches) {
        acc.push({
          ...cat,
          subRows:
            matchingChildren && matchingChildren.length > 0 ? matchingChildren : cat.subRows || [],
        })
      } else if (matchingChildren && matchingChildren.length > 0) {
        // Category doesn't match but child does -> Include category with only matching children
        acc.push({
          ...cat,
          subRows: matchingChildren,
        })
      }
      return acc
    }, [])
  }, [schema, searchQuery])

  const handleSelect = (item: HierarchyItem) => {
    if (mode === 'repeater') {
      // In repeater mode, we bind CATEGORIES
      if (item.type === 'category') {
        onSelect({
          field: item.id, // For repeater, often just category ID
          sourceId: item.id,
          fieldId: item.id,
          path: item.id,
        })
        onClose()
      }
    } else {
      // In field mode, we bind FIELDS (children)
      if (item.type !== 'category' && item.categoryId) {
        const dotPath = `${item.categoryId}.${item.id}`
        onSelect({
          field: dotPath,
          sourceId: item.categoryId,
          fieldId: item.id,
          path: item.id,
        })
        onClose()
      }
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('label', {
        id: 'label',
        header: t('data_binding_name'),
        cell: (info) => {
          const item = info.row.original
          return (
            <span
              className={
                item.type === 'category'
                  ? 'font-bold text-theme-text-primary'
                  : 'font-medium text-theme-text-secondary'
              }
            >
              {info.getValue()}
            </span>
          )
        },
      }),
      columnHelper.accessor('type', {
        id: 'type',
        header: t('data_binding_type'),
        cell: (info) => {
          const typeValue = info.getValue()
          if (typeValue === 'category')
            return (
              <span className="text-xs font-semibold text-theme-text-tertiary uppercase tracking-wider">
                {t('data_binding_category')}
              </span>
            )
          return (
            <div className="flex items-center gap-2">
              {getFieldIcon(typeValue as ISchemaField['type'])}
              <span className="text-xs text-theme-text-secondary capitalize">{typeValue}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor('id', {
        id: 'id',
        header: t('data_binding_id'),
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
    ],
    [t]
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-theme-border">
          <DialogTitle>
            {mode === 'field' ? t('data_binding_select_field') : t('data_binding_select_repeater')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col p-4 min-h-0 overflow-hidden bg-theme-bg-secondary">
          <div className="w-full max-w-sm mb-4 shrink-0">
            <SimpleSearchInput
              placeholder={t('data_binding_search_placeholder')}
              value={searchQuery}
              onSearch={setSearchQuery}
              autoFocus
            />
          </div>
          <div className="flex-1 min-h-0 overflow-auto bg-theme-bg-primary rounded-md border border-theme-border">
            <SimpleTreeTable
              data={hierarchyItems}
              columns={columns}
              onRowClick={handleSelect}
              getRowId={(row) => row.id}
              getSubRows={(row) => row.subRows}
              className="border-0 rounded-none shadow-none"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-theme-border bg-theme-bg-primary">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
