// =============================================================================
// index.ts — barrel for the auth module.
// =============================================================================
//
// The web-app biome variant restricts `better-auth/*` imports to
// `src/lib/auth/**`. Downstream code (routes, components, server-side
// helpers) imports from this barrel instead — that's the only seam.
// =============================================================================

export * from './client.js'
export * from './use-session.js'
