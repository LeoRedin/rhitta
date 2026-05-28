import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * `@tanstack/react-start/plugin/vite` composes the router code-splitting +
 * file-based route plugin internally — we do NOT add `@tanstack/router-plugin`
 * separately. Framework is already `react` (set by `@tanstack/react-start`),
 * so the plugin is called with defaults. See ADR-0019 (SSR-first apps/web).
 */
export default defineConfig({
  plugins: [tanstackStart(), react(), tailwindcss()],
  server: { port: 3000 },
})
