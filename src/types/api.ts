/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is generated from the backend OpenAPI schema.
 * To regenerate:
 *   npm run generate-types
 * 
 * Or for production:
 *   VITE_API_URL=https://your-backend.com npm run generate-types:prod
 * 
 * If this file is empty or shows errors, run the generation command.
 */

// Placeholder types until 'npm run generate-types' is run.
// Using 'any' to avoid strict type checking issues with API responses.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

export interface paths {
  "/me": {
    get: { responses: { 200: { content: { "application/json": ApiResponse } } } };
  };
  "/me/profile": {
    get: { responses: { 200: { content: { "application/json": ApiResponse } } } };
    put: { responses: { 200: { content: { "application/json": ApiResponse } } } };
  };
  "/me/training-preferences": {
    get: { responses: { 200: { content: { "application/json": ApiResponse } } } };
    put: { responses: { 200: { content: { "application/json": ApiResponse } } } };
  };
  "/me/status": {
    get: { responses: { 200: { content: { "application/json": ApiResponse } } } };
  };
  "/me/sync/history": {
    post: { responses: { 200: { content: { "application/json": ApiResponse } } } };
  };
  "/me/sync/check": {
    post: { responses: { 200: { content: { "application/json": ApiResponse } } } };
  };
  "/me/sync/now": {
    post: { responses: { 200: { content: { "application/json": ApiResponse } } } };
  };
  "/activities": {
    get: { responses: { 200: { content: { "application/json": ApiResponse } } } };
  };
  "/activities/{id}": {
    get: { responses: { 200: { content: { "application/json": ApiResponse } } } };
  };
  "/calendar/today": {
    get: { responses: { 200: { content: { "application/json": ApiResponse } } } };
  };
  "/calendar/week": {
    get: { responses: { 200: { content: { "application/json": ApiResponse } } } };
  };
  "/calendar/season": {
    get: { responses: { 200: { content: { "application/json": ApiResponse } } } };
  };
}

