import { z } from 'zod'
import { brand } from '../shared/ids.js'
import { UserIdSchema } from './user.js'

export const SessionIdSchema = brand(z.string(), 'SessionId')
export type SessionId = z.infer<typeof SessionIdSchema>

export const SessionSchema = z.object({
  id: SessionIdSchema,
  userId: UserIdSchema,
  expiresAt: z.date(),
  createdAt: z.date(),
})
export type Session = z.infer<typeof SessionSchema>
