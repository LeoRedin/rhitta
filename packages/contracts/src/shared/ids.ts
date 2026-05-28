import type { z } from 'zod'

/**
 * Helper for branding Zod schemas with a nominal type tag.
 *
 * Concrete branded IDs land here as domains accumulate, e.g.:
 *   export const UserIdSchema = brand(z.string().uuid(), 'UserId')
 *   export type UserId = z.infer<typeof UserIdSchema>
 */
export const brand = <Schema extends z.ZodTypeAny, Brand extends string>(
  schema: Schema,
  _brandName: Brand
) => schema.brand<Brand>()
