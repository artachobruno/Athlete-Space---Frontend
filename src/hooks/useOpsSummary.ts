import useSWR from 'swr';
import { fetchJSON } from '@/lib/api/fetcher';
import type { OpsSummary } from '@/lib/api/internalOps';

export function useOpsSummary(enabled: boolean) {
  return useSWR<OpsSummary>(
    enabled ? '/internal/ops/summary' : null,
    fetchJSON,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
    }
  );
}
