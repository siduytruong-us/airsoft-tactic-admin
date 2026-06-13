"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useUsers, useUpdateUserRole } from "@/hooks/api/useUsers";
import type { UserRole } from "@/types/api";
import { Users, ChevronLeft, ChevronRight, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

const ROLE_LABEL: Record<UserRole, string> = {
  PLAYER: "Người chơi",
  ORGANIZER: "Quản lý sân",
  ADMIN: "Admin",
};

const ROLE_COLOR: Record<UserRole, string> = {
  PLAYER: "bg-gray-100 text-gray-600",
  ORGANIZER: "bg-blue-100 text-blue-700",
  ADMIN: "bg-purple-100 text-purple-700",
};

export default function UsersPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useUsers(page, 20);
  const updateRoleMutation = useUpdateUserRole();

  const users = data?.data ?? [];
  // UserListResponse is a flat array — no totalPages from server.
  // Derive: if returned count < page size, this is the last page.
  const PAGE_SIZE = 20;
  const isLastPage = users.length < PAGE_SIZE;

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role });
      toast.success("Cập nhật quyền thành công!");
    } catch {
      toast.error("Không thể cập nhật quyền.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Người dùng</h1>
          <p className="text-sm text-gray-500">
            Quản lý tài khoản người dùng
            {data && (
              <span className="ml-2 font-medium text-gray-700">
                ({users.length} người dùng)
              </span>
            )}
          </p>
        </div>

        <div className="rounded-xl border bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
              <Users className="h-12 w-12" />
              <p className="font-medium">Chưa có người dùng</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-4">Người dùng</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Quyền hiện tại</th>
                    <th className="px-6 py-4">Ngày tạo</th>
                    <th className="px-6 py-4 text-right">Đổi quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                            {u.displayName?.[0]?.toUpperCase() ?? u.email[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{u.displayName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLOR[u.role]}`}>
                          {u.role !== "PLAYER" && <Shield className="h-3 w-3" />}
                          {ROLE_LABEL[u.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          defaultValue={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          disabled={updateRoleMutation.isPending}
                          className="rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                        >
                          <option value="PLAYER">Người chơi</option>
                          <option value="ORGANIZER">Quản lý sân</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-xs text-gray-500">Trang {page + 1}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                    <ChevronLeft className="h-3 w-3" /> Trước
                  </button>
                  <button onClick={() => setPage((p) => p + 1)} disabled={isLastPage}
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                    Sau <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
