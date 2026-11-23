#!/usr/bin/env bash
# Puts Bookly back exactly where every demo take starts.
#
#   scripts/demo-reset.sh          code only
#   scripts/demo-reset.sh --db     code, plus a fresh local database (migrations + seed)
#
# What it does not touch: node_modules, .env.local, and Grace's memory of this
# project (the recorded decision stays). Grace's guardian keeps its per-session
# state (files changed and not yet reviewed) per Claude Code session, so starting
# a new `claude` session after the reset is enough to start clean on that side.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if ! git rev-parse -q --verify refs/tags/demo-start >/dev/null; then
  echo "No demo-start tag here: is this the Bookly demo repository?" >&2
  exit 1
fi

git checkout -q demo/guardian-moment
git reset -q --hard demo-start
# Untracked files a take may leave behind (a new route, a new test), but not the
# ignored ones: node_modules, .env.local and .next stay.
git clean -q -fd

if [[ "${1:-}" == "--db" ]]; then
  npx -y supabase@3.0.0 db reset
fi

echo "Bookly is back at demo-start ($(git rev-parse --short HEAD))."
pnpm -s test >/dev/null 2>&1 && echo "The test suite is green, as it should be before a take." || echo "Warning: the test suite fails before the take." >&2
