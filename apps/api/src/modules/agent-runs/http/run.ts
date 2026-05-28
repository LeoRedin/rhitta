/**
 * `POST /agent-runs` — run an agent synchronously for the authenticated
 * user and return the completed output.
 *
 * Belt-and-braces per ADR-0017: the request payload is parsed with
 * `AgentRunRequestSchema` on the way in and the response with
 * `AgentRunResponseSchema` on the way out, even though TypeScript
 * already infers both.
 *
 * The Encore `api(...)` wrapper is intentionally thin: all real work
 * lives in {@link runImpl}, which takes its deps explicitly. The
 * integration test imports `runImpl` directly with hand-rolled
 * in-memory deps; production goes through `agentRunsModule()` +
 * `authGate()`.
 *
 * `requestFromMeta` is reused from the notes module (Task 7) — it's a
 * pure helper with no notes-specific logic; promoting it to `lib/` is
 * deferred to a follow-up that needs it elsewhere too.
 */
import {
  type AgentRunRequest,
  AgentRunRequestSchema,
  type AgentRunResponse,
  AgentRunResponseSchema,
} from '@rhitta/contracts/agent-runs'
import { currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { authGate } from '../../../lib/auth-gate-instance.js'
import { mapError } from '../../../lib/error-mapper.js'
import { requestFromMeta } from '../../notes/http/request-bridge.js'
import type { RunAgentUseCase } from '../application/run-agent.js'
import { agentRunsModule } from '../module.js'

export type RunDeps = {
  authGate: AuthGate
  runAgent: RunAgentUseCase
  request: Request
}

export async function runImpl(req: AgentRunRequest, deps: RunDeps): Promise<AgentRunResponse> {
  try {
    const input = AgentRunRequestSchema.parse(req)
    const user = await deps.authGate.getCurrentUser(deps.request)
    const result = await deps.runAgent.execute({ ...input, userId: user.userId })
    return AgentRunResponseSchema.parse(result.toDTO())
  } catch (e) {
    throw mapError(e)
  }
}

export const run = api(
  { method: 'POST', path: '/agent-runs', expose: true },
  async (req: AgentRunRequest): Promise<AgentRunResponse> => {
    return runImpl(req, {
      authGate: authGate(),
      runAgent: agentRunsModule().useCases.runAgent,
      request: requestFromMeta(currentRequest()),
    })
  }
)
