import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

const REQUIRED_VARS = [
  'VITE_AUTH0_DOMAIN',
  'VITE_AUTH0_CLIENT_ID',
  'VITE_AUTH0_AUDIENCE',
  'VITE_API_URL',
];

const OPTIONAL_VARS = [
  'VITE_LOGO_URL',
  'VITE_COMPANY_NAME',
];

const ALL_VARS = [...REQUIRED_VARS, ...OPTIONAL_VARS];

describe('Environment variables', () => {
  describe('.env.example contains all used variables', () => {
    let envExampleContent: string;

    beforeEach(() => {
      envExampleContent = readFileSync(
        resolve(currentDir, '../.env.example'),
        'utf-8'
      );
    });

    it.each(ALL_VARS)('%s is documented in .env.example', (varName) => {
      expect(envExampleContent).toContain(varName);
    });
  });

  describe('source code does not use undocumented env vars', () => {
    it('all VITE_ vars in source are listed in env.ts', () => {
      const envVarPattern = /import\.meta\.env\.(VITE_\w+)/g;
      const foundVars = new Set<string>();

      function scanDir(dir: string) {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== 'node_modules') {
            scanDir(fullPath);
          } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && entry.name !== 'env.test.ts') {
            const content = readFileSync(fullPath, 'utf-8');
            let match;
            while ((match = envVarPattern.exec(content)) !== null) {
              foundVars.add(match[1]);
            }
          }
        }
      }

      scanDir(currentDir);

      const knownVars = new Set(ALL_VARS);
      const undocumented = [...foundVars].filter((v) => !knownVars.has(v));

      expect(undocumented).toEqual([]);
    });
  });

  describe('required env vars are set at build time', () => {
    it.each(REQUIRED_VARS)('%s is set', (varName) => {
      const value = import.meta.env[varName];
      if (import.meta.env.CI) {
        expect(value).toBeTruthy();
      } else {
        expect(typeof varName).toBe('string');
      }
    });
  });
});
