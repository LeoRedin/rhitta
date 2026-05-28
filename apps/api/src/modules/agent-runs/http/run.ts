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
 *
 * Encore static-analyzer note: the `api(...)` signature uses concrete
 * `AgentRun*Http*` interfaces rather than the Zod-inferred types from
 * `@rhitta/contracts/agent-runs`. Encore 1.57.5's static analyzer can't
 * resolve `z.infer<typeof Schema>` aliases; the concrete interfaces
 * mirror the schema shapes and the runtime `.parse(...)` calls keep
 * ADR-0017's belt-and-braces guarantee intact.
 */
import { AgentRunRequestSchema, AgentRunResponseSchema } from '@rhitta/contracts/agent-runs'
import { currentRequest } from 'encore.dev'
import { api } from 'encore.dev/api'
import type { AuthGate } from '../../../lib/auth-gate.js'
import { authGate } from '../../../lib/auth-gate-instance.js'
import { mapError } from '../../../lib/error-mapper.js'
import { requestFromMeta } from '../../notes/http/request-bridge.js'
import type { RunAgentUseCase } from '../application/run-agent.js'
import { agentRunsModule } from '../module.js'

/** Wire-shape mirror of `AgentRunRequestSchema`. */
export interface AgentRunHttpRequest {
  prompt: string
  systemPrompt?: string
  model?: string
  maxTokens?: number
}

/** Wire-shape mirror of `AgentRunResponseSchema`. Branded ids flatten to `string`. */
export interface AgentRunHttpResponse {
  id: string
  userId: string
  request: {
    prompt: string
    systemPrompt?: string
    model: string
    maxTokens: number
  }
  output: string
  inputTokens: number
  outputTokens: number
  createdAt: Date
}

export type RunDeps = {
  authGate: AuthGate
  runAgent: RunAgentUseCase
  request: Request
}

export async function runImpl(
  req: AgentRunHttpRequest,
  deps: RunDeps
): Promise<AgentRunHttpResponse> {
  try {
    const input = AgentRunRequestSchema.parse(req)
    const user = await deps.authGate.getCurrentUser(deps.request)
    const result = await deps.runAgent.execute({ ...input, userId: user.userId })
    return AgentRunResponseSchema.parse(result.toDTO()) as AgentRunHttpResponse
  } catch (e) {
    throw mapError(e)
  }
}

export const run = api(
  { method: 'POST', path: '/agent-runs', expose: true },
  async (req: AgentRunHttpRequest): Promise<AgentRunHttpResponse> => {
    return runImpl(req, {
      authGate: authGate(),
      runAgent: agentRunsModule().useCases.runAgent,
      request: requestFromMeta(currentRequest()),
    })
  }
)
