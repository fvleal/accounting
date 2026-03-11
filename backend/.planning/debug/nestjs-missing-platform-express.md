---
status: diagnosed
trigger: "NestJS fails to start - missing @nestjs/platform-express"
created: 2026-03-10T22:00:00Z
updated: 2026-03-10T22:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - toidentifier package is corrupt (missing index.js), breaking the express require chain
test: node -e "require('@nestjs/platform-express')" reproduces the error
expecting: n/a - root cause confirmed
next_action: report diagnosis

## Symptoms

expected: NestJS app boots and listens on port 3000
actual: "[Nest] ERROR [PackageLoader] No driver (HTTP) has been selected"
errors: Cannot find module 'toidentifier' in require chain from platform-express -> express -> http-errors -> toidentifier
reproduction: npm run start or npm run start:dev
started: after initial project setup (phase 02)

## Eliminated

- hypothesis: "@nestjs/platform-express not in package.json"
  evidence: Listed at line 30 of package.json as "^11.0.1"
  timestamp: 2026-03-10T22:00:00Z

- hypothesis: "@nestjs/platform-express not installed in node_modules"
  evidence: Directory exists at node_modules/@nestjs/platform-express with version 11.1.16
  timestamp: 2026-03-10T22:00:00Z

- hypothesis: "Version mismatch between @nestjs/core and @nestjs/platform-express"
  evidence: Both are version 11.1.16
  timestamp: 2026-03-10T22:00:00Z

- hypothesis: "Docker container missing the dependency"
  evidence: docker-compose.yml only has postgres and minio services; app runs on host
  timestamp: 2026-03-10T22:00:00Z

## Evidence

- timestamp: 2026-03-10T22:00:00Z
  checked: package.json line 30
  found: "@nestjs/platform-express": "^11.0.1" is declared as a dependency
  implication: Package was intentionally added; not a missing-declaration issue

- timestamp: 2026-03-10T22:00:00Z
  checked: node_modules/@nestjs/platform-express/package.json
  found: Version 11.1.16 installed, matching @nestjs/core 11.1.16
  implication: No version mismatch

- timestamp: 2026-03-10T22:00:00Z
  checked: node -e "require('@nestjs/platform-express')"
  found: "Cannot find module 'toidentifier'" — require chain: platform-express -> express -> http-errors -> toidentifier
  implication: The package exists but cannot load due to broken transitive dependency

- timestamp: 2026-03-10T22:00:00Z
  checked: node_modules/toidentifier/ directory listing
  found: Only HISTORY.md, LICENSE, package.json, README.md present. Missing index.js (the main entry point declared in files array)
  implication: npm install was corrupt/incomplete for this package — source files were not extracted

## Resolution

root_cause: The node_modules/toidentifier package has a corrupt installation — its index.js source file is missing from disk while metadata files are present. This breaks the require chain: @nestjs/platform-express -> express -> http-errors -> toidentifier. When NestJS core tries to require the platform-express adapter, the require throws an error, and NestJS interprets this as "no HTTP driver installed."
fix: (diagnosis only - not applied)
verification: (diagnosis only)
files_changed: []
