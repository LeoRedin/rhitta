# ADR 0007: TanStack Form on both web and mobile

## Status
Accepted

## Context
The form-library landscape on web is fragmented (Formik, react-hook-form, Conform, native). React Native's story is worse — most engineers cobble forms together with `useState`. Picking different libraries for web and mobile means engineers context-switch between APIs for the same conceptual problem, and shared Zod schemas have to integrate with two different validation adapters.

TanStack Form is unique in that it ships first-class adapters for **both React (web) and React Native (mobile)**, supports Zod validators natively, and has a controlled-store model that plays well with TanStack Query mutations.

## Decision
**TanStack Form is the only form library** allowed in Rhitta, on both web (`apps/web`) and mobile (`apps/mobile`). No Formik, no react-hook-form, no hand-rolled `useState` forms.

All forms validate against a Zod schema from `@rhitta/contracts`. Form fields render via design-system primitives.

## Consequences
- A form pattern learned on web transfers directly to mobile and vice versa.
- One schema, one validator, one form library — minimum surface area for agents and humans.
- Cost: TanStack Form is younger than react-hook-form, fewer Stack Overflow answers. The API is small enough that this matters less than usual.
- Hand-rolled state-based forms become a banned pattern — caught by code review until a Biome rule can be authored.
