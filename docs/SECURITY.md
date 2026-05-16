# Security

This document records security and privacy boundaries for maintaining the project.

## Secrets

Never commit or document real values for:

- `DATABASE_URL`
- OAuth client secrets
- API keys
- GitHub tokens
- local database passwords
- session or auth tokens

Use placeholder formats in docs and `.env.example` only.

## Database Safety

Runtime database connection comes from `.env`. Before running migrations or SQL imports:

1. Identify whether the database host is local or remote.
2. Confirm the database name.
3. Confirm the operation is intended for that target.
4. Do not print passwords or full connection strings.

The current canonical export under the outer data folder uses upsert SQL. It can update existing rows with matching IDs, so it must not be imported into an unknown database.

## Data Export Safety

The outer `05_项目数据与数据库备份` folder contains CSV, JSON, and SQL exports. Treat them as handoff data, not public assets.

Do not delete, rename, or modify export files unless explicitly requested.

## Git Safety

Do not commit:

- `.env`
- `.manus/`
- local logs
- database files
- `node_modules/`
- `dist/`

Run status and review diffs before committing. Commit and push only when explicitly requested.

## Auth Boundary

Authentication and OAuth flows live under `server/_core/` and client auth hooks. Do not change auth behavior during UI polish or documentation cleanup.

## Future Portfolio Embedding

Before exposing a live demo publicly, decide:

- whether login is required
- whether demo data is real, anonymized, or seeded
- whether admin routes are disabled or protected
- whether database access is isolated from personal/local data

## Incident Response

If a secret is accidentally written to a tracked file:

1. Stop work.
2. Remove the secret from the file.
3. Check git status and diff.
4. Rotate the exposed secret if it may have left the machine.
5. Do not push until reviewed.
