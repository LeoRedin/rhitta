// =============================================================================
// index.ts — barrel for the auth module.
// =============================================================================
//
// Downstream code (routes, components, hooks) imports from this barrel.
// This is the only seam through which auth functionality is consumed.
// =============================================================================

export {
  authClient,
  clearStoredToken,
  getSession,
  getStoredToken,
  setStoredToken,
  signIn,
  signOut,
  signUp,
} from './client.js'
export { useSession } from './use-session.js'
