import { useQuery } from '@tanstack/react-query';
import { fetchUserProfile } from '@/lib/api';

type UnitSystem = 'imperial' | 'metric';

export function useUnitSystem() {
  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    retry: (failureCount, error) => {
      // Don't retry on CORS errors - they won't resolve with retries
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_NETWORK') {
        return false;
      }
      // Retry once for other errors
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const unitSystem: UnitSystem = (profile as { unitSystem?: UnitSystem })?.unitSystem || 'imperial';

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

