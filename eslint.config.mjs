// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**'],
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
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
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
