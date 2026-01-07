/**
 * Centralized query keys for consistent caching and deduplication
 * Using hierarchical keys allows React Query to share cache across components
 */

export const queryKeys = {
  // Activities - use limit/offset in params, not in key to share cache
  activities: (params?: { limit?: number; offset?: number }) => {
    const key: unknown[] = ['activities'];
    if (params?.limit) key.push('limit', params.limit);
    if (params?.offset) key.push('offset', params.offset);
    return key;
  },
  
  // Calendar
  calendarWeek: (weekStart: string) => ['calendar', 'week', weekStart],
  calendarToday: () => ['calendar', 'today'],
  calendarSeason: () => ['calendar', 'season'],
  calendarSessions: (params?: { limit?: number; offset?: number }) => {
    const key: unknown[] = ['calendar', 'sessions'];
    if (params?.limit) key.push(params.limit);
    if (params?.offset) key.push(params.offset);
    return key;
  },
  
  // Training Data
  overview: (days?: number) => ['overview', days || 7],
  trainingLoad: (days?: number) => ['trainingLoad', days || 60],
  trainingState: () => ['training', 'state'],
  trainingDistribution: (period?: string) => ['training', 'distribution', period || 'week'],
  trainingSignals: () => ['training', 'signals'],
  
  // Intelligence (expensive LLM calls - cache longer)
  intelligenceToday: (date?: string) => ['intelligence', 'today', date || 'current'],
  intelligenceWeek: (weekStart?: string) => ['intelligence', 'week', weekStart || 'current'],
  intelligenceSeason: () => ['intelligence', 'season'],
  
  // Coach (expensive LLM calls - cache longer)
  coachSummary: () => ['coach', 'summary'],
  coachState: () => ['coach', 'state'],
  coachObservations: () => ['coach', 'observations'],
  coachRecommendations: () => ['coach', 'recommendations'],
  coachConfidence: () => ['coach', 'confidence'],
  
  // Profile & Settings
  userProfile: () => ['user', 'profile'],
  userStatus: () => ['user', 'status'],
  
  // Strava
  stravaStatus: () => ['strava', 'status'],
  stravaSyncProgress: () => ['strava', 'sync-progress'],
  
  // Activity Streams (per activity)
  activityStreams: (activityId: string) => ['activity', activityId, 'streams'],
  
  // Analytics
  analyticsMetrics: (days?: number) => ['analytics', 'metrics', days || 60],
} as const;

/**
 * Cache time presets for different data types
 */
export const cacheTimes = {
  // Expensive LLM calls - cache for 1 hour, stale after 30 minutes
  intelligence: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  
  // Coach endpoints - cache for 1 hour, stale after 30 minutes
  coach: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  
  // Recent/active data - cache for 5 minutes, stale after 1 minute
  recent: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Standard data - cache for 30 minutes, stale after 5 minutes
  standard: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // Static/semi-static data - cache for 1 hour, stale after 15 minutes
  static: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
} as const;

