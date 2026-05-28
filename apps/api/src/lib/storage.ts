/**
 * Hexagonal port for blob storage. The production adapter is
 * `adapters/s3-storage-adapter.ts`, configured against Cloudflare R2
 * (S3-compatible) — but any S3-API-compatible backend works. Tests use
 * `adapters/in-memory-storage-adapter.ts`.
 *
 * The contract is deliberately small: put / get / delete / list, plus a
 * presigned URL escape hatch for clients that need to download an object
 * directly without proxying bytes through the API.
 */
export type StoredObject = {
  key: string
  size: number
  contentType: string | null
  etag: string | null
  lastModified: Date
}

export type PutObjectInput = {
  key: string
  body: Buffer | Uint8Array
  contentType?: string
  metadata?: Record<string, string>
}

export interface StoragePort {
  putObject(input: PutObjectInput): Promise<{ etag: string }>
  getObject(
    key: string
  ): Promise<{ body: Buffer; contentType: string | null; metadata: Record<string, string> } | null>
  deleteObject(key: string): Promise<void>
  listObjects(prefix?: string): Promise<StoredObject[]>
  /** Returns a presigned URL valid for the requested TTL (seconds). */
  presignGet(key: string, ttlSeconds: number): Promise<string>
}
