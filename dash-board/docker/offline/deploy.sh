#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
load_offline_config "${2:-}"

SCRIPT_DIR=$OFFLINE_SCRIPT_DIR
VERSION=${1:-$BUILD_VERSION}
[[ -f $CONFIG_FILE ]] || { echo "Deployment config missing: $CONFIG_FILE" >&2; exit 1; }
export OUTPUT_DIR

echo "Building release: $VERSION"
bash "$SCRIPT_DIR/build.sh" "$VERSION" "$CONFIG_FILE"
echo 'Uploading and installing through the jump server (enter SSH/sudo passwords when prompted).'
bash "$SCRIPT_DIR/upload.sh" "$(offline_bundle_path "$VERSION")" "$CONFIG_FILE"
echo "Deployment complete: $VERSION"
