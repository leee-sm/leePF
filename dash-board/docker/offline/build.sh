#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
load_offline_config "${2:-}"

ROOT=$OFFLINE_ROOT
VERSION=${1:-$BUILD_VERSION}
PLATFORM=${PLATFORM:-linux/amd64}
OUTPUT_DIR=${OUTPUT_DIR:-$ROOT/dist-offline}
APP_IMAGE="ax-distribution-dashboard:$VERSION"
[[ $VERSION =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]] || { echo 'Invalid version tag' >&2; exit 1; }
mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR=$(cd "$OUTPUT_DIR" && pwd)
BUNDLE="$OUTPUT_DIR/ax-distribution-$VERSION.tar.gz"
STAGING=$(mktemp -d)
BUNDLE_TEMP=$(mktemp "$OUTPUT_DIR/.ax-distribution-$VERSION.XXXXXXXX")
trap 'rm -rf "$STAGING"; rm -f "$BUNDLE_TEMP"' EXIT

docker_cmd=(docker)
if ! docker info >/dev/null 2>&1; then
  sudo -v
  docker_cmd=(sudo docker)
fi

build_args=(--platform "$PLATFORM" -t "$APP_IMAGE" -f "$ROOT/Dockerfile")
if [[ -n ${BUILD_CA_CERT_FILE:-} ]]; then
  [[ -f $BUILD_CA_CERT_FILE ]] || { echo 'BUILD_CA_CERT_FILE does not exist' >&2; exit 1; }
  build_args+=(--secret "id=corporate-ca,src=$BUILD_CA_CERT_FILE")
fi
"${docker_cmd[@]}" build "${build_args[@]}" "$ROOT"
"${docker_cmd[@]}" image save -o "$STAGING/images.tar" "$APP_IMAGE"

# Explicit source paths exclude local env, keys, Git metadata and dependency caches.
tar -czf "$STAGING/source.tar.gz" -C "$ROOT" \
  --exclude='.env' --exclude='.env.*' --exclude='*.pem' --exclude='*.key' \
  --exclude='.venv' --exclude='node_modules' --exclude='__pycache__' \
  --exclude='*.pyc' --exclude='poc.db' --exclude='dist' \
  --exclude='test-results' --exclude='playwright-report' \
  --exclude='docker/nginx' \
  --exclude='docker/offline/*.conf' \
  Dockerfile .dockerignore README.md backend frontend data docker
printf '%s\n' "$APP_IMAGE" > "$STAGING/app-image.txt"
printf '%s\n' "$PLATFORM" > "$STAGING/platform.txt"
cp "$ROOT/docker/offline/install.sh" "$STAGING/install.sh"
(cd "$STAGING" && sha256sum images.tar source.tar.gz app-image.txt platform.txt install.sh > SHA256SUMS)
tar -czf "$BUNDLE_TEMP" -C "$STAGING" .
# Replace the old bundle only once the new build and archive have succeeded.
mv -f "$BUNDLE_TEMP" "$BUNDLE"
echo "Bundle ready: $BUNDLE"
