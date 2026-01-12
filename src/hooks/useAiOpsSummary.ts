import useSWR from "swr";
import { fetchJSON } from "@/lib/api/fetcher";
import { AiOpsSummary } from "@/lib/api/internalAiOps";

export function useAiOpsSummary(enabled: boolean) {
  const { data, error, isLoading } = useSWR<AiOpsSummary>(
    enabled ? "/internal/ai/summary" : null,
    fetchJSON,
    {
      refreshInterval: 30_000,
      dedupingInterval: 10_000,
    }
  );

  return {
    data,
    error,
    isLoading,
  };
}
