# Import And Decompose

This document adapts the reference site's import/decompose workflow to this project. It explains how to prepare this app for future portfolio embedding without moving code prematurely.

## Current Rule

Keep the runnable app independent for now. Do not copy the app into `charliechanstudio.com` until deployment, routing, and data boundaries are decided.

## What Can Be Imported Later

Safe future imports into a portfolio site may include:

- screenshots
- short project description
- architecture diagram
- anonymized metrics summary
- demo video or GIF
- link to hosted app or repository

Do not import:

- `.env`
- raw database exports with sensitive fields
- local-only logs
- `node_modules`
- generated `dist/` unless a deployment process requires it

## Decomposition Strategy

If turning this into a portfolio project page later, separate three layers:

1. Narrative layer: copy, screenshots, project story.
2. Demo layer: live app link, static demo, or embedded route.
3. Source layer: independent repository and documentation.

The portfolio page should not need to understand the whole app internals. It should link to stable docs for architecture, data, deployment, and security.

## Preparation Checklist

- Confirm final project slug.
- Capture screenshots from stable routes.
- Write a concise case-study summary.
- Decide whether demo uses real login, sample login, or static screenshots.
- Prepare privacy/data explanation.
- Verify build and local preview.

## Current Source Documents

- `README.md`
- `AGENTS.md`
- `DESIGN.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTENT.md`
- `docs/DATA_AND_MYSQL.md`
- `docs/DEPLOYMENT.md`
- `docs/PROJECT_MEMORY.md`
- `docs/RISK_REGISTER.md`
- `docs/SECURITY.md`
