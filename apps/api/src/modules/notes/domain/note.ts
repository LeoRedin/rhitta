import { randomUUID } from 'node:crypto'
import type { UserId } from '@rhitta/contracts/auth'
import type { Note as NoteDTO, NoteId } from '@rhitta/contracts/notes'
import { ConflictError, ValidationError } from '../../../lib/errors.js'

/**
 * Domain entity for a note (per ADR-0013 — shape #1 of three: domain class,
 * wire schema, persistence row). Invariants are enforced inside the class;
 * outside callers cannot construct a `Note` in an invalid state.
 *
 * The constructor is private — use `Note.create` for new entities (which
 * generates an ID and timestamps) or `Note.fromPersistence` when rehydrating
 * a trusted snapshot from storage (which skips re-validation).
 */
const TITLE_MIN = 1
const TITLE_MAX = 280
const BODY_MIN = 0
const BODY_MAX = 10_000

export class Note {
  private constructor(
    public readonly id: NoteId,
    public readonly authorId: UserId,
    private _title: string,
    private _body: string,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | null
  ) {}

  static create(input: { authorId: UserId; title: string; body: string }): Note {
    Note.validateTitle(input.title)
    Note.validateBody(input.body)
    const now = new Date()
    return new Note(randomUUID() as NoteId, input.authorId, input.title, input.body, now, now, null)
  }

  /**
   * Rehydrate a `Note` from a trusted persistence snapshot. Invariants are
   * NOT re-validated here — the DB is treated as a trusted source whose
   * contents were validated on the way in via `create`/`update`.
   */
  static fromPersistence(snapshot: NoteDTO): Note {
    return new Note(
      snapshot.id,
      snapshot.authorId,
      snapshot.title,
      snapshot.body,
      snapshot.createdAt,
      snapshot.updatedAt,
      snapshot.deletedAt
    )
  }

  get title(): string {
    return this._title
  }
  get body(): string {
    return this._body
  }
  get updatedAt(): Date {
    return this._updatedAt
  }
  get deletedAt(): Date | null {
    return this._deletedAt
  }
  get isDeleted(): boolean {
    return this._deletedAt !== null
  }

  update(changes: { title?: string; body?: string }): void {
    if (changes.title !== undefined) {
      Note.validateTitle(changes.title)
      this._title = changes.title
    }
    if (changes.body !== undefined) {
      Note.validateBody(changes.body)
      this._body = changes.body
    }
    this._updatedAt = new Date()
  }

  softDelete(): void {
    if (this._deletedAt !== null) {
      throw new ConflictError('Note already deleted')
    }
    const now = new Date()
    this._deletedAt = now
    this._updatedAt = now
  }

  /**
   * Project the entity into the wire-shape `Note` DTO from
   * `@rhitta/contracts/notes`. This is the domain → wire boundary; HTTP
   * handlers and persistence adapters call this rather than reading the
   * private fields directly.
   */
  toDTO(): NoteDTO {
    return {
      id: this.id,
      authorId: this.authorId,
      title: this._title,
      body: this._body,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    }
  }

  private static validateTitle(title: string): void {
    if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
      throw new ValidationError(`title must be ${TITLE_MIN}-${TITLE_MAX} chars`)
    }
  }

  private static validateBody(body: string): void {
    if (body.length < BODY_MIN || body.length > BODY_MAX) {
      throw new ValidationError(`body must be ${BODY_MIN}-${BODY_MAX} chars`)
    }
  }
}
