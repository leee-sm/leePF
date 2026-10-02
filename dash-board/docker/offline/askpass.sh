#!/usr/bin/env bash
set +x
set -Eeuo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
load_offline_config
prompt=${1:-}
password=

# Only answer recognized password prompts. Host-key confirmations and key
# passphrases are handled by the user through the terminal.
if [[ ${prompt,,} == *password* ]]; then
  jump_identity=${JUMP_HOST:-}
  jump_identity=${jump_identity%%,*}
  jump_identity=${jump_identity%:*}
  if [[ -n ${JUMP_HOST:-} && $prompt == *"$jump_identity"* ]]; then
    password=${JUMP_PASSWORD:-}
  elif [[ -n ${TARGET_HOST:-} && $prompt == *"$TARGET_HOST"* ]]; then
    password=${TARGET_PASSWORD:-}
  fi
fi
if [[ -n $password ]]; then
  printf '%s\n' "$password"
elif [[ -r /dev/tty && -w /dev/tty ]]; then
  printf '%s ' "$prompt" > /dev/tty
  if [[ ${prompt,,} == *password* || ${prompt,,} == *passphrase* ]]; then
    IFS= read -rs answer < /dev/tty
    printf '\n' > /dev/tty
  else
    IFS= read -r answer < /dev/tty
  fi
  printf '%s\n' "$answer"
else
  echo 'SSH requires manual input for this prompt; run from an interactive terminal.' >&2
  exit 1
fi
