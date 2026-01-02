import type React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useQueue } from '@/modules/queue/hooks'

import { QueueHeader } from './QueueHeader'
import { QueueItem } from './QueueItem'

type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

interface IQueueViewerProps {
  position?: Position
  defaultExpanded?: boolean
  maxHeight?: number
  className?: string
}

const positionClasses: Record<Position, string> = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
}

export const QueueViewer: React.FC<IQueueViewerProps> = ({
  position = 'bottom-right',
  defaultExpanded = true,
  maxHeight = 400,
  className,
}) => {
  const { items, stats, clear } = useQueue()
  const [expanded, setExpanded] = useState(defaultExpanded)

  if (items.length === 0) return null

  const handleClose = () => {
    if (stats.inProgress > 0) {
      if (
        window.confirm(
          'Tasks are currently running. Stopping the queue will cancel all running tasks. Are you sure?'
        )
      ) {
        clear()
      }
    } else {
      clear()
    }
  }

  return (
    <div
      id="queue-viewer"
      className={cn(
        'fixed z-[100] w-80 overflow-hidden rounded-lg border border-border bg-background shadow-xl transition-all duration-300',
        positionClasses[position],
        className
      )}
    >
      <QueueHeader
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        onClose={handleClose}
      />

      {expanded && (
        <div className="overflow-y-auto p-2 scrollbar-thin" style={{ maxHeight: `${maxHeight}px` }}>
          <div className="flex flex-col gap-1.5">
            {items.map((item) => (
              <QueueItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
