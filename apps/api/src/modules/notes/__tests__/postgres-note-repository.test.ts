import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { UserId } from '@rhitta/contracts/auth'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { sql } from 'drizzle-orm'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { Note } from '../domain/note.js'
import { PostgresNoteRepository } from '../infra/postgres-note-repository.js'

/**
 * Integration test for `PostgresNoteRepository` against an ephemeral
 * Postgres via Testcontainers.
 *
 * The repository accepts a `NodePgDatabase` via constructor (rather than
 * importing from `lib/db.ts`), so the test can wire it to the container
 * without dragging in Encore's `SQLDatabase`. The shared migrations
 * folder at `apps/api/drizzle/` is applied via Drizzle's
 * `node-postgres/migrator`.
 *
 * The suite is `describe.skipIf`'d on Docker availability so the test
 * surface remains green on environments without Docker, while still
 * exercising the real adapter wherever Docker is present (CI, local
 * dev). It is NOT silently skipped — the skip reason is visible in test
 * output.
 */
function isDockerAvailable(): boolean {
  try {
    execSync('docker version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const dockerAvailable = isDockerAvailable()
if (!dockerAvailable) {
  console.warn('[postgres-note-repository.test] Docker not available — skipping suite')
}

describe.skipIf(!dockerAvailable)('PostgresNoteRepository', () => {
  let container: StartedPostgreSqlContainer
  let pool: Pool
  let testOrm: NodePgDatabase
  let repo: PostgresNoteRepository

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()
    pool = new Pool({ connectionString: container.getConnectionUri() })
    testOrm = drizzle(pool)
    const here = path.dirname(fileURLToPath(import.meta.url))
    const migrationsFolder = path.resolve(here, '../../../../drizzle')
    await migrate(testOrm, { migrationsFolder })
    repo = new PostgresNoteRepository(testOrm)
  }, 120_000)

  afterAll(async () => {
    await pool?.end()
    await container?.stop()
  })

  beforeEach(async () => {
    await testOrm.execute(sql`TRUNCATE TABLE notes CASCADE`)
  })

  function makeAuthor(): UserId {
    return randomUUID() as UserId
  }

  test('save + findById round trip', async () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'Hello', body: 'world' })
    await repo.save(note)

    const found = await repo.findById(note.id)
    expect(found).not.toBeNull()
    expect(found?.id).toBe(note.id)
    expect(found?.title).toBe('Hello')
    expect(found?.body).toBe('world')
    expect(found?.authorId).toBe(note.authorId)
    expect(found?.deletedAt).toBeNull()
    expect(found?.createdAt.getTime()).toBe(note.createdAt.getTime())
    expect(found?.updatedAt.getTime()).toBe(note.updatedAt.getTime())
  })

  test('findById returns null when not found', async () => {
    const found = await repo.findById(randomUUID() as never)
    expect(found).toBeNull()
  })

  test('save is idempotent and applies updates via upsert', async () => {
    const note = Note.create({ authorId: makeAuthor(), title: 'Original', body: 'first' })
    await repo.save(note)

    note.update({ title: 'Updated', body: 'second' })
    await repo.save(note)

    const found = await repo.findById(note.id)
    expect(found?.title).toBe('Updated')
    expect(found?.body).toBe('second')
    expect(found?.updatedAt.getTime()).toBe(note.updatedAt.getTime())
  })

  test('list returns only notes for the requesting author', async () => {
    const alice = makeAuthor()
    const bob = makeAuthor()
    await repo.save(Note.create({ authorId: alice, title: 'A1', body: '' }))
    await repo.save(Note.create({ authorId: alice, title: 'A2', body: '' }))
    await repo.save(Note.create({ authorId: bob, title: 'B1', body: '' }))

    const result = await repo.list({
      authorId: alice,
      limit: 10,
      includeDeleted: false,
    })

    expect(result.items).toHaveLength(2)
    expect(result.items.every((n) => n.authorId === alice)).toBe(true)
    expect(result.nextCursor).toBeNull()
  })

  test('list excludes deleted notes by default', async () => {
    const author = makeAuthor()
    const live = Note.create({ authorId: author, title: 'Live', body: '' })
    const trashed = Note.create({ authorId: author, title: 'Trashed', body: '' })
    trashed.softDelete()
    await repo.save(live)
    await repo.save(trashed)

    const result = await repo.list({ authorId: author, limit: 10, includeDeleted: false })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.title).toBe('Live')
    expect(result.items[0]?.deletedAt).toBeNull()
  })

  test('list includes deleted notes when includeDeleted is true', async () => {
    const author = makeAuthor()
    const live = Note.create({ authorId: author, title: 'Live', body: '' })
    const trashed = Note.create({ authorId: author, title: 'Trashed', body: '' })
    trashed.softDelete()
    await repo.save(live)
    await repo.save(trashed)

    const result = await repo.list({ authorId: author, limit: 10, includeDeleted: true })

    expect(result.items).toHaveLength(2)
    expect(result.items.some((n) => n.isDeleted)).toBe(true)
  })

  test('list orders by createdAt DESC', async () => {
    const author = makeAuthor()
    // Force distinct createdAt values by saving via Note.fromPersistence with
    // controlled timestamps — Note.create uses Date.now() which is too fast.
    const t0 = new Date('2024-01-01T00:00:00.000Z')
    const t1 = new Date('2024-01-02T00:00:00.000Z')
    const t2 = new Date('2024-01-03T00:00:00.000Z')

    const noteAt = (createdAt: Date, title: string) =>
      Note.fromPersistence({
        id: randomUUID() as never,
        authorId: author,
        title,
        body: '',
        createdAt,
        updatedAt: createdAt,
        deletedAt: null,
      })

    await repo.save(noteAt(t0, 'oldest'))
    await repo.save(noteAt(t1, 'middle'))
    await repo.save(noteAt(t2, 'newest'))

    const result = await repo.list({ authorId: author, limit: 10, includeDeleted: false })

    expect(result.items.map((n) => n.title)).toEqual(['newest', 'middle', 'oldest'])
  })

  test('list paginates with cursor', async () => {
    const author = makeAuthor()
    const timestamps = Array.from(
      { length: 5 },
      (_, i) => new Date(`2024-01-0${i + 1}T00:00:00.000Z`)
    )
    for (const [i, createdAt] of timestamps.entries()) {
      await repo.save(
        Note.fromPersistence({
          id: randomUUID() as never,
          authorId: author,
          title: `note-${i}`,
          body: '',
          createdAt,
          updatedAt: createdAt,
          deletedAt: null,
        })
      )
    }

    const page1 = await repo.list({ authorId: author, limit: 2, includeDeleted: false })
    expect(page1.items.map((n) => n.title)).toEqual(['note-4', 'note-3'])
    expect(page1.nextCursor).not.toBeNull()

    const page2 = await repo.list({
      authorId: author,
      limit: 2,
      includeDeleted: false,
      cursor: page1.nextCursor ?? undefined,
    })
    expect(page2.items.map((n) => n.title)).toEqual(['note-2', 'note-1'])
    expect(page2.nextCursor).not.toBeNull()

    const page3 = await repo.list({
      authorId: author,
      limit: 2,
      includeDeleted: false,
      cursor: page2.nextCursor ?? undefined,
    })
    expect(page3.items.map((n) => n.title)).toEqual(['note-0'])
    expect(page3.nextCursor).toBeNull()
  })
})
