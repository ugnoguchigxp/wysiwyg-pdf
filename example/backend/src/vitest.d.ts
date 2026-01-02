/// <reference types="vitest/globals" />
/// <reference types="@cloudflare/workers-types" />

declare module 'cloudflare/test' {
  export const env: {
    DB: D1Database
    BUCKET: R2Bucket
    ASSETS: Fetcher
  }
}
