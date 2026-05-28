import { z } from 'zod'
import { UserIdSchema } from '../auth/user.js'
import { brand } from '../shared/ids.js'

export const AgentRunIdSchema = brand(z.string().uuid(), 'AgentRunId')
export type AgentRunId = z.infer<typeof AgentRunIdSchema>

// Request payload
export const AgentRunRequestSchema = z.object({
  prompt: z.string().min(1).max(50_000),
  systemPrompt: z.string().max(10_000).optional(),
  model: z.string().default('claude-sonnet-4-6'),
  maxTokens: z.number().int().positive().max(8192).default(2048),
})
export type AgentRunRequest = z.infer<typeof AgentRunRequestSchema>

// Response payload
export const AgentRunResponseSchema = z.object({
  id: AgentRunIdSchema,
  userId: UserIdSchema,
  request: AgentRunRequestSchema,
  output: z.string(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  createdAt: z.date(),
})
export type AgentRunResponse = z.infer<typeof AgentRunResponseSchema>
