#!/bin/bash
# Generate API contract types from OpenAPI spec
# This ensures frontend can only call endpoints that exist in the backend

set -e

API_URL="${VITE_API_URL:-http://localhost:8000}"
OUTPUT_FILE="src/lib/api/generated.ts"

echo "🔍 Fetching OpenAPI spec from ${API_URL}/openapi.json..."

# Fetch OpenAPI spec
curl -s "${API_URL}/openapi.json" > /tmp/openapi.json

if [ ! -s /tmp/openapi.json ]; then
  echo "❌ Failed to fetch OpenAPI spec. Is the backend running?"
  exit 1
fi

echo "✅ OpenAPI spec fetched successfully"
echo "📝 Generating TypeScript types..."

# Generate types
npx openapi-typescript /tmp/openapi.json -o "${OUTPUT_FILE}"

if [ $? -eq 0 ]; then
  echo "✅ Types generated successfully at ${OUTPUT_FILE}"
  echo "📊 Generated types include:"
  echo "   - All endpoint paths"
  echo "   - Request/response types"
  echo "   - Parameter types"
else
  echo "❌ Failed to generate types"
  exit 1
fi
