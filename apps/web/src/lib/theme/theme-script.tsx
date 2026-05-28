// =============================================================================
// theme-script.tsx — pre-hydration inline script for FOUC prevention.
// =============================================================================
//
// Reads the persisted theme mode from `localStorage` before React boots
// and applies `data-theme` to `<html>` synchronously. Without this the
// page would flash light theme on hard reloads when the user has chosen
// dark. Rendered inside `<head>` by Task 9's root route.
// =============================================================================

const STORAGE_KEY = 'rhitta:theme'

const INLINE_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var mode = 'system';
    if (stored) {
      var parsed = JSON.parse(stored);
      if (parsed && parsed.state && typeof parsed.state.mode === 'string') {
        mode = parsed.state.mode;
      }
    }
    var resolved = mode;
    if (mode === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (e) {}
})();
`.trim()

export function ThemeScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: literal pre-hydration script with no user input; required for FOUC prevention.
  return <script dangerouslySetInnerHTML={{ __html: INLINE_SCRIPT }} />
}
