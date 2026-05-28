import Anthropic from '@anthropic-ai/sdk'
import type { AgentRunRequest } from '@rhitta/contracts/agent-runs'
import { DependencyFailureError } from '../../../lib/errors.js'
import type { AgentCompletion, AgentProvider } from '../application/agent-provider.js'

/**
 * Anthropic-backed implementation of {@link AgentProvider}. Wraps the
 * official `@anthropic-ai/sdk` client (pinned at 0.99.0) and translates
 * its response into the small `AgentCompletion` DTO our use-case wants.
 *
 * In v0 we only support text completions: tool use, thinking blocks,
 * and other block kinds are ignored. The output is the concatenation of
 * every `text` block in the response — good enough for the reference
 * `POST /agent-runs` endpoint.
 *
 * Any SDK error is collapsed to {@link DependencyFailureError} so the
 * error mapper can return a 503 without leaking SDK internals to the
 * client.
 */
export class AnthropicAgentAdapter implements AgentProvider {
  private readonly client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async complete(request: AgentRunRequest): Promise<AgentCompletion> {
    try {
      const response = await this.client.messages.create({
        model: request.model,
        max_tokens: request.maxTokens,
        ...(request.systemPrompt !== undefined && { system: request.systemPrompt }),
        messages: [{ role: 'user', content: request.prompt }],
      })

      // Concatenate text blocks; ignore tool_use / thinking / etc. for v0.
      const output = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('')

      return {
        output,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      }
    } catch (err) {
      throw new DependencyFailureError('anthropic', 'completion failed', err)
    }
  }
}
