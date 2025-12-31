import { writeFile, unlink, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { StorageService } from './types';

export class LocalStorage implements StorageService {
    private uploadDir: string;
    private baseUrl: string;

    constructor(uploadDir: string = 'public/uploads', baseUrl: string) {
        this.uploadDir = uploadDir;
        this.baseUrl = baseUrl;
    }

    async upload(file: File, name: string): Promise<string> {
        const bytes = await file.arrayBuffer();
        const path = join(this.uploadDir, name);
        await writeFile(path, Buffer.from(bytes));
        // For local dev, we assume the server serves uploadDir at this path
        return `${this.baseUrl}/${this.uploadDir}/${name}`;
    }

    async delete(name: string): Promise<void> {
        try {
            const path = join(this.uploadDir, name);
            await unlink(path);
        } catch (e) {
            console.error(`Failed to delete local file: ${name}`, e);
        }
    }

    async list(): Promise<string[]> {
        try {
            // filters only files
            const files = await readdir(this.uploadDir);
            return files.filter(f => !f.startsWith('.'));
        } catch {
            return [];
        }
    }
}
