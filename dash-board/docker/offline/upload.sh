#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
load_offline_config "${2:-}"

BUNDLE=${1:-$(offline_bundle_path)}
[[ -f $BUNDLE && -f $CONFIG_FILE ]] || { echo 'Bundle or config file is missing' >&2; exit 1; }
: "${TARGET_HOST:?Set TARGET_HOST in config (SSH alias or user@host)}"
: "${DEPLOY_ROOT:?Set DEPLOY_ROOT in config}"
[[ $DEPLOY_ROOT == /* && $DEPLOY_ROOT != /absolute/path/to/ax-dstrb-dev ]] || { echo 'Set the actual absolute DEPLOY_ROOT in config' >&2; exit 1; }
PROJECT=${COMPOSE_PROJECT:-docker}
if [[ -n ${JUMP_PASSWORD:-} || -n ${TARGET_PASSWORD:-} ]]; then
  # Native OpenSSH askpass keeps passwords out of command arguments and logs.
  chmod u+x "$OFFLINE_SCRIPT_DIR/askpass.sh"
  export OFFLINE_CONFIG="$CONFIG_FILE"
  export SSH_ASKPASS="$OFFLINE_SCRIPT_DIR/askpass.sh"
  export SSH_ASKPASS_REQUIRE=force
fi
ssh_args=()
scp_args=()
if [[ -n ${JUMP_HOST:-} ]]; then
  ssh_args+=(-J "$JUMP_HOST")
  scp_args+=(-o "ProxyJump=$JUMP_HOST")
fi
if [[ -n ${TARGET_PORT:-} ]]; then
  ssh_args+=(-p "$TARGET_PORT")
  scp_args+=(-P "$TARGET_PORT")
fi
REMOTE_STAGING=$(ssh "${ssh_args[@]}" "$TARGET_HOST" 'umask 077; mktemp -d /tmp/ax-distribution.XXXXXXXX')
[[ $REMOTE_STAGING =~ ^/tmp/ax-distribution\.[a-zA-Z0-9]+$ ]] || { echo 'Unexpected remote staging path' >&2; exit 1; }
scp "${scp_args[@]}" "$BUNDLE" "$TARGET_HOST:$REMOTE_STAGING/bundle.tar.gz"
# Quote every remote argument before SSH passes it through the remote shell.
printf -v remote_command 'bash -c %q -- %q %q %q' \
  'set -e; cd "$1"; tar -xzf bundle.tar.gz; exec bash install.sh "$2" "$3"' \
  "$REMOTE_STAGING" "$DEPLOY_ROOT" "$PROJECT"
ssh -t "${ssh_args[@]}" "$TARGET_HOST" "$remote_command"
echo "Transferred bundle remains at $REMOTE_STAGING (remove after verification)."
