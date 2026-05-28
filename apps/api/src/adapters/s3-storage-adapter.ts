import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { DependencyFailureError } from '../lib/errors.js'
import type { PutObjectInput, StoragePort, StoredObject } from '../lib/storage.js'

/**
 * Connection settings for an S3-compatible backend. Pinned defaults
 * target Cloudflare R2 (`region: 'auto'`, `forcePathStyle: true`) but
 * the same adapter works against AWS S3, MinIO, etc.
 */
export type S3StorageConfig = {
  endpoint: string // R2: https://<account>.r2.cloudflarestorage.com
  region: string // R2: 'auto'
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  forcePathStyle?: boolean
}

/**
 * Production `StoragePort` backed by the AWS S3 v3 SDK. Configured per
 * R2's quirks by default (`forcePathStyle: true`) but works against any
 * S3-compatible backend. All transport errors are wrapped in
 * `DependencyFailureError` so the edge can render a uniform 502; the
 * single exception is `NoSuchKey` from `getObject`, which is normalised
 * to a `null` return (a missing object is a domain-meaningful answer,
 * not a failure).
 */
export class S3StorageAdapter implements StoragePort {
  private readonly client: S3Client
  private readonly bucket: string

  constructor(config: S3StorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? true,
    })
    this.bucket = config.bucket
  }

  async putObject(input: PutObjectInput): Promise<{ etag: string }> {
    try {
      const result = await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
          Metadata: input.metadata,
        })
      )
      return { etag: result.ETag ?? '' }
    } catch (err) {
      throw new DependencyFailureError('s3', 'putObject failed', err)
    }
  }

  async getObject(key: string): Promise<{
    body: Buffer
    contentType: string | null
    metadata: Record<string, string>
  } | null> {
    try {
      const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
      const body = await this.streamToBuffer(result.Body)
      return {
        body,
        contentType: result.ContentType ?? null,
        metadata: result.Metadata ?? {},
      }
    } catch (err) {
      const error = err as { name?: string }
      if (error.name === 'NoSuchKey') return null
      throw new DependencyFailureError('s3', 'getObject failed', err)
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
    } catch (err) {
      throw new DependencyFailureError('s3', 'deleteObject failed', err)
    }
  }

  async listObjects(prefix?: string): Promise<StoredObject[]> {
    try {
      const result = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix })
      )
      return (result.Contents ?? []).map(
        (obj): StoredObject => ({
          key: obj.Key ?? '',
          size: obj.Size ?? 0,
          contentType: null, // ListObjectsV2 doesn't return this
          etag: obj.ETag ?? null,
          lastModified: obj.LastModified ?? new Date(0),
        })
      )
    } catch (err) {
      throw new DependencyFailureError('s3', 'listObjects failed', err)
    }
  }

  async presignGet(key: string, ttlSeconds: number): Promise<string> {
    try {
      return await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: ttlSeconds }
      )
    } catch (err) {
      throw new DependencyFailureError('s3', 'presignGet failed', err)
    }
  }

  /**
   * AWS SDK v3 returns `result.Body` as a `StreamingBlobPayloadOutputTypes`
   * union (Readable in Node, Blob/ReadableStream in the browser). In
   * Node it's an async-iterable `Readable`, so collect chunks via
   * `for await`. This avoids depending on the Node-only `Readable.toArray`
   * helper.
   */
  private async streamToBuffer(stream: unknown): Promise<Buffer> {
    const reader = stream as AsyncIterable<Uint8Array>
    const chunks: Buffer[] = []
    for await (const chunk of reader) {
      chunks.push(Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }
}
