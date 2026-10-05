# leePF repository rules

## Scope

This repository contains several applications. The primary CI quality target is `running` (Nuxt 3, TypeScript, Prisma, PostgreSQL); root Docker Compose smoke checks the assembled services. `dash-board` keeps its own Python/Node commands and is checked by its existing project tests when that service changes.

## Required workflow

- Inspect the existing package manager and use it consistently. `running` uses npm and `package-lock.json`; do not mix npm, pnpm, and yarn.
- Preserve existing conventions and tests. Never delete a test, weaken an assertion, or remove business logic to make CI green.
- After changes under `running`, run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`, and the relevant integration/E2E checks.
- Integration tests use only `DATABASE_URL_TEST` and a disposable PostgreSQL service. Never connect to or migrate a production database.
- External public APIs and Kakao are mocked in deterministic tests. Never print API keys or commit `.env`/secret files.
- Keep secrets in GitLab CI/CD masked variables. Do not expose server-only values through Nuxt public runtime config.
- Schema changes must be reviewed. Automatic remediation must stop for destructive Prisma SQL (`DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, or bulk deletes).
- Never commit directly to `main` or a production branch. Automated changes are limited to `auto-fix/*` branches and require a human-reviewed Merge Request.
- Automated remediation is limited to small, mechanical fixes (for example safe ESLint fixes). It must show a diff and pass the full quality gate before creating an MR.
- Do not deploy, restart production containers, alter production data, or run production migrations from CI.

## Commands

From `running`:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration       # requires disposable DATABASE_URL_TEST
npm run build
npm run test:e2e               # requires a running app and Playwright browser
```

The complete local quality flow is `bash automation/scripts/run-quality.sh`. GitLab uses the same script and stores logs under `artifacts/logs/` plus summaries under `reports/`.
