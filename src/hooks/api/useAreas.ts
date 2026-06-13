import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type {
  AreaListResponse,
  AreaResponse,
  CreateAreaRequest,
  UpdateAreaRequest,
} from "@/types/api";

const areaKeys = {
  all: (matchId: string) => ["areas", matchId] as const,
  detail: (matchId: string, areaId: string) =>
    ["areas", matchId, areaId] as const,
};

export function useAreas(matchId: string) {
  return useQuery({
    queryKey: areaKeys.all(matchId),
    queryFn: () =>
      apiClient
        .get<AreaListResponse>(`/v1/matches/${matchId}/areas`)
        .then((r) => r.data.data),
    enabled: !!matchId,
  });
}

export function useCreateArea(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAreaRequest) =>
      apiClient
        .post<AreaResponse>(`/v1/matches/${matchId}/areas`, payload)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: areaKeys.all(matchId) }),
  });
}

export function useUpdateArea(matchId: string, areaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAreaRequest) =>
      apiClient
        .put<AreaResponse>(`/v1/matches/${matchId}/areas/${areaId}`, payload)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: areaKeys.all(matchId) }),
  });
}

export function useDeleteArea(matchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (areaId: string) =>
      apiClient
        .delete(`/v1/matches/${matchId}/areas/${areaId}`)
        .then(() => areaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: areaKeys.all(matchId) }),
  });
}
