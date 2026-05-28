import { z } from 'zod'
import { UserIdSchema } from '../auth/user.js'
import { brand } from '../shared/ids.js'

export const NoteIdSchema = brand(z.string().uuid(), 'NoteId')
export type NoteId = z.infer<typeof NoteIdSchema>

// Full Note (wire shape returned by API)
export const NoteSchema = z.object({
  id: NoteIdSchema,
  authorId: UserIdSchema,
  title: z.string().min(1).max(280),
  body: z.string().min(0).max(10_000),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable(),
})
export type Note = z.infer<typeof NoteSchema>

// Create input
export const CreateNoteSchema = z.object({
  title: z.string().min(1).max(280),
  body: z.string().min(0).max(10_000),
})
export type CreateNote = z.infer<typeof CreateNoteSchema>

// Update input
export const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(280).optional(),
  body: z.string().min(0).max(10_000).optional(),
})
export type UpdateNote = z.infer<typeof UpdateNoteSchema>

// List query
export const ListNotesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  includeDeleted: z.boolean().default(false),
})
export type ListNotesQuery = z.infer<typeof ListNotesQuerySchema>
