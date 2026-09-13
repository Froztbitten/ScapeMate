const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  { ignores: ['node_modules', 'coverage'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-restricted-globals': ['error', 'name', 'length'],
      'prefer-arrow-callback': 'error',
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.spec.js', '**/*.test.js'],
    languageOptions: { globals: { ...globals.mocha } },
  },
]
