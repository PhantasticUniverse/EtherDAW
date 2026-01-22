#!/bin/bash
# EtherDAW Post-Tool Hook
# Auto-validates EtherScore files after edits

# Read hook input from stdin
INPUT=$(cat)

# Extract tool name and file path
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Only check Edit and Write operations
if [[ "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "Write" ]]; then
    exit 0
fi

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Auto-validate EtherScore files
if [[ "$FILE_PATH" == *.etherscore.json ]]; then
    if [ -f "$FILE_PATH" ]; then
        # Run validation
        RESULT=$(npx tsx src/cli.ts validate "$FILE_PATH" 2>&1)
        if [ $? -eq 0 ]; then
            echo "EtherScore validation: PASSED"
        else
            echo "EtherScore validation: ISSUES FOUND"
            echo "$RESULT"
        fi
    fi
fi

# Report TypeScript file changes (don't auto-format, just note)
if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx ]]; then
    echo "TypeScript file modified. Consider running 'npm run build' to check for errors."
fi

exit 0
