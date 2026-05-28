import type { AgentRunRequest } from '@rhitta/contracts/agent-runs'
import type { UserId } from '@rhitta/contracts/auth'
import { AgentRun } from '../domain/agent-run.js'
import type { AgentProvider } from './agent-provider.js'

/**
 * Run an LLM completion on behalf of `userId`, wrap the result in an
 * `AgentRun` entity, and hand it back to the caller. No persistence in
 * v0 — the HTTP layer serializes the entity straight out.
 */
export class RunAgentUseCase {
  constructor(private readonly provider: AgentProvider) {}

  async execute(input: AgentRunRequest & { userId: UserId }): Promise<AgentRun> {
    const { userId, ...request } = input
    const completion = await this.provider.complete(request)
    return AgentRun.fromCompletion({
      userId,
      request,
      output: completion.output,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
    })
  }
}
