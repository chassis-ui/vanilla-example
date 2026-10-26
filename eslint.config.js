import { defineConfig } from 'eslint/config'
import eslint from '@eslint/js'
import globals from 'globals'
import prettierPlugin from 'eslint-plugin-prettier/recommended'

export default defineConfig([
  // Global ignores
  {
    ignores: ['dist/', '.cache/']
  },
  eslint.configs.recommended,
  prettierPlugin,
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-useless-escape': 'warn',
      'prettier/prettier': 'warn'
    }
  },
  // The build scripts run in Node.js, src/script.js in a browser
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser }
    }
  }
])
