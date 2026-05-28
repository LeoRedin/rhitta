import { randomUUID } from 'node:crypto'
import type { EmailMessage, EmailSender } from '../lib/email-sender.js'

/**
 * Test-only `EmailSender`. Captures every send into `sent` so tests can
 * assert that the right message was emitted with the right shape. The
 * generated `id` is a uuid so equality assertions can pin the returned
 * id back to the captured entry.
 */
export class InMemoryEmailAdapter implements EmailSender {
  public readonly sent: Array<{ id: string; message: EmailMessage }> = []

  async send(message: EmailMessage): Promise<{ id: string }> {
    const id = randomUUID()
    this.sent.push({ id, message })
    return { id }
  }

  clear(): void {
    this.sent.length = 0
  }
}
