import { type CreateEmailOptions, Resend } from 'resend'
import type { EmailMessage, EmailSender } from '../lib/email-sender.js'
import { DependencyFailureError, ValidationError } from '../lib/errors.js'

/**
 * Production `EmailSender` backed by the Resend HTTP API. Translates
 * Resend's `{ data, error }` response into a thrown
 * `DependencyFailureError` so the central error mapper (see
 * `lib/error-mapper.ts`) can produce a uniform 502 at the HTTP edge.
 *
 * The Resend SDK is constructed in the ctor — no module-load env reads,
 * so this class is safe to unit-test by injecting a stub `Resend` if
 * future tests want to.
 */
export class ResendEmailAdapter implements EmailSender {
  private readonly client: Resend

  constructor(apiKey: string) {
    this.client = new Resend(apiKey)
  }

  async send(message: EmailMessage): Promise<{ id: string }> {
    // Resend's `CreateEmailOptions` is a discriminated union that
    // requires at least one of `text`/`html`/`react`. We enforce that
    // contract here (the SDK would 422 anyway) and build the payload
    // without `undefined` keys so TypeScript narrows to the renderable
    // branch.
    if (!message.text && !message.html) {
      throw new ValidationError('email message requires `text` or `html`')
    }

    const payload: CreateEmailOptions = {
      from: message.from,
      to: message.to,
      subject: message.subject,
      ...(message.text !== undefined ? { text: message.text } : {}),
      ...(message.html !== undefined ? { html: message.html } : {}),
      ...(message.replyTo !== undefined ? { replyTo: message.replyTo } : {}),
    } as CreateEmailOptions

    const result = await this.client.emails.send(payload)

    if (result.error) {
      throw new DependencyFailureError('resend', result.error.message, result.error)
    }
    if (!result.data?.id) {
      throw new DependencyFailureError('resend', 'no id returned')
    }
    return { id: result.data.id }
  }
}
