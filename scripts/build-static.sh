#!/bin/bash
# Static export build (staging/production) wrapper.
#
# Two things make `output: "export"` builds tricky here:
#
# 1. `src/app/api/proxy/[...path]` is a dev-only route handler (CORS proxy to
#    the local backend). Route handlers aren't supported with
#    `output: "export"`, so we temporarily move `src/app/api` out of the way
#    for the duration of the build.
#
# 2. `next build` always sets NODE_ENV=production, so Next's built-in env
#    loader (@next/env) auto-loads `.env.production` if it exists — even when
#    we're building the *staging* bundle via `env-cmd -f .env.staging`.
#    env-cmd sets process.env first and @next/env won't override already-set
#    vars, so values are correct either way, but to avoid any ambiguity we
#    temporarily move aside whichever of .env.staging/.env.production is NOT
#    the target for this build.
#
# All moved files/dirs are restored afterwards, even on failure.
#
# Usage: scripts/build-static.sh <staging|production>
set -e

ENVIRONMENT="$1"
if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: scripts/build-static.sh <staging|production>" >&2
  exit 1
fi

if [ "$ENVIRONMENT" = "staging" ]; then
  OTHER_ENV="production"
elif [ "$ENVIRONMENT" = "production" ]; then
  OTHER_ENV="staging"
else
  echo "Unknown environment: $ENVIRONMENT (expected staging|production)" >&2
  exit 1
fi

API_DIR="src/app/api"
API_BACKUP_DIR=".api-route-backup-tmp"

OTHER_ENV_FILE=".env.$OTHER_ENV"
OTHER_ENV_BACKUP="${OTHER_ENV_FILE}.bak-tmp"

restore() {
  if [ -d "$API_BACKUP_DIR" ]; then
    rm -rf "$API_DIR"
    mv "$API_BACKUP_DIR" "$API_DIR"
  fi
  if [ -f "$OTHER_ENV_BACKUP" ]; then
    mv "$OTHER_ENV_BACKUP" "$OTHER_ENV_FILE"
  fi
}
trap restore EXIT

if [ -d "$API_DIR" ]; then
  rm -rf "$API_BACKUP_DIR"
  mv "$API_DIR" "$API_BACKUP_DIR"
fi

if [ -f "$OTHER_ENV_FILE" ]; then
  mv "$OTHER_ENV_FILE" "$OTHER_ENV_BACKUP"
fi

env-cmd -f ".env.$ENVIRONMENT" next build
