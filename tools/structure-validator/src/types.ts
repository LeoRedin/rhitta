export type Failure = {
  path: string
  reason: string
  adrRef?: string
}

export type CheckContext = {
  repoRoot: string
}

export type Check = (ctx: CheckContext) => Failure[]
