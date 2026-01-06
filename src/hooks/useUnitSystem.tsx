import { useQuery } from '@tanstack/react-query';
import { fetchUserProfile } from '@/lib/api';

type UnitSystem = 'imperial' | 'metric';

export function useUnitSystem() {
  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    retry: 1,
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

  return {
    unitSystem,
    isLoading: false, // Always ready since we have a default
    convertDistance,
    convertElevation,
    convertWeight,
    convertHeight,
  };
}

