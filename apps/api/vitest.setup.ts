import path from 'node:path'

/**
 * Point Encore's `napi.cjs` loader at an in-process stub so the SDK
 * can be imported during unit tests without the Encore CLI or its
 * native runtime binary being installed.
 *
 * The stub lives next to the lib tests
 * (`src/lib/__tests__/encore-runtime-stub.cjs`). It provides empty
 * shells for every export the SDK destructures at import time, plus a
 * `Runtime` class with the handful of methods the SDK invokes
 * eagerly (e.g. from `new Topic(...)`).
 */
process.env.ENCORE_RUNTIME_LIB ??= path.resolve(
  __dirname,
  'src/lib/__tests__/encore-runtime-stub.cjs'
)
