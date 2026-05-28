import { z } from 'zod'
import { brand } from '../shared/ids.js'

export const UserIdSchema = brand(z.string().uuid(), 'UserId')
export type UserId = z.infer<typeof UserIdSchema>

// Public view of a user (no PII beyond what's safe to expose)
export const UserSchema = z.object({
  id: UserIdSchema,
  email: z.string().email(),
  emailVerified: z.boolean(),
  name: z.string().nullable(),
  createdAt: z.date(),
})
export type User = z.infer<typeof UserSchema>
