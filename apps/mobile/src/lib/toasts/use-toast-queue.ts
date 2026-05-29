// =============================================================================
// use-toast-queue.ts — Zustand store for transient toast notifications.
// =============================================================================
//
// Feeds the toast viewport mounted by the app shell. Per AGENTS.md rule 8,
// this stays UI-only: no server data lives here. The queue is in memory (no
// persistence) — toasts that haven't been read by the time the app restarts
// are gone, which is the desired UX.
// =============================================================================

import { create } from 'zustand'

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger'

export type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

export type Toast = {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  duration: number
  createdAt: number
}

type ToastState = {
  toasts: Toast[]
  push: (input: ToastInput) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

const DEFAULT_DURATION = 5_000

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `t-${Math.random().toString(36).slice(2, 11)}`
}

export const useToastQueue = create<ToastState>()((set) => ({
  toasts: [],
  push: (input) => {
    const id = makeId()
    const toast: Toast = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? 'info',
      duration: input.duration ?? DEFAULT_DURATION,
      createdAt: Date.now(),
    }
    set((state) => ({ toasts: [...state.toasts, toast] }))
    return id
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
  dismissAll: () => {
    set({ toasts: [] })
  },
}))
