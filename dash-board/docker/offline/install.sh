#!/usr/bin/env bash
set -Eeuo pipefail

# Run on the target server after extracting the bundle.
BUNDLE_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
DEPLOY_ROOT=${1:?Usage: bash install.sh /absolute/project/path [compose-project]}
PROJECT=${2:-docker}
[[ $DEPLOY_ROOT == /* && $DEPLOY_ROOT != / ]] || { echo 'Use an absolute project directory' >&2; exit 1; }
[[ $PROJECT =~ ^[a-z0-9][a-z0-9_-]*$ ]] || { echo 'Invalid Compose project name' >&2; exit 1; }
ENV_FILE="$DEPLOY_ROOT/.env"
[[ -f $ENV_FILE ]] || { echo "Prepare the server env first: $ENV_FILE" >&2; exit 1; }
cd "$BUNDLE_DIR"
sha256sum -c SHA256SUMS
PLATFORM=$(cat platform.txt)
case "$(uname -m)" in
  x86_64) EXPECTED_PLATFORM=linux/amd64 ;;
  aarch64|arm64) EXPECTED_PLATFORM=linux/arm64 ;;
  *) echo 'Unsupported target architecture' >&2; exit 1 ;;
esac
[[ $PLATFORM == "$EXPECTED_PLATFORM" ]] || { echo "Architecture mismatch: bundle=$PLATFORM server=$EXPECTED_PLATFORM" >&2; exit 1; }
APP_IMAGE=$(cat app-image.txt)
VERSION=${APP_IMAGE##*:}
[[ $APP_IMAGE == ax-distribution-dashboard:* && $VERSION =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]] || { echo 'Invalid image tag' >&2; exit 1; }
RELEASE="$DEPLOY_ROOT/releases/$VERSION"
[[ ! -L $RELEASE && ! -L $RELEASE/source ]] || { echo 'Release/source must not be a symlink' >&2; exit 1; }

docker_cmd=(docker)
if [[ $EUID -ne 0 ]]; then
  # Authenticate interactively; every server Docker command runs through sudo.
  sudo -v
  docker_cmd=(sudo docker)
fi
"${docker_cmd[@]}" compose version
"${docker_cmd[@]}" image load -i "$BUNDLE_DIR/images.tar"
mkdir -p "$RELEASE"
# Same-tag deployments replace only the packaged source, never the server env/DB.
rm -rf "$RELEASE/source"
mkdir -p "$RELEASE/source"
tar -xzf "$BUNDLE_DIR/source.tar.gz" -C "$RELEASE/source"
# Write the validated image tag directly: sudo may discard exported variables.
printf 'services:\n  backend:\n    image: "%s"\n' "$APP_IMAGE" > "$RELEASE/image.yaml"
compose=("${docker_cmd[@]}" compose -p "$PROJECT" --env-file "$ENV_FILE" \
  -f "$RELEASE/source/docker/offline/compose.yaml" -f "$RELEASE/image.yaml")
"${compose[@]}" config --quiet

# Existing database containers and named volumes keep their version and data.
DB_CONTAINER=$("${docker_cmd[@]}" ps -aq \
  --filter "label=com.docker.compose.project=$PROJECT" \
  --filter 'label=com.docker.compose.service=postgres')
if [[ -n $DB_CONTAINER ]]; then
  [[ $DB_CONTAINER != *$'\n'* ]] || { echo 'Multiple postgres containers found; inspect the project name' >&2; exit 1; }
  "${docker_cmd[@]}" network inspect "${PROJECT}_default" >/dev/null
  "${docker_cmd[@]}" start "$DB_CONTAINER" >/dev/null
else
  echo "Existing PostgreSQL container for project '$PROJECT' was not found. Check the project name; this script never creates or upgrades the DB." >&2
  exit 1
fi
# Host Nginx connects directly to the backend. Release its port from any old
# Compose proxy container; never change the host Nginx configuration.
OLD_PROXY_IDS=$("${docker_cmd[@]}" ps -q \
  --filter "label=com.docker.compose.project=$PROJECT" \
  --filter 'label=com.docker.compose.service=proxy')
if [[ -n $OLD_PROXY_IDS ]]; then
  mapfile -t OLD_PROXIES <<< "$OLD_PROXY_IDS"
  "${docker_cmd[@]}" stop "${OLD_PROXIES[@]}"
fi
if ! "${compose[@]}" up -d --no-deps --no-build --pull never \
  --force-recreate --wait --wait-timeout 120 backend; then
  echo 'Deployment failed. Inspect backend logs; the database was retained.' >&2
  "${compose[@]}" ps -a
  exit 1
fi
ln -sfn "$RELEASE" "$DEPLOY_ROOT/current"
"${compose[@]}" ps
echo "Deployment ready: $RELEASE"
echo "Logs: ${docker_cmd[*]} logs -f --tail=100 ${PROJECT}-backend-1"
