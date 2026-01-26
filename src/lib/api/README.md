# API Contract Enforcement

This directory contains the typed API client that enforces the contract between frontend and backend.

## Core Principle

> **If it's not in OpenAPI, the frontend may not call it.**

## Structure

- `typedClient.ts` - Type-safe API client wrappers
- `generated.ts` - Auto-generated types from OpenAPI (run `npm run generate-api-contract`)
- `coach.ts` - Domain-specific API functions (uses typedClient)

## Usage

### ✅ Correct: Use typed client

```ts
import { conversationsApi } from '@/lib/api/typedClient';

const messages = await conversationsApi.getMessages(conversationId);
const progress = await conversationsApi.getProgress(conversationId);
```

### ❌ Wrong: Hardcoded paths

```ts
// This will fail ESLint check
const response = await api.get(`/conversations/${id}/messages`);
```

## Generating Types

1. Start your backend: `cd ../Athlete-Space---Backend && uvicorn app.main:app --reload`
2. Generate types: `npm run generate-api-contract`
3. Types will be generated at `src/lib/api/generated.ts`

## Adding New Endpoints

1. Add endpoint to backend (FastAPI route)
2. Run `npm run generate-api-contract` to update types
3. Add wrapper function to `typedClient.ts`
4. Use wrapper in your code

## ESLint Rules

The ESLint config prevents hardcoded API paths. If you see:

```
Hardcoded API paths are not allowed. Use typed API client from '@/lib/api/typedClient' instead.
```

You need to:
1. Add the endpoint to `typedClient.ts`
2. Use the typed client instead of direct `api.get()` calls
