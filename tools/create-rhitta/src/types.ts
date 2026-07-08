/** The three vendored apps. `api` is always included (the backend is mandatory). */
export type AppName = 'api' | 'web' | 'mobile'

/** Canonical app order, used everywhere selections are normalized or displayed. */
export const ALL_APPS: readonly AppName[] = ['api', 'web', 'mobile']

/** Apps that can be deselected (everything except the mandatory `api`). */
export const OPTIONAL_APPS: readonly AppName[] = ['web', 'mobile']

export interface ScaffoldParams {
  targetDir: string
  appName: string
  slug: string
  encoreId: string
  scheme: string
  bundleId: string
  /** Included apps, always in canonical order and always containing `api`. */
  apps: AppName[]
}

export interface RawFlags {
  dir?: string
  name?: string
  bundleId?: string
  /**
   * App selection resolved from `--apps` / `--no-*` flags. `undefined` means no
   * selection flag was passed, which triggers the interactive multiselect.
   */
  apps?: AppName[]
  from?: string
  ref?: string
  install: boolean
  git: boolean
}

export interface BuildParamsInput {
  dir: string
  name: string
  bundleId: string
  apps: AppName[]
}
