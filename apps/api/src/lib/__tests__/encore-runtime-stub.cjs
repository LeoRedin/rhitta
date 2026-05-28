/**
 * Minimal stub for the `encore-runtime.node` native module so the
 * Encore SDK can be `import`-ed inside unit tests without the Encore
 * CLI / native binary being present.
 *
 * Loaded via `ENCORE_RUNTIME_LIB` (set by `vitest.setup.ts`). Each
 * exported name corresponds to a constructor / class the SDK's
 * `napi.cjs` destructures at import time (see
 * `node_modules/encore.dev/internal/runtime/napi/napi.cjs`).
 *
 * The Encore SDK constructs a `Runtime` singleton at module load and
 * eagerly calls methods on it from resource constructors (e.g. `new
 * Topic(...)` invokes `runtime.RT.pubsubTopic(name)`). So `Runtime`
 * needs lazily-typed methods that return inert stubs.
 *
 * Unit tests in this package never exercise runtime behaviour; they
 * only need the module graph to load so pure-JS helpers (`APIError`,
 * `ErrCode`, `InMemoryEventPublisher`) are reachable.
 */

class InertResource {
  async publish() {
    return 'stub-message-id'
  }
}

class Runtime {
  static version() {
    // Match the encore.dev package version so the SDK's sanity check
    // doesn't print a noisy warning.
    return 'v1.57.5'
  }

  pubsubTopic(_name) {
    return new InertResource()
  }
  sqlDatabase(_name) {
    return new InertResource()
  }
  runtimeConfig() {
    return { metrics: null }
  }
  rt() {
    return this
  }
}

class Stub {}

module.exports = {
  APICallError: Stub,
  ApiCallError: Stub,
  BodyReader: Stub,
  Bucket: Stub,
  BucketObject: Stub,
  CacheCluster: Stub,
  CloudProvider: Stub,
  Cursor: Stub,
  Decimal: Stub,
  EnvironmentType: Stub,
  Gateway: Stub,
  ListEntry: Stub,
  ListIterator: Stub,
  LogLevel: Stub,
  Logger: Stub,
  MetricType: Stub,
  MetricsRegistry: Stub,
  ObjectAttrs: Stub,
  ObjectErrorKind: Stub,
  PubSubSubscription: Stub,
  PubSubTopic: Stub,
  QueryArgs: Stub,
  Request: Stub,
  ResponseWriter: Stub,
  Row: Stub,
  Runtime,
  SQLConn: Stub,
  SQLDatabase: Stub,
  Secret: Stub,
  Sink: Stub,
  Socket: Stub,
  SqlConn: Stub,
  SqlDatabase: Stub,
  Stream: Stub,
  Transaction: Stub,
  TypedObjectError: Stub,
  WebSocketClient: Stub,
}
