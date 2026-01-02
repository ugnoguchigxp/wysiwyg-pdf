import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, FolderOpen, Loader2, Search } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

export interface DocumentSummary {
  id: string
  title: string
  updatedAt: number
}

export interface DocumentLoadMenuProps {
  /**
   * Retrieve the list of recent documents.
   * limit defaults to 5 in the implementation if not specified,
   * but the fetcher function can handle it.
   */
  fetchRecent: () => Promise<DocumentSummary[]>

  /**
   * Search or browse documents.
   */
  fetchBrowse: (
    query: string,
    offset: number
  ) => Promise<{ items: DocumentSummary[]; hasMore: boolean }>

  /**
   * Callback when a document is selected to be loaded.
   * The ID is passed, so the parent can fetch the full content.
   */
  onLoad: (id: string) => Promise<void> | void

  triggerClassName?: string
  triggerTooltip?: string
}

const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString()

export const DocumentLoadMenu: React.FC<DocumentLoadMenuProps> = ({
  fetchRecent,
  fetchBrowse,
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
      const items = await fetchRecent()
      setQuickList(items)
    } finally {
      setQuickLoading(false)
    }
  }, [fetchRecent])

  const handleFetchBrowse = useCallback(
    async (options: { reset: boolean }) => {
      setBrowseLoading(true)
      try {
        const nextOffset = options.reset ? 0 : browseOffset
        const { items, hasMore } = await fetchBrowse(browseQuery.trim(), nextOffset)

        setBrowseList((prev) => (options.reset ? items : [...prev, ...items]))
        setBrowseOffset(nextOffset + items.length)
        setBrowseHasMore(hasMore)
      } finally {
        setBrowseLoading(false)
      }
    },
    [fetchBrowse, browseQuery, browseOffset]
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
          onLoad(doc.id)
        }}
        className="px-3 py-2 text-sm text-foreground hover:bg-accent cursor-pointer outline-none"
      >
        <div className="flex flex-col">
          <span className="font-medium truncate max-w-[220px]">{doc.title}</span>
          <span className="text-xs text-muted-foreground">{formatDate(doc.updatedAt)}</span>
        </div>
      </DropdownMenu.Item>
    ))
  }, [quickLoading, quickList, onLoad])

  useEffect(() => {
    if (browseOpen) {
      handleFetchBrowse({ reset: true })
    }
  }, [browseOpen, handleFetchBrowse])

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
            className="bg-popover border border-border rounded-md shadow-md min-w-[260px] py-2 z-50 animate-in fade-in-80 zoom-in-95"
          >
            <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">Quick List</div>
            {quickContent}
            <DropdownMenu.Separator className="h-px bg-border my-1" />
            <DropdownMenu.Item
              onSelect={(event) => {
                event.preventDefault()
                setBrowseOpen(true)
              }}
              className="px-3 py-2 text-sm text-foreground hover:bg-accent cursor-pointer outline-none"
            >
              Browse...
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background border border-border shadow-lg p-6 z-[61] outline-none animate-in fade-in-90 zoom-in-95">
          <Dialog.Title className="text-lg font-semibold text-foreground">
            Browse Documents
          </Dialog.Title>
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
              onClick={() => handleFetchBrowse({ reset: true })}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors"
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
                  try {
                    await onLoad(doc.id)
                  } finally {
                    setBrowseOpen(false)
                  }
                }}
                className="w-full text-left px-4 py-3 hover:bg-accent transition-colors block"
              >
                <div className="text-sm font-medium text-foreground truncate">{doc.title}</div>
                <div className="text-xs text-muted-foreground">{formatDate(doc.updatedAt)}</div>
              </button>
            ))}
            {browseLoading && browseList.length > 0 && (
              <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading more...
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setBrowseOpen(false)}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleFetchBrowse({ reset: false })}
              disabled={!browseHasMore || browseLoading}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
            >
              Load More
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
