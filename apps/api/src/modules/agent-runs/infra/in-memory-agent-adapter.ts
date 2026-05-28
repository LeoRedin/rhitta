import type { AgentRunRequest } from '@rhitta/contracts/agent-runs'
import type { AgentCompletion, AgentProvider } from '../application/agent-provider.js'

/**
 * Test double for {@link AgentProvider}. Records every call and returns
 * a configurable canned response — `setResponse(...)` swaps the response
 * for the next (and subsequent) `complete(...)` call.
 *
 * Also used as the module-default in production module loading: the
 * real `AnthropicAgentAdapter` requires `ANTHROPIC_API_KEY` at
 * construction time, which we don't want to read during module load.
 * `composeRoot` (Task 10) swaps this for the Anthropic adapter.
 */
export class InMemoryAgentAdapter implements AgentProvider {
  public readonly calls: AgentRunRequest[] = []
  private response: AgentCompletion = {
    output: 'placeholder',
    inputTokens: 0,
    outputTokens: 0,
  }

  async complete(request: AgentRunRequest): Promise<AgentCompletion> {
    this.calls.push(request)
    return this.response
  }

  /** Test helper: set the response for the next call. */
  setResponse(response: AgentCompletion): void {
    this.response = response
  }
}
