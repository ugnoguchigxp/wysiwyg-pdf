import type { D1Database, type R2Bucket, type Fetcher, type ExecutionContext } from '@cloudflare/workers-types';

declare module 'cloudflare:test' {
    export const env: {
        DB: D1Database;
        BUCKET: R2Bucket;
        ASSETS: Fetcher;
    };
}
