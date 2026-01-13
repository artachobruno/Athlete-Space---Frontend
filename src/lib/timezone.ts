/**
 * Timezone utilities for detecting and syncing user timezone
 */

/**
 * Detects the user's local timezone using the browser's Intl API.
 * Returns an IANA timezone string (e.g., "America/Chicago", "Europe/London").
 * Falls back to "UTC" if detection fails.
 */
export function detectTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone && typeof timezone === 'string') {
      return timezone;
    }
  } catch (error) {
    console.warn("[Timezone] Failed to detect timezone:", error);
  }
  return "UTC";
}

/**
 * Validates that a timezone string is a valid IANA timezone identifier.
 * Note: This is a basic validation. Full validation should be done on the backend.
 */
export function isValidTimezone(timezone: string): boolean {
  if (!timezone || typeof timezone !== 'string') {
    return false;
  }
  
  // Basic validation: IANA timezones are typically in format "Area/Location"
  // or "UTC" or "GMT"
  if (timezone === 'UTC' || timezone === 'GMT') {
    return true;
  }
  
  // Check if it contains a slash (most IANA timezones do)
  if (timezone.includes('/')) {
    return true;
  }
  
  // Some timezones don't have slashes (e.g., "UTC", "GMT", "Etc/GMT+5")
  // For now, accept any non-empty string and let backend validate
  return timezone.trim().length > 0;
}
