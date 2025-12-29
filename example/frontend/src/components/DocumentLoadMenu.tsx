import React, { useCallback, useEffect, useMemo, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronDown, FolderOpen, Loader2, Search } from 'lucide-react'
import type { DocumentSummary, DocumentType } from '../api/documents'
import { getDocument, listDocuments } from '../api/documents'

interface DocumentLoadMenuProps {
  user: string
  type: DocumentType
  onLoad: (document: { payload: unknown; title: string }) => void
  triggerClassName?: string
  triggerTooltip?: string
}

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString()

export const DocumentLoadMenu: React.FC<DocumentLoadMenuProps> = ({
  user,
  type,
  onLoad,
  triggerClassName,
  triggerTooltip,
}) => {
  const [quickList, setQuickList] = useState<DocumentSummary[]>([])
  const [quickLoading, setQuickLoading] = useState(false)
  const [browseOpen, setBrowseOpen] = useState(false)
  const [browseList, setBrowseList] = useState<DocumentSummary[]>([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseQuery, setBrowseQuery] = useState('')
  const [browseOffset, setBrowseOffset] = useState(0)
  const [browseHasMore, setBrowseHasMore] = useState(true)

  const loadQuickList = useCallback(async () => {
    setQuickLoading(true)
    try {
      const response = await listDocuments({ user, type, limit: 5 })
      setQuickList(response.items)
    } finally {
      setQuickLoading(false)
    }
  }, [user, type])

  const fetchBrowse = useCallback(
    async (options: { reset: boolean }) => {
      setBrowseLoading(true)
      try {
        const nextOffset = options.reset ? 0 : browseOffset
        const response = await listDocuments({
          user,
          type,
          q: browseQuery.trim() || undefined,
          limit: 20,
          offset: nextOffset,
        })
        setBrowseList((prev) => (options.reset ? response.items : [...prev, ...response.items]))
        setBrowseOffset(nextOffset + response.items.length)
        setBrowseHasMore(response.items.length === 20)
      } finally {
        setBrowseLoading(false)
      }
    },
    [user, type, browseQuery, browseOffset]
  )

  const handleLoadById = useCallback(
    async (id: string) => {
      const detail = await getDocument(id, user)
      onLoad({ payload: detail.payload, title: detail.title })
    },
    [onLoad, user]
  )

  const quickContent = useMemo(() => {
    if (quickLoading) {
      return (
        <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading...
        </div>
      )
    }
    if (quickList.length === 0) {
      return <div className="px-3 py-2 text-xs text-muted-foreground">No saved documents</div>
    }
    return quickList.map((doc) => (
      <DropdownMenu.Item
        key={doc.id}
        onSelect={(event) => {
          event.preventDefault()
          handleLoadById(doc.id)
        }}
        className="px-3 py-2 text-sm text-foreground hover:bg-accent cursor-pointer"
      >
        <div className="flex flex-col">
          <span className="font-medium truncate max-w-[220px]">{doc.title}</span>
          <span className="text-xs text-muted-foreground">{formatDate(doc.updatedAt)}</span>
        </div>
      </DropdownMenu.Item>
    ))
  }, [quickLoading, quickList, handleLoadById])

  useEffect(() => {
    if (browseOpen) {
      fetchBrowse({ reset: true })
    }
  }, [browseOpen, fetchBrowse])

  return (
    <Dialog.Root open={browseOpen} onOpenChange={setBrowseOpen}>
      <DropdownMenu.Root onOpenChange={(open) => open && loadQuickList()}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            title={triggerTooltip ?? 'Load'}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent rounded-md border border-border transition-colors shadow-sm whitespace-nowrap flex-shrink-0 ${triggerClassName ?? ''}`}
          >
            <FolderOpen className="w-4 h-4" />
            Load
            <ChevronDown className="w-3 h-3" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="bg-popover border border-border rounded-md shadow-md min-w-[260px] py-2 z-50"
          >
            <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">Quick List</div>
            {quickContent}
            <DropdownMenu.Separator className="h-px bg-border my-1" />
            <DropdownMenu.Item
              onSelect={(event) => {
                event.preventDefault()
                setBrowseOpen(true)
              }}
              className="px-3 py-2 text-sm text-foreground hover:bg-accent cursor-pointer"
            >
              Browse...
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background border border-border shadow-lg p-6">
          <Dialog.Title className="text-lg font-semibold text-foreground">Browse Documents</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mt-1">
            Select a saved document to load.
          </Dialog.Description>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 border border-border rounded-md px-2 py-1 bg-background">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                value={browseQuery}
                onChange={(event) => setBrowseQuery(event.target.value)}
                placeholder="Search by title"
                className="flex-1 bg-transparent text-sm text-foreground outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchBrowse({ reset: true })}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-accent"
            >
              Search
            </button>
          </div>

          <div className="mt-4 border border-border rounded-md max-h-72 overflow-auto divide-y divide-border">
            {browseLoading && browseList.length === 0 && (
              <div className="px-4 py-6 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            )}
            {!browseLoading && browseList.length === 0 && (
              <div className="px-4 py-6 text-sm text-muted-foreground">No documents found</div>
            )}
            {browseList.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={async () => {
                  await handleLoadById(doc.id)
                  setBrowseOpen(false)
                }}
                className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
              >
                <div className="text-sm font-medium text-foreground truncate">{doc.title}</div>
                <div className="text-xs text-muted-foreground">{formatDate(doc.updatedAt)}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setBrowseOpen(false)}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => fetchBrowse({ reset: false })}
              disabled={!browseHasMore || browseLoading}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-accent disabled:opacity-50"
            >
              Load More
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
