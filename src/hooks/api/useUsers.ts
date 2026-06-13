import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { UserListResponse, UpdateRoleDto, UserRole } from "@/types/api";

export function useUsers(page = 0, size = 20) {
  return useQuery({
    queryKey: ["users", page, size],
    queryFn: () =>
      apiClient
        .get<UserListResponse>(`/v1/admin/users?page=${page}&size=${size}`)
        .then((r) => r.data), // full response để lấy pagination
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      apiClient
        .patch(`/v1/admin/users/${userId}/role`, { role } satisfies UpdateRoleDto)
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
