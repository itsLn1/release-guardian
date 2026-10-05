import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['**/dist/**', '**/node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Determinism rules for business logic (MASTER_SPEC.md 26.1 / 27.4).
    files: ['packages/core/src/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Non-deterministic. Use an injected IdGenerator.' },
        { object: 'Date', property: 'now', message: 'Non-deterministic. Use the injected Clock.' },
        { object: 'process', property: 'env', message: 'Core is pure. Pass the environment in.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Non-deterministic. Use the injected Clock.',
        },
      ],
    },
  },
);
