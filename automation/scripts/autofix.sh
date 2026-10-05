#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MAX_ATTEMPTS="${MAX_AUTO_FIX_ATTEMPTS:-2}"
if [ "${CI_COMMIT_BRANCH:-}" = "main" ] || [ "${CI_COMMIT_BRANCH:-}" = "production" ]; then
  echo "Auto-fix is forbidden on protected branches."; exit 2
fi
if [ "${AUTO_FIX_ENABLED:-false}" != "true" ]; then
  echo "AUTO_FIX_SKIPPED: AUTO_FIX_ENABLED is not true."; exit 0
fi
if [ -f "${CI_REPORT_DIR:-$ROOT_DIR/reports}/unsafe-change.txt" ] && grep -q '^true$' "${CI_REPORT_DIR:-$ROOT_DIR/reports}/unsafe-change.txt"; then
  echo "AUTO_FIX_SKIPPED: destructive database change detected."; exit 0
fi
attempt="${CI_PIPELINE_IID:-$(date +%Y%m%d%H%M%S)}"
branch="auto-fix/${attempt}"
git -C "$ROOT_DIR" switch -c "$branch"

# Deliberately conservative: ESLint's own safe fixer is the only automatic edit.
for ((i=1; i<=MAX_ATTEMPTS; i++)); do
  (cd "$ROOT_DIR/running" && npm run lint -- --fix) || true
  if git -C "$ROOT_DIR" diff --quiet; then
    echo "AUTO_FIX_SKIPPED: no safe mechanical change was produced."; exit 0
  fi
  if (cd "$ROOT_DIR" && RUN_E2E=false bash automation/scripts/run-quality.sh); then
    git -C "$ROOT_DIR" add running automation reports
    git -C "$ROOT_DIR" commit -m "fix: resolve automated quality check failure"
    if [ -n "${CI_PUSH_TOKEN:-}" ] && [ -n "${CI_SERVER_HOST:-}" ]; then
      git -C "$ROOT_DIR" push "https://oauth2:${CI_PUSH_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git" "$branch"
      if [ -n "${GITLAB_API_TOKEN:-}" ] && [ -n "${CI_API_V4_URL:-}" ]; then
        curl --fail --silent --show-error --request POST \
          --header "PRIVATE-TOKEN: ${GITLAB_API_TOKEN}" \
          --data-urlencode "source_branch=${branch}" \
          --data-urlencode "target_branch=${CI_DEFAULT_BRANCH:-main}" \
          --data-urlencode "title=[Auto Fix] Automated quality correction" \
          --data-urlencode "description=See CI artifacts. Human review is required; this job never merges automatically." \
          "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/merge_requests" >/dev/null
      fi
    fi
    echo "AUTO_FIX_SUCCESS: $branch"
    exit 0
  fi
done
echo "AUTO_FIX_SKIPPED: maximum attempts (${MAX_ATTEMPTS}) reached."; exit 1
