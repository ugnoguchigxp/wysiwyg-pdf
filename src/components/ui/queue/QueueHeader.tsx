import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useQueue } from '@/modules/queue/hooks';
import { AlertCircle, CheckCheck, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';
import type React from 'react';

interface IQueueHeaderProps {
    expanded: boolean;
    onToggle: () => void;
    onClose: () => void;
}

export const QueueHeader: React.FC<IQueueHeaderProps> = ({ expanded, onToggle, onClose }) => {
    const { stats, items, clearCompleted } = useQueue();

    const handleToggleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggle();
        }
    };

    // Determine status and color
    const isRunning = stats.inProgress > 0;
    const hasFailed = stats.failed > 0;
    const isAllCompleted = stats.total > 0 && stats.completed === stats.total;

    let bgColor = 'bg-background';
    let textColor = 'text-foreground';
    let borderColor = 'border-border';

    if (!expanded) {
        if (isRunning) {
            bgColor = 'bg-blue-50 dark:bg-blue-900/20';
            textColor = 'text-blue-600 dark:text-blue-400';
            borderColor = 'border-blue-200 dark:border-blue-800';
        } else if (hasFailed) {
            bgColor = 'bg-red-50 dark:bg-red-900/20';
            textColor = 'text-red-600 dark:text-red-400';
            borderColor = 'border-red-200 dark:border-red-800';
        } else if (isAllCompleted) {
            bgColor = 'bg-green-50 dark:bg-green-900/20';
            textColor = 'text-green-600 dark:text-green-400';
            borderColor = 'border-green-200 dark:border-green-800';
        }
    }

    // Find current running task name
    const currentTask = items.find((item) => item.status === 'in_progress');

    return (
        <div
            className={cn(
                'flex items-center justify-between gap-2 border-b p-3 transition-colors duration-300',
                bgColor,
                borderColor
            )}
        >
            <div
                className={cn(
                    'flex flex-1 items-center gap-2 text-sm font-semibold cursor-pointer',
                    textColor
                )}
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onClick={onToggle}
                onKeyDown={handleToggleKeyDown}
            >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}

                <div className="flex items-center gap-2">
                    {!expanded && isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
                    {!expanded && hasFailed && !isRunning && <AlertCircle className="h-4 w-4" />}
                    {!expanded && isAllCompleted && <CheckCheck className="h-4 w-4" />}

                    <span className="truncate max-w-[200px]">
                        {!expanded && currentTask
                            ? currentTask.name
                            : !expanded && hasFailed
                                ? 'Task Failed'
                                : !expanded && isAllCompleted
                                    ? 'All Completed'
                                    : 'Tasks'}
                    </span>

                    {expanded && (
                        <span className="text-xs font-normal opacity-70">
                            ({stats.completed} / {stats.total})
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1">
                {expanded ? (
                    <>
                        {stats.completed > 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={clearCompleted}
                                title="Clear Completed"
                                className="h-8 w-8"
                            >
                                <CheckCheck className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            title="Close"
                            className="h-8 w-8"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className={cn('h-8 w-8 hover:bg-muted', textColor)}
                        title="Close"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};
