import type { AgentRunRequest } from '@rhitta/contracts/agent-runs'

/**
 * Hexagonal port (per ADR-0002) the agent-runs use-case depends on to
 * actually call an LLM. The real implementation lives in
 * `infra/anthropic-agent-adapter.ts`; tests use
 * `infra/in-memory-agent-adapter.ts`.
 *
 * Streaming is intentionally out of scope for v0 — the use-case runs
 * synchronously, returning a single completed response. A `stream(...)`
 * variant can be added later without breaking this surface.
 */
export type AgentCompletion = {
  output: string
  inputTokens: number
  outputTokens: number
}

export interface AgentProvider {
  /** Run an agent synchronously and return the completed output. */
  complete(request: AgentRunRequest): Promise<AgentCompletion>
}
