import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useQueueItem } from '@/modules/queue/hooks';
import type { IQueueItem } from '@/modules/queue/Queue.schema';
import { AlertCircle, Check, Clock, Loader2, RefreshCw, X } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';

interface IQueueItemProps {
    item: IQueueItem;
}

export const QueueItem: React.FC<IQueueItemProps> = ({ item }) => {
    const { cancel, retry, remove } = useQueueItem(item.id);

    // Duration calculation
    const elapsed = useMemo(() => {
        if (!item.startedAt) return null;
        const end = item.completedAt || new Date();
        const seconds = Math.floor((end.getTime() - item.startedAt.getTime()) / 1000);
        return seconds;
    }, [item.startedAt, item.completedAt]);

    // Status icon + Color
    const statusDisplay = useMemo(() => {
        switch (item.status) {
            case 'pending':
                return {
                    icon: <Clock className="h-5 w-5 text-muted-foreground" />,
                    bgColor: 'bg-background',
                };
            case 'in_progress':
                return {
                    icon: <Loader2 className="h-5 w-5 animate-spin text-blue-500" />,
                    bgColor: 'bg-blue-50/50 dark:bg-blue-900/10',
                };
            case 'completed':
                return {
                    icon: <Check className="h-5 w-5 text-green-500" />,
                    bgColor: 'bg-green-50/50 dark:bg-green-900/10',
                };
            case 'failed':
                return {
                    icon: <AlertCircle className="h-5 w-5 text-red-500" />,
                    bgColor: 'bg-red-50/50 dark:bg-red-900/10',
                };
            case 'cancelled':
                return {
                    icon: <X className="h-5 w-5 text-muted-foreground" />,
                    bgColor: 'bg-background',
                };
            default:
                return {
                    icon: <Clock className="h-5 w-5 text-muted-foreground" />,
                    bgColor: 'bg-background',
                };
        }
    }, [item.status]);

    return (
        <div
            className={cn(
                'flex items-center gap-3 rounded-md border p-3 transition-colors',
                'border-border hover:bg-muted/50',
                statusDisplay.bgColor
            )}
        >
            {/* Status Icon */}
            <div className="flex-shrink-0">{statusDisplay.icon}</div>

            {/* Task Info */}
            <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{item.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                    {item.status === 'in_progress' && (
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${item.progress}%` }}
                            />
                        </div>
                    )}
                    {elapsed !== null && <div className="text-[10px] text-muted-foreground">{elapsed}s</div>}
                </div>
                {item.error && <div className="mt-1 text-xs text-red-500 line-clamp-2">{item.error}</div>}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {item.status === 'in_progress' && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={cancel}
                        title="Cancel"
                        className="h-7 w-7"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}

                {item.status === 'failed' && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={retry}
                        title="Retry"
                        className="h-7 w-7"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                )}

                {(item.status === 'completed' ||
                    item.status === 'failed' ||
                    item.status === 'cancelled') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={remove}
                            title="Remove"
                            className="h-7 w-7"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
            </div>
        </div>
    );
};
