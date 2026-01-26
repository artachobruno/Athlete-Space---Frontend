#!/bin/bash
# Check for hardcoded API paths in the codebase
# This script can be run in CI to prevent hardcoded paths

set -e

echo "🔍 Checking for hardcoded API paths..."

# Patterns to check for
PATTERNS=(
  'api\.(get|post|put|delete|patch)\(["\x27]/'
  'api\.(get|post|put|delete|patch)\(`/'
  'fetch\(["\x27]/'
  'axios\.(get|post|put|delete|patch)\(["\x27]/'
)

# Directories to check (exclude node_modules, dist, etc.)
SEARCH_DIRS=("src" "components")

# Files to exclude
EXCLUDE_PATTERNS=(
  "src/lib/api/typedClient.ts"
  "src/lib/api/generated.ts"
  "src/lib/api.ts"  # Base API client is allowed
  "*.test.ts"
  "*.test.tsx"
  "*.spec.ts"
  "*.spec.tsx"
)

# Known remaining hardcoded paths (whitelist - to be migrated incrementally)
# These are documented in API_MIGRATION_CHECKLIST.md
WHITELIST_PATTERNS=(
  "/intelligence/"  # Intelligence API - TASK-INTELLIGENCE-API
  "/planner/"       # Planner API - TASK-PLANNER-API
  "/workouts/"      # Workouts API - TASK-WORKOUTS-API
  "/coach/athletes" # Coach dashboard - TASK-COACH-ADMIN-API
  "/users/me"       # Users API - TASK-COACH-ADMIN-API
)

ERRORS=0

for pattern in "${PATTERNS[@]}"; do
  echo "  Checking pattern: ${pattern}"
  
  # Build find command with exclusions
  FIND_CMD="find"
  for dir in "${SEARCH_DIRS[@]}"; do
    if [ -d "$dir" ]; then
      FIND_CMD="$FIND_CMD $dir"
    fi
  done
  
  # Search for matches
  while IFS= read -r file; do
    # Check if file should be excluded
    EXCLUDED=false
    for exclude in "${EXCLUDE_PATTERNS[@]}"; do
      if [[ "$file" == *"$exclude"* ]]; then
        EXCLUDED=true
        break
      fi
    done
    
    if [ "$EXCLUDED" = false ]; then
      # Check if file contains the pattern
      if grep -qE "$pattern" "$file" 2>/dev/null; then
        # Check each matched line individually
        while IFS= read -r matched_line; do
          # Check if this specific line matches a whitelisted pattern
          WHITELISTED=false
          for whitelist in "${WHITELIST_PATTERNS[@]}"; do
            if echo "$matched_line" | grep -q "$whitelist"; then
              WHITELISTED=true
              break
            fi
          done
          
          if [ "$WHITELISTED" = false ]; then
            echo "  ❌ Found hardcoded API path in: $file"
            echo "     $matched_line"
            ERRORS=$((ERRORS + 1))
          else
            echo "  ⚠️  Found whitelisted API path in: $file (known, to be migrated)"
            echo "     $matched_line"
          fi
        done < <(grep -nE "$pattern" "$file" 2>/dev/null)
      fi
    fi
  done < <(find "${SEARCH_DIRS[@]}" -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null)
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ Found $ERRORS file(s) with hardcoded API paths"
  echo "   Please use typed API client from '@/lib/api/typedClient' instead"
  exit 1
else
  echo "✅ No hardcoded API paths found"
  exit 0
fi
