# ADR 0010: Fixed versioning for `@rhitta/*` packages

## Status
Accepted

## Context
Changesets supports three release modes:
- **Independent** — each package has its own version. Maximum flexibility, maximum cognitive overhead when consumers need to figure out which versions are compatible.
- **Linked** — selected packages bump together but otherwise versioned independently. Halfway house.
- **Fixed** — listed packages always share one version. Bumping any one bumps all.

Rhitta packages (`@rhitta/design-tokens`, `@rhitta/contracts`, `@rhitta/biome-config`, `@rhitta/tsconfig`, and the design-system packages) are designed to be consumed *together*. A consumer pinned to `@rhitta/contracts@1.4.0` should also be on `@rhitta/design-tokens@1.4.0` and have a clear expectation of compatibility.

## Decision
All `@rhitta/*` runtime packages release under **fixed versioning** — they always share a single version number. Configured via `.changeset/config.json`:

```json
"fixed": [["@rhitta/*"]]
```

Internal-only tooling like `@rhitta/structure-validator` is excluded from publishing entirely (via `"ignore"`), because it is consumed via copy-at-scaffold, not as a runtime dep.

## Consequences
- Consumers reason about one version: "I'm on Rhitta 1.4.0." Cross-package compatibility is implicit.
- Cost: every package bumps every release, even when only one changed. CHANGELOG entries clarify which packages actually changed in each version.
- This decision is easy to revisit if the boilerplate splits into truly independent libraries later. Until then, fixed mode is the safest default.
