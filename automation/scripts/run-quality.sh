#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUNNING_DIR="$ROOT_DIR/running"
ARTIFACT_DIR="${CI_ARTIFACT_DIR:-$ROOT_DIR/artifacts}"
LOG_DIR="$ARTIFACT_DIR/logs"
REPORT_DIR="${CI_REPORT_DIR:-$ROOT_DIR/reports}"
mkdir -p "$LOG_DIR" "$REPORT_DIR"
RESULTS_FILE="$REPORT_DIR/results.tsv"
: > "$RESULTS_FILE"
overall=0

run_step() {
  local name="$1"; shift
  local log="$LOG_DIR/$name.log"
  echo "[$name] $*" | tee "$log"
  set +e
  (cd "$RUNNING_DIR" && "$@") >>"$log" 2>&1
  local code=$?
  set -e
  if [ "$code" -eq 0 ]; then
    printf '%s\tPASS\n' "$name" >>"$RESULTS_FILE"
  else
    printf '%s\tFAIL\n' "$name" >>"$RESULTS_FILE"
    overall=1
  fi
}

run_step lint npm run lint
run_step typecheck npm run typecheck
run_step unit npm run test:unit
if [ -n "${DATABASE_URL_TEST:-}" ]; then
  run_step integration npm run test:integration
else
  printf 'integration\tSKIP\n' >>"$RESULTS_FILE"
  echo "DATABASE_URL_TEST is not set; integration tests were skipped." >"$LOG_DIR/integration.log"
fi
run_step build npm run build
if [ "${RUN_E2E:-false}" = "true" ]; then
  run_step e2e npm run test:e2e
else
  printf 'e2e\tSKIP\n' >>"$RESULTS_FILE"
  echo "RUN_E2E=true is required; E2E tests were skipped." >"$LOG_DIR/e2e.log"
fi
run_step dependency-audit npm audit --audit-level=high --omit=dev
node "$ROOT_DIR/automation/scripts/write-report.mjs" "$RESULTS_FILE" "$REPORT_DIR/ci-summary.md" "$REPORT_DIR/ci-summary.json" || overall=1
exit "$overall"
