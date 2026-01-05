import type React from 'react'
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { IQueueItem, IQueueStats } from './Queue.schema'

export interface QueueContextType {
  items: IQueueItem[]
  stats: IQueueStats
  addTask: (
    name: string,
    handler: (
      item: IQueueItem,
      onProgress: (progress: number) => void,
      signal: AbortSignal
    ) => Promise<unknown>
  ) => string
  cancelTask: (id: string) => void
  retryTask: (id: string) => void
  removeTask: (id: string) => void
  clear: () => void
  clearCompleted: () => void
}

export const QueueContext = createContext<QueueContextType | undefined>(undefined)

export const QueueProvider: React.FC<{
  children: React.ReactNode
  maxConcurrent?: number
}> = ({ children, maxConcurrent = 3 }) => {
  const [items, setItems] = useState<IQueueItem[]>([])
  const itemsRef = useRef<IQueueItem[]>([])

  const updateItem = useCallback((id: string, updates: Partial<IQueueItem>) => {
    itemsRef.current = itemsRef.current.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    )
    setItems(itemsRef.current)
  }, [])

  const stats = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total++
        acc[item.status]++
        return acc
      },
      {
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
      } as IQueueStats & { in_progress: number } // Match QueueStatus keys
    ) as IQueueStats
  }, [items])

  const runTask = useCallback(
    async (item: IQueueItem) => {
      const abortController = new AbortController()
      updateItem(item.id, {
        status: 'in_progress',
        startedAt: new Date(),
        abortController,
        progress: 0,
        error: undefined,
      })

      try {
        const result = await item.handler(
          item,
          (progress) => updateItem(item.id, { progress }),
          abortController.signal
        )
        updateItem(item.id, {
          status: 'completed',
          completedAt: new Date(),
          progress: 100,
          result,
        })
      } catch (err: unknown) {
        const error = err as { name?: string; message?: string }
        if (error.name === 'AbortError' || error.message === 'Cancelled') {
          updateItem(item.id, { status: 'cancelled', completedAt: new Date() })
        } else {
          updateItem(item.id, {
            status: 'failed',
            completedAt: new Date(),
            error: error.message || 'Unknown error',
          })
        }
      }
    },
    [updateItem]
  )

  // Scheduler effect
  useEffect(() => {
    const pendingTasks = items.filter((item) => item.status === 'pending')
    const runningCount = items.filter((item) => item.status === 'in_progress').length

    if (pendingTasks.length > 0 && runningCount < maxConcurrent) {
      const nextTask = pendingTasks[0]
      void runTask(nextTask)
    }
  }, [items, maxConcurrent, runTask])

  const addTask = useCallback((name: string, handler: IQueueItem['handler']) => {
    const id = Math.random().toString(36).substring(2, 11)
    const newItem: IQueueItem = {
      id,
      name,
      status: 'pending',
      progress: 0,
      handler,
    }
    itemsRef.current = [...itemsRef.current, newItem]
    setItems(itemsRef.current)
    return id
  }, [])

  const cancelTask = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((i) => i.id === id)
      if (item?.status === 'in_progress' && item.abortController) {
        item.abortController.abort()
      } else if (item?.status === 'pending') {
        updateItem(id, { status: 'cancelled' })
      }
    },
    [updateItem]
  )

  const retryTask = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((i) => i.id === id)
      if (item && (item.status === 'failed' || item.status === 'cancelled')) {
        updateItem(id, {
          status: 'pending',
          progress: 0,
          error: undefined,
          result: undefined,
        })
      }
    },
    [updateItem]
  )

  const removeTask = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((i) => i.id === id)
      if (item?.status === 'in_progress') {
        cancelTask(id)
      }
      itemsRef.current = itemsRef.current.filter((i) => i.id !== id)
      setItems(itemsRef.current)
    },
    [cancelTask]
  )

  const clear = useCallback(() => {
    itemsRef.current.forEach((item) => {
      if (item.status === 'in_progress' && item.abortController) {
        item.abortController.abort()
      }
    })
    itemsRef.current = []
    setItems([])
  }, [])

  const clearCompleted = useCallback(() => {
    itemsRef.current = itemsRef.current.filter(
      (item) => item.status !== 'completed' && item.status !== 'cancelled'
    )
    setItems(itemsRef.current)
  }, [])

  return (
    <QueueContext.Provider
      value={{
        items,
        stats,
        addTask,
        cancelTask,
        retryTask,
        removeTask,
        clear,
        clearCompleted,
      }}
    >
      {children}
    </QueueContext.Provider>
  )
}
