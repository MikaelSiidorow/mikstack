#!/usr/bin/env bash
set -euo pipefail

# Local scaffold test — mirrors the CI workflow
# Usage: ./scripts/test-scaffold.sh [pm] [output-dir]
#   pm: npm | pnpm | bun (default: npm)
#   output-dir: where to scaffold (default: /tmp/mikstack-test)

PM="${1:-npm}"
OUTPUT="${2:-/tmp/mikstack-test}"
MONOREPO="$(cd "$(dirname "$0")/../../.." && pwd)"

echo "==> Building @mikstack/* packages..."
bun run --filter '@mikstack/*' build 2>&1 || true

echo "==> Building create-mikstack..."
bun run --filter create-mikstack build

echo "==> Cleaning $OUTPUT..."
rm -rf "$OUTPUT"

echo "==> Scaffolding with $PM..."
npm_config_user_agent="$PM/1.0.0" node "$MONOREPO/packages/create-mikstack/dist/index.js" "$OUTPUT" --yes

TARBALLS_DIR="/tmp/mikstack-tarballs"
rm -rf "$TARBALLS_DIR"
mkdir -p "$TARBALLS_DIR"

echo "==> Packing @mikstack/* packages and patching deps..."
node -e "
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const tarballsDir = '$TARBALLS_DIR';
const pkgsDir = path.join('$MONOREPO', 'packages');
const patches = {};
for (const dir of fs.readdirSync(pkgsDir)) {
  const pkgJsonPath = path.join(pkgsDir, dir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  if (pkg.name && pkg.name.startsWith('@mikstack/')) {
    const pkgDir = path.join(pkgsDir, dir);
    const output = execSync('npm pack --pack-destination ' + tarballsDir, { cwd: pkgDir, encoding: 'utf-8' });
    const tarball = output.trim().split('\\n').pop();
    patches[pkg.name] = 'file:' + path.join(tarballsDir, tarball);
  }
}

const targetPkgPath = path.join('$OUTPUT', 'package.json');
const targetPkg = JSON.parse(fs.readFileSync(targetPkgPath, 'utf-8'));
for (const [name, ref] of Object.entries(patches)) {
  if (targetPkg.dependencies?.[name]) targetPkg.dependencies[name] = ref;
  if (targetPkg.devDependencies?.[name]) targetPkg.devDependencies[name] = ref;
}
fs.writeFileSync(targetPkgPath, JSON.stringify(targetPkg, null, 2) + '\n');
console.log('Patched:', Object.keys(patches).join(', '));
"

echo "==> Installing dependencies with $PM..."
(cd "$OUTPUT" && "$PM" install)

echo "==> Running format..."
(cd "$OUTPUT" && "$PM" run format)

echo "==> Running lint..."
(cd "$OUTPUT" && "$PM" run lint)

echo "==> Running format:check..."
(cd "$OUTPUT" && "$PM" run format:check)

echo "==> Running check..."
(cd "$OUTPUT" && "$PM" run check)

echo "==> Running build..."
(cd "$OUTPUT" && "$PM" run build)

echo "==> Running i18n:extract (if available)..."
(cd "$OUTPUT" && "$PM" run i18n:extract 2>/dev/null) || true

echo "==> Checking for unexpected diffs..."
(cd "$OUTPUT" && git diff --exit-code -- ':!package.json')

echo ""
echo "All checks passed for $PM scaffold at $OUTPUT"
