# Account Frontend

## What This Is

Aplicacao SPA para gerenciamento de informacoes pessoais do usuario. O usuario se autentica via Auth0, visualiza seus dados de perfil em uma tela estilo Google Personal Info (dark mode, responsivo), e edita campos permitidos atraves de modais. Consome a API REST do backend NestJS (Account bounded context).

## Core Value

O usuario consegue manter suas informacoes pessoais atualizadas de forma simples e rapida, pois esses dados sao consumidos por outros contextos delimitados do sistema.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Autenticacao via Auth0 (login/logout)
- [ ] Onboarding: tela de criacao de conta (nome completo + CPF) para usuarios sem Account
- [ ] Tela de perfil estilo Google Personal Info com dados exibidos em cards clicaveis
- [ ] Edicao de nome completo via modal
- [ ] Edicao de data de nascimento via modal
- [ ] Edicao de telefone via modal (com badge "nao verificado")
- [ ] Upload de foto de perfil com crop em formato 3x4
- [ ] Layout responsivo (mobile e desktop)
- [ ] Visual moderno com dark mode

### Out of Scope

- Painel de administracao — planejado para v2
- Verificacao de telefone — depende do backend v2
- Edicao de email — campo imutavel no backend
- Edicao de CPF — campo imutavel no backend

## Context

- Backend ja existe e esta completo (NestJS, Prisma, PostgreSQL, Auth0 JWT + RBAC, S3 para fotos)
- API REST disponivel em `localhost:3000` com 9 endpoints (create, get, update, upload photo, etc.)
- Auth0 ja configurado com roles: `create:account`, `read:own-account`, `update:own-account`, `read:accounts`
- O frontend sera uma pasta `frontend/` no mesmo repositorio do backend
- Referencia visual: https://myaccount.google.com/personal-info — dados exibidos em lista, clique abre modal de edicao

## Constraints

- **Stack**: React + Vite (SPA) — escolha do usuario
- **Auth**: Auth0 — mesmo tenant do backend
- **API**: Consome REST API do backend existente — nao criar BFF
- **Foto**: Crop 3x4 no client-side antes do upload

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Vite (SPA) | Stack familiar, rapido para desenvolver, sem necessidade de SSR | — Pending |
| Dark mode como padrao | Preferencia do usuario, visual moderno | — Pending |
| Crop 3x4 client-side | Formato especifico para foto de perfil, reduz carga no server | — Pending |
| Modal para edicao | Inspirado no Google Personal Info, UX limpa sem navegar para outra pagina | — Pending |

---
*Last updated: 2026-03-11 after initialization*
