#!/usr/bin/env bash
# Shared local settings. Do not trace configuration reads containing passwords.
set +x
OFFLINE_SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
OFFLINE_ROOT=$(cd "$OFFLINE_SCRIPT_DIR/../.." && pwd)

load_offline_config() {
  CONFIG_FILE=${1:-${OFFLINE_CONFIG:-$OFFLINE_SCRIPT_DIR/deploy.conf}}
  if [[ -f $CONFIG_FILE ]]; then
    CONFIG_FILE=$(cd "$(dirname "$CONFIG_FILE")" && pwd)/$(basename "$CONFIG_FILE")
    source "$CONFIG_FILE"
  fi
  BUILD_VERSION=${BUILD_VERSION:-202610}
  OUTPUT_DIR=${OUTPUT_DIR:-$OFFLINE_ROOT/dist-offline}
  [[ $OUTPUT_DIR == /* ]] || OUTPUT_DIR="$OFFLINE_ROOT/$OUTPUT_DIR"
}

offline_bundle_path() {
  printf '%s/ax-distribution-%s.tar.gz' "$OUTPUT_DIR" "${1:-$BUILD_VERSION}"
}
