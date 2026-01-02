import type { D1Database, Fetcher, R2Bucket } from '@cloudflare/workers-types'

export type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  ASSETS: Fetcher
  DB_TYPE?: 'local' | 'd1'
  STORAGE_TYPE?: 'local' | 'r2'
}
