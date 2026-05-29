// =============================================================================
// agent-runs.ts — TanStack Query wrapper for the agent-runs module.
// =============================================================================
//
// Synchronous wrapper around `POST /agent-runs`. No list/get endpoints
// exist yet for agent runs (see Phase 2a Task 12) — this module exposes
// only the mutation. A streaming endpoint is planned for Phase 2b Task 12.
// =============================================================================

import type { AgentRunRequest, AgentRunResponse } from '@rhitta/contracts/agent-runs'
import { useMutation } from '@tanstack/react-query'
import { getApiClient } from './client.js'

export function useRunAgent() {
  return useMutation<AgentRunResponse, Error, AgentRunRequest>({
    mutationFn: async (input: AgentRunRequest): Promise<AgentRunResponse> => {
      const client = getApiClient()
      return client.agentRuns.run(input)
    },
  })
}
