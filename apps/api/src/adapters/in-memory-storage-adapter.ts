import { createHash, randomUUID } from 'node:crypto'
import type { PutObjectInput, StoragePort, StoredObject } from '../lib/storage.js'

type StoredEntry = {
  body: Buffer
  contentType: string | null
  metadata: Record<string, string>
  etag: string
  lastModified: Date
}

/**
 * Test-only `StoragePort`. Keeps every object in a `Map` keyed by the
 * object key, so put/get/delete/list behave like a tiny in-process S3.
 * `presignGet` returns a fake `memory://presigned/<token>` URL and
 * records the token-to-key mapping in `presignedTokens` so tests can
 * verify which key was signed without parsing URLs.
 */
export class InMemoryStorageAdapter implements StoragePort {
  private readonly objects = new Map<string, StoredEntry>()
  /** Token-to-key mapping for tests that need to assert what was presigned. */
  public readonly presignedTokens = new Map<string, string>()

  async putObject(input: PutObjectInput): Promise<{ etag: string }> {
    const body = Buffer.from(input.body)
    const etag = createHash('md5').update(body).digest('hex')
    this.objects.set(input.key, {
      body,
      contentType: input.contentType ?? null,
      metadata: input.metadata ?? {},
      etag,
      lastModified: new Date(),
    })
    return { etag }
  }

  async getObject(key: string): Promise<{
    body: Buffer
    contentType: string | null
    metadata: Record<string, string>
  } | null> {
    const entry = this.objects.get(key)
    if (!entry) return null
    return {
      body: entry.body,
      contentType: entry.contentType,
      metadata: entry.metadata,
    }
  }

  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key)
  }

  async listObjects(prefix?: string): Promise<StoredObject[]> {
    return Array.from(this.objects.entries())
      .filter(([key]) => !prefix || key.startsWith(prefix))
      .map(
        ([key, entry]): StoredObject => ({
          key,
          size: entry.body.length,
          contentType: entry.contentType,
          etag: entry.etag,
          lastModified: entry.lastModified,
        })
      )
  }

  async presignGet(key: string, _ttlSeconds: number): Promise<string> {
    const token = randomUUID()
    this.presignedTokens.set(token, key)
    return `memory://presigned/${token}`
  }

  clear(): void {
    this.objects.clear()
    this.presignedTokens.clear()
  }
}
