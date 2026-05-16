# Deployment

This document records current deployment and preview boundaries. It does not introduce a new hosting setup.

## Current Local Preview

Install and run from the main project root:

```bash
corepack pnpm install
corepack pnpm dev
```

The public local entry route is:

```text
/
```

There is no `/login` route. Direct `/login` should show the app 404 page unless routing requirements change.

## Validation Build

Use:

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm build
```

The build outputs to `dist/`. Do not commit `dist/` unless a future deployment process explicitly requires it.

## Runtime Requirements

The app depends on:

- Node and pnpm via Corepack
- `.env` with runtime variables
- MySQL or TiDB-compatible database through `DATABASE_URL`
- OAuth/environment configuration for authenticated flows

Do not write real secrets into this document.

## Current Repository Boundary

This project currently remains an independent repository:

```text
/Users/mac/Desktop/Capstone Project/cognitive-training-platform-hi-main
```

`/Users/mac/Desktop/charliechanstudio.com` is a read-only reference in this workflow. Do not move files into it during normal maintenance.

## Future Website Embedding

If the project is later shown inside `charliechanstudio.com`, choose one of these approaches after a separate deployment decision:

1. Case-study page with screenshots and a link to the live app.
2. Static exported demo if authentication/database are not needed.
3. Separate hosted app embedded or linked from the portfolio.

Before embedding, define:

- deployment host
- demo route
- authentication behavior
- data/privacy policy
- whether sample data is real, anonymized, or seeded

## Safety Rules

- Do not deploy with local `.env` values.
- Do not expose database credentials.
- Do not import SQL into an unknown remote database.
- Do not change CI/CD or hosting configuration without explicit approval.
