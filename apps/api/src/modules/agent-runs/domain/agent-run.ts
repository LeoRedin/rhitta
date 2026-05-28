import { randomUUID } from 'node:crypto'
import type { AgentRunId, AgentRunRequest, AgentRunResponse } from '@rhitta/contracts/agent-runs'
import type { UserId } from '@rhitta/contracts/auth'

/**
 * Domain entity for an agent run (per ADR-0013).
 *
 * Unlike `Note`, an `AgentRun` is immutable after construction — it
 * records a single synchronous call to an LLM along with its inputs and
 * usage. There are no mutators, no soft-delete, no repository in v0.
 *
 * The constructor is private; use {@link AgentRun.fromCompletion} to
 * build one from a provider's completion result. The id and `createdAt`
 * are generated internally.
 */
export class AgentRun {
  private constructor(
    public readonly id: AgentRunId,
    public readonly userId: UserId,
    public readonly request: AgentRunRequest,
    public readonly output: string,
    public readonly inputTokens: number,
    public readonly outputTokens: number,
    public readonly createdAt: Date
  ) {}

  static fromCompletion(input: {
    userId: UserId
    request: AgentRunRequest
    output: string
    inputTokens: number
    outputTokens: number
  }): AgentRun {
    return new AgentRun(
      randomUUID() as AgentRunId,
      input.userId,
      input.request,
      input.output,
      input.inputTokens,
      input.outputTokens,
      new Date()
    )
  }

  /**
   * Project the entity into the wire-shape `AgentRunResponse` DTO from
   * `@rhitta/contracts/agent-runs`. This is the domain → wire boundary;
   * the HTTP layer calls this rather than reading the fields directly.
   */
  toDTO(): AgentRunResponse {
    return {
      id: this.id,
      userId: this.userId,
      request: this.request,
      output: this.output,
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      createdAt: this.createdAt,
    }
  }
}
