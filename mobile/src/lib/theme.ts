// Premium Butcher palette — single source of truth (mirrors web @theme + tailwind.config)
export const colors = {
  cream:   { 50: '#FDFBF7', 100: '#FAF6F0', 200: '#F3ECE1', 300: '#E9DECF' },
  wine:    { 50: '#FBF1F2', 100: '#F6DFE2', 300: '#D98A95', 500: '#A82234', 600: '#8A1A29', 700: '#7A1420', 800: '#5E0F19' },
  brass:   { 300: '#E2C98F', 400: '#D4B16A', 500: '#C8A35B', 600: '#A9863F' },
  charcoal: '#1F1A17',
  warmgray: { 400: '#A89C8E', 500: '#8A7E70', 600: '#6B6157' },
}

// Wine gradient for the primary button (expo-linear-gradient `colors` prop)
export const wineGradient = [colors.wine[600], colors.wine[800]] as const

// Status badge styling — green/amber reserved strictly for status semantics
export const statusStyles: Record<string, { bg: string; fg: string; ring: string }> = {
  pending:   { bg: '#FFFBEB', fg: '#B45309', ring: '#FDE68A' },
  confirmed: { bg: colors.wine[50], fg: colors.wine[700], ring: colors.wine[100] },
  ready:     { bg: '#ECFDF5', fg: '#047857', ring: '#A7F3D0' },
  picked_up: { bg: colors.cream[200], fg: colors.warmgray[600], ring: colors.cream[300] },
}
