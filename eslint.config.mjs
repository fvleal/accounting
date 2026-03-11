// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        {
          type: 'shared-domain',
          pattern: ['src/shared/domain/**'],
          mode: 'full',
        },
        {
          type: 'domain',
          pattern: ['src/*/domain/**'],
          mode: 'full',
        },
        {
          type: 'application',
          pattern: ['src/*/application/**'],
          mode: 'full',
        },
        {
          type: 'infrastructure',
          pattern: ['src/*/infrastructure/**'],
          mode: 'full',
        },
        {
          type: 'interface',
          pattern: ['src/*/interface/**'],
          mode: 'full',
        },
      ],
    },
    rules: {
      'boundaries/element-types': [
        2,
        {
          default: 'disallow',
          rules: [
            { from: 'shared-domain', allow: ['shared-domain'] },
            { from: 'domain', allow: ['domain', 'shared-domain'] },
            {
              from: 'application',
              allow: ['domain', 'application', 'shared-domain'],
            },
            {
              from: 'infrastructure',
              allow: [
                'domain',
                'application',
                'infrastructure',
                'shared-domain',
              ],
            },
            {
              from: 'interface',
              allow: [
                'domain',
                'application',
                'infrastructure',
                'interface',
                'shared-domain',
              ],
            },
          ],
        },
      ],
      'boundaries/external': [
        2,
        {
          default: 'allow',
          rules: [
            {
              from: 'domain',
              disallow: ['@nestjs/*', '@prisma/*', 'prisma'],
            },
            {
              from: 'shared-domain',
              disallow: ['@nestjs/*', '@prisma/*', 'prisma'],
            },
          ],
        },
      ],
    },
  },
);
