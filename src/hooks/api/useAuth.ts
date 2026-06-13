import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type {
  LoginDto,
  BootstrapDto,
  BootstrapResponse,
  CreateAdminDto,
  AuthResponse,
} from "@/types/api";

/** Đăng nhập bằng username/password */
export function useLoginMutation() {
  return useMutation({
    mutationFn: (dto: LoginDto) =>
      apiClient
        .post<AuthResponse>("/v1/admin/auth/login", dto)
        .then((r) => r.data),
  });
}

/** Bootstrap admin đầu tiên (chỉ dùng 1 lần) */
export function useBootstrapMutation() {
  return useMutation({
    mutationFn: (dto: BootstrapDto) =>
      apiClient
        .post<BootstrapResponse>("/v1/admin/auth/bootstrap", dto)
        .then((r) => r.data),
  });
}

/** Tạo tài khoản admin mới (cần token) */
export function useCreateAdminMutation() {
  return useMutation({
    mutationFn: (dto: CreateAdminDto) =>
      apiClient
        .post("/v1/admin/auth/create", dto)
        .then((r) => r.data),
  });
}
