#!/bin/bash
# EtherDAW Pre-Tool Validation Hook
# Validates EtherScore files before edits

# Read hook input from stdin
INPUT=$(cat)

# Extract tool name and file path from the input
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

# Check if editing an EtherScore file
if [[ "$FILE_PATH" == *.etherscore.json ]]; then
    # For existing files, remind about validation
    if [ -f "$FILE_PATH" ]; then
        echo "Note: Editing EtherScore file. Run validation after changes."
    fi
fi

# Check if editing main branch protected files
CURRENT_BRANCH=$(cd "$PROJECT_ROOT" && git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    # Allow edits but note we're on main
    if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx || "$FILE_PATH" == *.json ]]; then
        echo "Note: Editing on main branch. Consider creating a feature branch for large changes."
    fi
fi

exit 0
