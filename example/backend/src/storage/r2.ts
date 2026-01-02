import type { R2Bucket } from '@cloudflare/workers-types'
import type { StorageService } from './types'

export class R2StorageService implements StorageService {
  private bucket: R2Bucket
  private publicUrl?: string

  constructor(bucket: R2Bucket, publicUrl?: string) {
    this.bucket = bucket
    this.publicUrl = publicUrl
  }

  async upload(file: File, name: string): Promise<string> {
    await this.bucket.put(name, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      },
    })

    if (this.publicUrl) {
      return `${this.publicUrl}/${name}`
    }
    // If no public URL is provided, we might serve via a worker route.
    // For this example, we'll return a relative path that the worker can intercept
    return `/public/uploads/${name}`
  }

  async delete(name: string): Promise<void> {
    await this.bucket.delete(name)
  }

  async list(): Promise<string[]> {
    const list = await this.bucket.list()
    return list.objects.map((o) => o.key)
  }
}
