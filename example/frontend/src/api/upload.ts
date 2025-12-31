export interface UploadResponse {
    id: string;
    url: string;
    name: string;
}

export const uploadFile = async (file: File, signal?: AbortSignal): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: formData,
        signal,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
    }

    return response.json();
};
