import { z } from 'zod'

export const OkResultSchema = <T extends z.ZodTypeAny>(value: T) =>
  z.object({ ok: z.literal(true), value })

export const ErrResultSchema = z.object({
  ok: z.literal(false),
  code: z.string(),
  message: z.string(),
})
export type ErrResult = z.infer<typeof ErrResultSchema>

export const ResultSchema = <T extends z.ZodTypeAny>(value: T) =>
  z.discriminatedUnion('ok', [OkResultSchema(value), ErrResultSchema])
