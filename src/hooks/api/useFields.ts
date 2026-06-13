import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type {
  FieldListResponse,
  FieldResponse,
  CreateFieldDto,
  UpdateFieldDto,
  GameModeResponse,
  CreateGameModeDto,
  UpdateGameModeDto,
  MatchListResponse,
  MatchResponse,
  CreateMatchDto,
  EndMatchDto,
  UpdateMatchDto,
} from "@/types/api";

// ─── Fields ───────────────────────────────────────────────────────────────────

export function useFields(page = 0, size = 20) {
  return useQuery({
    queryKey: ["fields", page, size],
    queryFn: () =>
      apiClient
        .get<FieldListResponse>(`/v1/fields?page=${page}&size=${size}`)
        .then((r) => r.data),
  });
}

export function useField(fieldId: string) {
  return useQuery({
    queryKey: ["fields", fieldId],
    queryFn: () =>
      apiClient
        .get<FieldResponse>(`/v1/fields/${fieldId}`)
        .then((r) => r.data.data),
    enabled: !!fieldId,
  });
}

export function useCreateField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFieldDto) =>
      apiClient.post<FieldResponse>("/v1/admin/fields", dto).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fields"] }),
  });
}

export function useUploadFieldCoverImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fieldId, file }: { fieldId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient
        .post<{ coverImageUrl: string }>(`/v1/admin/fields/${fieldId}/cover-image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data.coverImageUrl);
    },
    onSuccess: (_data, { fieldId }) => {
      qc.invalidateQueries({ queryKey: ["fields"] });
      qc.invalidateQueries({ queryKey: ["fields", fieldId] });
    },
  });
}

export function useUpdateField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateFieldDto }) =>
      apiClient
        .put<FieldResponse>(`/v1/admin/fields/${id}`, dto)
        .then((r) => r.data.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["fields"] });
      qc.invalidateQueries({ queryKey: ["fields", id] });
    },
  });
}

export function useDeleteField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fieldId: string) =>
      apiClient.delete(`/v1/admin/fields/${fieldId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fields"] }),
  });
}

// ─── Game Modes ───────────────────────────────────────────────────────────────

export function useCreateGameMode(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGameModeDto) =>
      apiClient
        .post<GameModeResponse>(`/v1/admin/fields/${fieldId}/game-modes`, dto)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fields", fieldId] }),
  });
}

export function useUpdateGameMode(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ modeId, dto }: { modeId: string; dto: UpdateGameModeDto }) =>
      apiClient
        .put<GameModeResponse>(
          `/v1/admin/fields/${fieldId}/game-modes/${modeId}`,
          dto
        )
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fields", fieldId] }),
  });
}

export function useDeleteGameMode(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (modeId: string) =>
      apiClient
        .delete(`/v1/admin/fields/${fieldId}/game-modes/${modeId}`)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fields", fieldId] }),
  });
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export function useMatch(matchId: string) {
  return useQuery({
    queryKey: ["match", matchId],
    queryFn: () =>
      apiClient
        .get<MatchResponse>(`/v1/matches/${matchId}`)
        .then((r) => r.data.data),
    enabled: !!matchId,
  });
}

export function useMatches(fieldId: string) {
  return useQuery({
    queryKey: ["matches", fieldId],
    queryFn: () =>
      apiClient
        .get<MatchListResponse>(`/v1/admin/fields/${fieldId}/matches`)
        .then((r) => r.data),
    enabled: !!fieldId,
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMatchDto) =>
      apiClient
        .post<MatchResponse>("/v1/matches", dto)
        .then((r) => r.data.data),
    onSuccess: (_data, dto) => {
      qc.invalidateQueries({ queryKey: ["matches", dto.fieldId], exact: false });
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useStartMatch(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) =>
      apiClient
        .post<MatchResponse>(`/v1/matches/${matchId}/start`)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches", fieldId], exact: false }),
  });
}

export function useEndMatch(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, dto }: { matchId: string; dto: EndMatchDto }) =>
      apiClient
        .post<MatchResponse>(`/v1/matches/${matchId}/end`, dto)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches", fieldId], exact: false }),
  });
}

export function useUpdateMatch(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, dto }: { matchId: string; dto: UpdateMatchDto }) =>
      apiClient
        .patch<MatchResponse>(`/v1/admin/matches/${matchId}`, dto)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches", fieldId], exact: false }),
  });
}

export function useDeleteMatch(fieldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) =>
      apiClient.delete(`/v1/admin/matches/${matchId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["matches", fieldId], exact: false }),
  });
}
