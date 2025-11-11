import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import promisePlugin from 'eslint-plugin-promise';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        module: 'readonly',
        require: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        document: 'readonly',
        window: 'readonly',
        RequestInit: 'readonly',
        HeadersInit: 'readonly',
        React: 'readonly',
        crypto: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        navigator: 'readonly',
        AbortSignal: 'readonly',
        // DOM types
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        MouseEvent: 'readonly',
        KeyboardEvent: 'readonly',
        Event: 'readonly',
        Node: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      promise: promisePlugin,
      sonarjs: sonarjsPlugin,
      unicorn: unicornPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...promisePlugin.configs.recommended.rules,
      ...sonarjsPlugin.configs.recommended.rules,
      ...unicornPlugin.configs.recommended.rules,
      'no-console': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/prefer-export-from': 'off',
      'unicorn/prefer-global-this': 'off',
      'unicorn/prefer-string-slice': 'off',
      'sonarjs/no-nested-conditional': 'off',
      'sonarjs/pseudo-random': 'warn',
      'sonarjs/use-type-alias': 'warn',
    },
  },
  // Relaxed rules for test files
  {
    files: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/__tests__/**/*.ts',
      '**/__tests__/**/*.tsx',
    ],
    rules: {
      'sonarjs/no-hardcoded-passwords': 'off', // Test fixtures often have demo passwords
      'sonarjs/assertions-in-tests': 'off', // Some tests are for side effects
      '@typescript-eslint/no-unused-vars': 'off', // Test setup may have intentionally unused vars
      '@typescript-eslint/no-explicit-any': 'off', // Test mocks often use any types
      'sonarjs/no-unused-vars': 'off', // Test setup vars
      'sonarjs/unused-import': 'off', // May have imports for type checking
      'sonarjs/no-dead-store': 'off', // Setup code may look unused
      'unicorn/no-zero-fractions': 'off', // Test data may use explicit 0.0 for clarity
      'unicorn/numeric-separators-style': 'off', // Test data readability
      'unicorn/no-array-for-each': 'off', // forEach is fine in tests
      'unicorn/prefer-number-properties': 'off', // parseInt is fine in tests
      'no-undef': 'off', // Vitest globals
      'no-console': 'off', // Console logs are fine in tests
    },
  },
  // Relaxed rules for seed/migration files
  {
    files: ['**/db/seeds/**/*.ts', '**/db/migrations/**/*.ts'],
    rules: {
      'no-console': 'off', // Console logging is expected in seeds/migrations
      'sonarjs/cognitive-complexity': 'off', // Seed files can be complex
      'unicorn/no-zero-fractions': 'off', // GPS coordinates use .0
      'sonarjs/pseudo-random': 'off', // Demo data generation
    },
  },
  // Allow TODO comments (technical debt tracking)
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'sonarjs/todo-tag': 'warn', // Downgrade to warning
      'sonarjs/cognitive-complexity': ['error', 20], // Increase threshold
      'unicorn/no-array-reduce': 'warn', // Allow reduce
      'unicorn/consistent-function-scoping': 'warn', // Allow inline functions
      'sonarjs/no-identical-functions': 'warn', // Allow some duplication
      'sonarjs/no-commented-code': 'warn', // Allow commented code
      'sonarjs/publicly-writable-directories': 'warn', // Warning only
      'sonarjs/no-redundant-jump': 'warn', // Warning only
      'unicorn/no-process-exit': 'warn', // CLI scripts may need this
      'unicorn/prefer-top-level-await': 'warn', // Not always possible
      'unicorn/import-style': 'warn', // Not critical
      'sonarjs/no-unused-vars': 'warn', // Allow placeholders for future work
      'sonarjs/no-dead-store': 'warn', // Allow intentional setup
      'sonarjs/unused-import': 'warn', // Allow imports for type checking
      '@typescript-eslint/no-explicit-any': 'warn', // Downgrade to warning
      'no-misleading-character-class': 'warn', // Emojis in test strings
      'sonarjs/duplicates-in-character-class': 'warn', // Emojis
      'sonarjs/no-misleading-character-class': 'warn', // Emojis
    },
  },
  prettierConfig,
];
