import { z } from 'zod'

export const NoteCreatedEventSchema = z.object({
  noteId: z.string(),
  authorId: z.string(),
  occurredAt: z.date(),
})
export type NoteCreatedEvent = z.infer<typeof NoteCreatedEventSchema>
