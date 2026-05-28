/**
 * Hexagonal port for sending transactional email. Use-cases depend on
 * this interface (not Resend's SDK) so they can be unit-tested with the
 * in-memory adapter in `adapters/in-memory-email-adapter.ts`. The
 * production implementation lives in `adapters/resend-email-adapter.ts`.
 *
 * Field naming intentionally mirrors Resend's public shape (`replyTo`,
 * `from`, `to`) so the adapter is a thin pass-through. Domain code that
 * needs richer email payloads (attachments, tags, templates) should add
 * fields here rather than reaching for the Resend SDK directly.
 */
export type EmailMessage = {
  to: string | string[]
  from: string
  subject: string
  text?: string
  html?: string
  replyTo?: string
}

export interface EmailSender {
  send(message: EmailMessage): Promise<{ id: string }>
}
