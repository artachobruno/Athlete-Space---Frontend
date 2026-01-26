/**
 * ESLint rule to prevent hardcoded API paths
 * 
 * This rule checks for common patterns of hardcoded API paths:
 * - api.get("/path")
 * - api.post("/path")
 * - Template literals with "/" prefix
 * 
 * Usage: Add to your main eslint config or run separately
 */

module.exports = {
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        // Match: api.get("/path") or api.post("/path")
        selector: "CallExpression[callee.property.name=/^(get|post|put|delete|patch)$/] > Literal[value=/^\\//]",
        message: "Hardcoded API paths are not allowed. Use typed API client from '@/lib/api/typedClient' instead.",
      },
      {
        // Match: api.get(`/path/${var}`)
        selector: "CallExpression[callee.property.name=/^(get|post|put|delete|patch)$/] > TemplateLiteral[expressions.length>0] > TemplateElement[value.raw=/^\\//]",
        message: "Hardcoded API paths in template literals are not allowed. Use typed API client from '@/lib/api/typedClient' instead.",
      },
    ],
  },
};
