// Light theme colors — flat shape expected by Ignite's ThemeProvider.
// Values sourced from @rhitta/design-tokens semantic tokens (light mode).
export const colors = {
  palette: {
    neutral900: '#0F172A',
    neutral800: '#1E293B',
    neutral700: '#334155',
    neutral600: '#475569',
    neutral500: '#64748B',
    neutral400: '#94A3B8',
    neutral300: '#CBD5E1',
    neutral200: '#E2E8F0',
    neutral100: '#F1F5F9',

    primary600: '#DBEAFE',
    primary500: '#BFDBFE',
    primary400: '#93C5FD',
    primary300: '#60A5FA',
    primary200: '#3B82F6',
    primary100: '#2563EB',

    secondary500: '#EDE9FE',
    secondary400: '#DDD6FE',
    secondary300: '#C4B5FD',
    secondary200: '#A78BFA',
    secondary100: '#8B5CF6',

    accent500: '#FEF3C7',
    accent400: '#FDE68A',
    accent300: '#FCD34D',
    accent200: '#FBBF24',
    accent100: '#F59E0B',

    angry100: '#FEE2E2',
    angry500: '#EF4444',

    overlay20: 'rgba(15, 23, 42, 0.2)',
    overlay50: 'rgba(15, 23, 42, 0.5)',
  },
  transparent: 'rgba(0, 0, 0, 0)',
  text: '#0F172A',
  textDim: '#64748B',
  background: '#F8FAFC',
  border: '#CBD5E1',
  tint: '#3B82F6',
  tintInactive: '#CBD5E1',
  separator: '#CBD5E1',
  error: '#EF4444',
  errorBackground: '#FEE2E2',
} as const
