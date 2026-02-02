#!/usr/bin/env bash
set -euo pipefail

# Syncs components from packages/ui/src/lib/ into templates/ui-vendor/
# Run from the monorepo root or from packages/create-mikstack/

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CREATE_PKG="$(cd "$SCRIPT_DIR/.." && pwd)"
MONOREPO="$(cd "$SCRIPT_DIR/../../.." && pwd)"

SRC="$MONOREPO/packages/ui/src/lib"
DEST="$CREATE_PKG/templates/ui-vendor/src/lib/components/ui"

if [ ! -d "$SRC" ]; then
  echo "Error: source not found at $SRC"
  exit 1
fi

echo "Syncing UI components..."
echo "  from: $SRC"
echo "  to:   $DEST"

rm -rf "$DEST"
mkdir -p "$DEST"
cp -r "$SRC"/* "$DEST"/

echo "Synced $(ls -1 "$DEST" | wc -l) components."
