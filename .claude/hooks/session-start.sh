#!/bin/bash
# EtherDAW Session Start Hook
# Provides helpful context when starting a new Claude Code session

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== EtherDAW Session Started ==="
echo ""

# Show recent test status
if [ -f "node_modules/.vitest/results.json" ]; then
    echo "Recent test results available"
else
    echo "Tests: Run 'npm test' to verify"
fi

# Check for uncommitted changes
CHANGES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$CHANGES" != "0" ]; then
    echo "Git: $CHANGES uncommitted changes"
else
    echo "Git: Working tree clean"
fi

# Check build status
if [ -f "dist/etherdaw-browser.js" ]; then
    BUILD_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "dist/etherdaw-browser.js" 2>/dev/null || stat -c "%y" "dist/etherdaw-browser.js" 2>/dev/null | cut -d'.' -f1)
    echo "Browser build: $BUILD_TIME"
else
    echo "Browser build: Not built yet - run 'npm run build:browser'"
fi

echo ""
echo "Quick commands:"
echo "  /verify  - Verify task completion with evidence"
echo "  /compose - Create a new composition"
echo "  /plan    - Plan complex tasks before implementing"
echo ""
