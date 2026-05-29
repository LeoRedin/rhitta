// Dark theme colors — flat shape expected by Ignite's ThemeProvider.
// Values sourced from @rhitta/design-tokens semantic tokens (dark mode).
export const colors = {
  palette: {
    neutral900: '#FFFFFF',
    neutral800: '#F4F2F1',
    neutral700: '#D7CEC9',
    neutral600: '#B6ACA6',
    neutral500: '#978F8A',
    neutral400: '#564E4A',
    neutral300: '#3C3836',
    neutral200: '#191015',
    neutral100: '#000000',

    primary600: '#1E3A5F',
    primary500: '#1E40AF',
    primary400: '#2563EB',
    primary300: '#3B82F6',
    primary200: '#60A5FA',
    primary100: '#93C5FD',

    secondary500: '#312E81',
    secondary400: '#4338CA',
    secondary300: '#6366F1',
    secondary200: '#818CF8',
    secondary100: '#A5B4FC',

    accent500: '#78350F',
    accent400: '#92400E',
    accent300: '#B45309',
    accent200: '#D97706',
    accent100: '#F59E0B',

    angry100: '#7F1D1D',
    angry500: '#EF4444',

    overlay20: 'rgba(0, 0, 0, 0.2)',
    overlay50: 'rgba(0, 0, 0, 0.5)',
  },
  transparent: 'rgba(0, 0, 0, 0)',
  text: '#F8FAFC',
  textDim: '#94A3B8',
  background: '#020617',
  border: '#334155',
  tint: '#60A5FA',
  tintInactive: '#475569',
  separator: '#334155',
  error: '#EF4444',
  errorBackground: '#7F1D1D',
} as const
