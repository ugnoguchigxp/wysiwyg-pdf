import { useContext } from 'react';
import { QueueContext } from './QueueContext';

export const useQueue = () => {
    const context = useContext(QueueContext);
    if (!context) {
        throw new Error('useQueue must be used within a QueueProvider');
    }
    return context;
};

export const useQueueItem = (id: string) => {
    const { items, cancelTask, retryTask, removeTask } = useQueue();
    const item = items.find((i) => i.id === id);

    return {
        item,
        cancel: () => cancelTask(id),
        retry: () => retryTask(id),
        remove: () => removeTask(id),
    };
};
