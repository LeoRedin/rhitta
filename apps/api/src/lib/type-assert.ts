/**
 * Compile-time structural-equality assertions.
 *
 * Used to assert that the concrete `*HttpRequest`/`*HttpResponse`
 * interfaces declared in `modules/<m>/http/*.ts` stay structurally
 * identical to the corresponding Zod-inferred contract shapes from
 * `@rhitta/contracts`.
 *
 * ## Why
 * Encore.ts 1.57.5's static analyzer can't resolve `z.infer<typeof
 * Schema>` type aliases in endpoint signatures (see ADR-0017 addendum),
 * so handlers declare concrete interfaces and call `Schema.parse(req)`
 * inside the body. The runtime parse catches drift at request time;
 * these compile-time guards catch the same drift at `pnpm typecheck`,
 * long before any wire request.
 *
 * ## Usage
 * ```ts
 * import type { z } from 'zod'
 * import type { Assert, Equals } from '../../../lib/type-assert.js'
 *
 * // biome-ignore lint/correctness/noUnusedVariables: compile-time assertion only
 * type _CreateNoteHttpRequestMatches = Assert<
 *   Equals<CreateNoteHttpRequest, z.input<typeof CreateNoteSchema>>
 * >
 * ```
 *
 * When the contract schema and HTTP interface drift, `Equals<...>`
 * resolves to `false`, which fails `Assert<T extends true>`'s constraint
 * — TypeScript reports `TS2344: Type 'false' does not satisfy the
 * constraint 'true'`.
 *
 * Phase 3's code generator will emit these interfaces directly from the
 * Zod schemas, at which point this assertion becomes redundant. Until
 * then, this is the cheapest possible drift guard.
 */

/**
 * Strict bidirectional structural-equality check.
 *
 * The double-conditional `(<T>() => T extends A ? 1 : 2) extends <T>()
 * => T extends B ? 1 : 2` trick is the only way to get TypeScript to
 * compare two types invariantly — a plain `A extends B ? B extends A`
 * is bivariant and gives false positives on optional vs required
 * fields.
 */
export type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

/**
 * Forces its type argument to be exactly `true`. Used together with
 * `Equals<A, B>` to make a structural mismatch a typecheck error.
 */
export type Assert<T extends true> = T

/**
 * Flattens an object type to its canonical form by re-mapping its keys.
 *
 * Without this, `{ a: 1 } & { b: 2 }` is not `Equals<>` to `{ a: 1; b: 2 }`
 * even though they're structurally identical — `Equals<>` checks type
 * identity, and an intersection has a different identity than a flat
 * object literal. Wrapping both sides in `Flatten<>` collapses
 * intersections so the comparison is on the canonical shape only.
 */
export type Flatten<T> = T extends infer U ? { [K in keyof U]: U[K] } : never
