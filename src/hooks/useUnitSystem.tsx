import { useAuth } from '@/context/AuthContext';

type UnitSystem = 'imperial' | 'metric';

/**
 * Hook to get unit system from user profile.
 * Uses AuthContext as single source of truth - no duplicate API calls.
 */
export function useUnitSystem() {
  const { user } = useAuth();

  // Get unit system from AuthContext (user comes from /me endpoint)
  // Default to 'imperial' if not set
  const unitSystem: UnitSystem = (user as { unitSystem?: UnitSystem })?.unitSystem || 'imperial';

  const convertDistance = (km: number): { value: number; unit: string } => {
    if (unitSystem === 'imperial') {
      return {
        value: Math.round((km * 0.621371) * 10) / 10, // Convert to miles, round to 1 decimal
        unit: 'mi',
      };
    }
    return {
      value: Math.round(km * 10) / 10, // Round to 1 decimal
      unit: 'km',
    };
  };

  const convertElevation = (meters: number): { value: number; unit: string } => {
    if (unitSystem === 'imperial') {
      return {
        value: Math.round((meters * 3.28084) * 10) / 10, // Convert to feet, round to 1 decimal
        unit: 'ft',
      };
    }
    return {
      value: Math.round(meters * 10) / 10, // Round to 1 decimal
      unit: 'm',
    };
  };

  const convertWeight = (kg: number): { value: number; unit: string } => {
    if (unitSystem === 'imperial') {
      return {
        value: Math.round((kg * 2.20462) * 10) / 10, // Convert to lbs, round to 1 decimal
        unit: 'lbs',
      };
    }
    return {
      value: Math.round(kg * 10) / 10, // Round to 1 decimal
      unit: 'kg',
    };
  };

  const convertHeight = (cm: number): { value: number; unit: string } => {
    if (unitSystem === 'imperial') {
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return {
        value: parseFloat(`${feet}.${inches}`),
        unit: 'ft',
      };
    }
    return {
      value: Math.round(cm),
      unit: 'cm',
    };
  };

  const convertPace = (minPerKm: number): { value: number; unit: string } => {
    if (unitSystem === 'imperial') {
      // Convert min/km to min/mile: multiply by 1.60934
      return {
        value: Math.round(minPerKm * 1.60934 * 100) / 100, // Round to 2 decimals
        unit: 'min/mi',
      };
    }
    return {
      value: Math.round(minPerKm * 100) / 100, // Round to 2 decimals
      unit: 'min/km',
    };
  };

  return {
    unitSystem,
    isLoading: false, // Always ready since we have a default
    convertDistance,
    convertElevation,
    convertWeight,
    convertHeight,
    convertPace,
  };
}

