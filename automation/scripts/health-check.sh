#!/usr/bin/env bash
set -Eeuo pipefail
url="${HEALTHCHECK_URL:-http://127.0.0.1:3000/api/health}"
payload="$(curl --fail --silent --show-error --max-time 10 "$url")"
case "$payload" in
  *'"status":"UP"'*) echo "$payload" ;;
  *) echo "Health check did not report UP" >&2; exit 1 ;;
esac
