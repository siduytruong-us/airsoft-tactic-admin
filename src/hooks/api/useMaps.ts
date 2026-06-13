import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type {
  MapTemplateListResponse,
  MapTemplateResponse,
  CreateMapDto,
  UpdateMapDto,
  MapArea,
  CreateMapAreaDto,
  UpdateMapAreaDto,
} from "@/types/api";
import type { ApiResponse } from "@/types/api";

// ─── Query Keys ───────────────────────────────────────────────────────────────

const mapKeys = {
  byField: (fieldId: string) => ["maps", "field", fieldId] as const,
  detail: (mapId: string) => ["maps", mapId] as const,
  areas: (mapId: string) => ["mapAreas", mapId] as const,
};

// ─── Map CRUD ─────────────────────────────────────────────────────────────────

export function useMapsByField(fieldId: string) {
  return useQuery({
    queryKey: mapKeys.byField(fieldId),
    queryFn: () =>
      apiClient
        .get<MapTemplateListResponse>(`/v1/admin/fields/${fieldId}/maps`)
        .then((r) => r.data.data ?? []),
    enabled: !!fieldId,
  });
}

export function useMap(mapId: string) {
  return useQuery({
    queryKey: mapKeys.detail(mapId),
    queryFn: () =>
      apiClient
        .get<MapTemplateResponse>(`/v1/admin/maps/${mapId}`)
        .then((r) => r.data.data),
    enabled: !!mapId,
  });
}

export function useCreateMap(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMapDto) =>
      apiClient
        .post<MapTemplateResponse>(`/v1/admin/fields/${fieldId}/maps`, dto)
        .then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: mapKeys.byField(fieldId) }),
  });
}

export function useUpdateMap(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mapId, dto }: { mapId: string; dto: UpdateMapDto }) =>
      apiClient
        .put<MapTemplateResponse>(`/v1/admin/maps/${mapId}`, dto)
        .then((r) => r.data.data),
    onSuccess: (_data, { mapId }) => {
      qc.invalidateQueries({ queryKey: mapKeys.byField(fieldId) });
      qc.invalidateQueries({ queryKey: mapKeys.detail(mapId) });
    },
  });
}

export function useUploadMapCoverImage(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mapId, file }: { mapId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient
        .post<{ coverImageUrl: string }>(
          `/v1/admin/maps/${mapId}/cover-image`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        )
        .then((r) => r.data.coverImageUrl);
    },
    onSuccess: (_data, { mapId }) => {
      qc.invalidateQueries({ queryKey: mapKeys.byField(fieldId) });
      qc.invalidateQueries({ queryKey: mapKeys.detail(mapId) });
    },
  });
}

export function useDeleteMap(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mapId: string) =>
      apiClient.delete(`/v1/admin/maps/${mapId}`).then(() => mapId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: mapKeys.byField(fieldId) }),
  });
}

// ─── Map Area CRUD ────────────────────────────────────────────────────────────

export function useMapAreas(mapId: string) {
  return useQuery({
    queryKey: mapKeys.areas(mapId),
    queryFn: () =>
      apiClient
        .get<ApiResponse<MapArea[]>>(`/v1/admin/maps/${mapId}/areas`)
        .then((r) => r.data.data ?? []),
    enabled: !!mapId,
  });
}

export function useCreateMapArea(mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMapAreaDto) =>
      apiClient
        .post<ApiResponse<MapArea>>(`/v1/admin/maps/${mapId}/areas`, dto)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: mapKeys.areas(mapId) }),
  });
}

export function useUpdateMapArea(mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ areaId, dto }: { areaId: string; dto: UpdateMapAreaDto }) =>
      apiClient
        .put<
          ApiResponse<MapArea>
        >(`/v1/admin/maps/${mapId}/areas/${areaId}`, dto)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: mapKeys.areas(mapId) }),
  });
}

export function useDeleteMapArea(mapId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (areaId: string) =>
      apiClient
        .delete(`/v1/admin/maps/${mapId}/areas/${areaId}`)
        .then(() => areaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: mapKeys.areas(mapId) }),
  });
}
