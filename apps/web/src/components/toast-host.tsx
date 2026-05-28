// =============================================================================
// toast-host.tsx — global Radix Toast viewport bound to the Zustand queue.
// =============================================================================
//
// Mounted once in `__root.tsx`. Reads the queue from `useToastQueue()`
// (the Zustand store from Task 8) and renders one `<Toast />` per entry
// via the Radix primitives re-exported by `@rhitta/design-system-web`.
// The `onOpenChange(false)` callback fires when Radix dismisses the
// toast (timeout or swipe), at which point we drop it from the queue.
//
// Per AGENTS.md rule 8 (state boundaries), the queue is UI state only —
// mutation handlers / hooks `push()` toasts but never read from this
// host. The host's only job is rendering.
// =============================================================================

import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@rhitta/design-system-web'
import { useToastQueue } from '../lib/toasts/index.js'

export function ToastHost() {
  const toasts = useToastQueue((state) => state.toasts)
  const dismiss = useToastQueue((state) => state.dismiss)

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          duration={toast.duration}
          onOpenChange={(open) => {
            if (!open) dismiss(toast.id)
          }}
        >
          <div className="flex flex-col gap-1">
            <ToastTitle>{toast.title}</ToastTitle>
            {toast.description ? <ToastDescription>{toast.description}</ToastDescription> : null}
          </div>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
