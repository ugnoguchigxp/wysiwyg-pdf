export type QueueStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface IQueueItem {
    id: string;
    name: string;
    status: QueueStatus;
    progress: number;
    error?: string;
    result?: any;
    startedAt?: Date;
    completedAt?: Date;
    handler: (
        item: IQueueItem,
        onProgress: (progress: number) => void,
        signal: AbortSignal
    ) => Promise<any>;
    abortController?: AbortController;
}

export interface IQueueStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    cancelled: number;
}
