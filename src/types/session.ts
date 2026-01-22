export type SessionType = 
  | 'easy' 
  | 'workout' 
  | 'long' 
  | 'rest'
  | 'threshold'
  | 'vo2'
  | 'tempo'
  | 'recovery'
  | 'race'
  | 'cross';

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  easy: 'Easy',
  workout: 'Workout',
  long: 'Long',
  rest: 'Rest',
  threshold: 'Threshold',
  vo2: 'VO2',
  tempo: 'Tempo',
  recovery: 'Recovery',
  race: 'Race',
  cross: 'Cross',
};

export const SESSION_TYPES: SessionType[] = [
  'easy',
  'workout',
  'long',
  'rest',
  'threshold',
  'vo2',
  'tempo',
  'recovery',
  'race',
  'cross',
];
