#!/usr/bin/env bash
# Sync non-empty vars from .env.local to Vercel production (never prints values).
set -euo pipefail
ENV_FILE="${1:-.env.local}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "No $ENV_FILE — skipping Vercel env sync"
  exit 0
fi
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" ]] && continue
  [[ "$line" != *=* ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  key="$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  val="$(echo "$val" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/")"
  [[ -z "$val" ]] && continue
  printf '%s' "$val" | vercel env add "$key" production --force --yes 2>/dev/null || \
    printf '%s' "$val" | vercel env add "$key" production --force 2>/dev/null || true
  echo "Synced: $key"
done < "$ENV_FILE"
