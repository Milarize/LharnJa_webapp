import { createVuetify } from 'vuetify'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
  theme: {
    defaultTheme: 'careLight',
    themes: {
      careLight: {
        dark: false,
        colors: {
          background: '#EFE6D8',
          surface: '#FFFCF8',
          'surface-bright': '#FFFFFF',
          'surface-light': '#F6F0E6',
          'surface-variant': '#E7DFD2',
          'on-background': '#241C16',
          'on-surface': '#241C16',
          'on-surface-light': '#241C16',
          'on-surface-variant': '#4A433A',
          primary: '#0E6B62',
          'primary-darken-1': '#084842',
          'on-primary': '#FFFFFF',
          secondary: '#8C5A3C',
          'on-secondary': '#FFFFFF',
          coral: '#D4654A',
          'on-coral': '#FFFFFF',
          ink: '#241C16',
          'on-ink': '#FFFCF8',
          moss: '#3D6B4F',
          'on-moss': '#FFFFFF',
          gold: '#A68448',
          'on-gold': '#241C16',
          line: '#06C755',
          'on-line': '#FFFFFF',
          error: '#9F1239',
          info: '#0E6B62',
          success: '#3D6B4F',
          warning: '#A16207',
          'on-warning': '#FFFFFF',
        },
      },
    },
  },
  defaults: {
    VBtn: { rounded: 'lg', elevation: 0, class: 'text-none' },
    VCard: { elevation: 0 },
    VTextField: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
    VTextarea: { variant: 'outlined', density: 'comfortable', color: 'primary', rounded: 'lg' },
    VChip: { rounded: 'lg' },
    VAlert: { rounded: 'lg', variant: 'tonal' },
  },
})
