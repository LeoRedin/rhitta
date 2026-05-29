export interface ScaffoldParams {
  targetDir: string
  appName: string
  slug: string
  encoreId: string
  scheme: string
  bundleId: string
}

export interface RawFlags {
  dir?: string
  name?: string
  bundleId?: string
  from?: string
  ref?: string
  install: boolean
  git: boolean
}

export interface BuildParamsInput {
  dir: string
  name: string
  bundleId: string
}
