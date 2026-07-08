---
"create-rhitta": patch
---

Document the `.tool-versions` Node pin expectation in the generated README: the pinned
Node patch is derived from `.nvmrc` and is a real published release, so if `asdf install`
reports it as not found the user's plugin index is stale and should be updated with
`asdf plugin update nodejs`.
