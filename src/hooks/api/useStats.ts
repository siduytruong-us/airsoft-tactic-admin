import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { StatsResponse } from "@/types/api";

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () =>
      apiClient
        .get<StatsResponse>("/v1/admin/stats")
        .then((r) => r.data.data), // unwrap ApiResponse<Stats> → Stats
  });
}
