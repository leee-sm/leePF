#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${CI_REPORT_DIR:-$ROOT_DIR/reports}"
LOG_DIR="${CI_ARTIFACT_DIR:-$ROOT_DIR/artifacts}/logs"
mkdir -p "$REPORT_DIR"
classification="UNKNOWN_FAILURE"
if grep -RqiE 'eslint|lint' "$LOG_DIR" 2>/dev/null; then classification="LINT_ERROR"; fi
if grep -RqiE 'type error|vue-tsc|TS[0-9]{4}' "$LOG_DIR" 2>/dev/null; then classification="TYPE_ERROR"; fi
if grep -RqiE 'vitest|test failed|FAIL' "$LOG_DIR" 2>/dev/null; then classification="UNIT_OR_INTEGRATION_FAILURE"; fi
if grep -RqiE 'nuxt build|build error' "$LOG_DIR" 2>/dev/null; then classification="BUILD_FAILURE"; fi
if grep -RqiE 'docker|container' "$LOG_DIR" 2>/dev/null; then classification="DOCKER_FAILURE"; fi
unsafe="false"
if git -C "$ROOT_DIR" diff --name-only --diff-filter=ACM | grep -qE 'prisma/migrations/'; then
  if git -C "$ROOT_DIR" diff -- ':*/prisma/migrations/*' | grep -qiE 'DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM'; then unsafe="true"; fi
fi
cat > "$REPORT_DIR/failure-report.md" <<EOF
# Failure Analysis

- Classification: $classification
- Commit: ${CI_COMMIT_SHA:-local}
- Auto-fix allowed: $([ "$unsafe" = true ] && echo NO || echo LIMITED)

## Policy

AUTO_FIX_SKIPPED is required for destructive database changes, authentication/authorization, secrets, privacy, production configuration, dependency major upgrades, or ambiguous business logic. Otherwise only small mechanical fixes may be attempted on an `auto-fix/*` branch, followed by the complete quality gate.

## Evidence

Logs are available under the `logs/` artifact directory. The original diff and changed-file list must be reviewed with this report.
EOF
printf '%s\n' "$classification" > "$REPORT_DIR/failure-classification.txt"
printf '%s\n' "$unsafe" > "$REPORT_DIR/unsafe-change.txt"
