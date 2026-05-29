/**
 * Type declarations for Expo `process.env` build-time variables.
 *
 * Expo replaces `process.env.EXPO_PUBLIC_*` at bundle time with the
 * corresponding values from `.env` files. These declarations satisfy
 * the TypeScript compiler so that code can reference them without
 * `@types/node`.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string
  }
}

declare const process: {
  env: NodeJS.ProcessEnv
}
