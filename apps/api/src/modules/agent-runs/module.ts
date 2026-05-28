/**
 * Agent-runs module composition root (per ADR-0003).
 *
 * Mirrors the shape of `notesModule()` from `modules/notes/module.ts`:
 * `registerAgentRunsModule(deps)` builds the use-case graph from
 * explicit deps; `agentRunsModule()` is the lazy production singleton
 * the HTTP layer reaches for.
 *
 * The default provider is the safe-by-default {@link InMemoryAgentAdapter}
 * because the real `AnthropicAgentAdapter` requires `ANTHROPIC_API_KEY`
 * at construction — which we don't want to read at module-load time.
 * `composeRoot` (Task 10) swaps in the Anthropic adapter once env is
 * loaded.
 *
 * Tests build their own module instance via `registerAgentRunsModule({
 * provider: ... })`, or use {@link setAgentRunsModule} when exercising
 * the HTTP handler through the singleton.
 */
import type { AgentProvider } from './application/agent-provider.js'
import { RunAgentUseCase } from './application/run-agent.js'
import { InMemoryAgentAdapter } from './infra/in-memory-agent-adapter.js'

export type AgentRunsDeps = {
  /** Optional provider override. Defaults to {@link InMemoryAgentAdapter}. */
  provider?: AgentProvider
}

export type AgentRunsModule = {
  provider: AgentProvider
  useCases: {
    runAgent: RunAgentUseCase
  }
}

export function registerAgentRunsModule(deps: AgentRunsDeps = {}): AgentRunsModule {
  const provider = deps.provider ?? new InMemoryAgentAdapter()
  return {
    provider,
    useCases: {
      runAgent: new RunAgentUseCase(provider),
    },
  }
}

let _instance: AgentRunsModule | null = null

export function agentRunsModule(): AgentRunsModule {
  if (_instance === null) {
    _instance = registerAgentRunsModule()
  }
  return _instance
}

/**
 * Install (or clear, with `null`) the process-wide {@link AgentRunsModule}.
 *
 * Used by both production wiring (`composeRoot()`) and test setup.
 */
export function setAgentRunsModule(module: AgentRunsModule | null): void {
  _instance = module
}
