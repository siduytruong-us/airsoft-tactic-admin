"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Map } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AreaFormDialog } from "@/components/areas/AreaFormDialog";
import { AreaList } from "@/components/areas/AreaList";
import {
  useAreas,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
} from "@/hooks/api/useAreas";
import { useMatch, useField } from "@/hooks/api/useFields";
import type { Area, GeoJsonPolygon, CreateAreaRequest } from "@/types/api";

// Dynamic import — Mapbox requires browser APIs, must skip SSR
const MapboxAreaEditor = dynamic(
  () =>
    import("@/components/areas/MapboxAreaEditor").then(
      (m) => m.MapboxAreaEditor
    ),
  { ssr: false, loading: () => <MapPlaceholder /> }
);

function MapPlaceholder() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg bg-gray-100">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  area: Area;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirm({ area, onConfirm, onCancel, isPending }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-900">Xoá vùng?</h2>
        <p className="mt-2 text-sm text-gray-500">
          Bạn sắp xoá <span className="font-medium text-gray-800">{area.name}</span>. Không thể hoàn tác.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function MatchAreasClient() {
  const router = useRouter();
  // Static export builds only generate a "placeholder" id; read the real id
  // from the browser URL at runtime (Firebase rewrites all /matches/*/areas to this page).
  const pathname = usePathname();
  const matchId = pathname.split("/").filter(Boolean)[1] ?? "";

  const [pendingPolygon, setPendingPolygon] = useState<GeoJsonPolygon | null>(null);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Area | null>(null);

  const { data: match } = useMatch(matchId);
  const { data: field } = useField(match?.fieldId ?? "");

  // [lng, lat] — MapboxGL uses longitude-first
  const mapCenter: [number, number] | undefined =
    field?.lng && field?.lat ? [field.lng, field.lat] : undefined;

  const { data: areas = [], isLoading } = useAreas(matchId);
  const createMutation = useCreateArea(matchId);
  const updateMutation = useUpdateArea(matchId, editingArea?.id ?? "");
  const deleteMutation = useDeleteArea(matchId);

  const closeDialog = () => {
    setDialogOpen(false);
    setPendingPolygon(null);
    setEditingArea(null);
  };

  // Vẽ xong polygon → mở dialog nhập thông tin
  const handlePolygonComplete = (polygon: GeoJsonPolygon) => {
    setPendingPolygon(polygon);
    setEditingArea(null);
    setDialogOpen(true);
  };

  // Click area trên bản đồ hoặc list → mở dialog edit
  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setPendingPolygon(null);
    setDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreateAreaRequest) => {
    try {
      if (editingArea) {
        await updateMutation.mutateAsync(data);
        toast.success("Đã cập nhật vùng!");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Đã tạo vùng mới!");
      }
      closeDialog();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Có lỗi xảy ra.";
      toast.error(message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xoá vùng!");
      setDeleteTarget(null);
    } catch {
      toast.error("Không thể xoá vùng.");
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Map className="h-5 w-5 text-orange-500" />
            Quản lý vùng bản đồ
          </h1>
          <p className="text-xs text-gray-500">Match ID: {matchId}</p>
        </div>
        <span className="ml-auto rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
          {areas.length} vùng
        </span>
      </div>

      {/* Main layout: map + sidebar */}
      <div className="flex h-[calc(100vh-10rem)] gap-4">
        {/* Map */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border shadow-sm">
          <MapboxAreaEditor
            areas={areas}
            center={mapCenter}
            onPolygonComplete={handlePolygonComplete}
            onAreaClick={handleEdit}
          />
        </div>

        {/* Sidebar */}
        <div className="flex w-72 flex-col gap-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-700">Hướng dẫn</p>
            <ol className="mt-2 space-y-1.5 text-xs text-gray-500">
              <li className="flex gap-2">
                <span className="font-bold text-orange-500">1.</span>
                Nhấn icon polygon ở góc trái bản đồ để bắt đầu vẽ
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-orange-500">2.</span>
                Click trên bản đồ để thêm từng điểm của vùng
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-orange-500">3.</span>
                Khi đã có ≥ 3 điểm,{" "}
                <span className="font-semibold text-orange-600">chuột phải</span>{" "}
                để mở menu → chọn <span className="font-semibold">Xong</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-orange-500">4.</span>
                Điền tên, loại, màu sắc rồi nhấn Tạo vùng
              </li>
            </ol>
          </div>

          <div className="flex-1 overflow-y-auto rounded-xl border bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-gray-900">
              Danh sách vùng
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <AreaList
                areas={areas}
                onEdit={handleEdit}
                onDelete={(id) => {
                  const area = areas.find((a) => a.id === id);
                  if (area) setDeleteTarget(area);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <AreaFormDialog
        open={dialogOpen}
        onClose={closeDialog}
        onSubmit={handleFormSubmit}
        pendingGeometry={pendingPolygon}
        editingArea={editingArea}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirm
          area={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteMutation.isPending}
        />
      )}
    </AdminLayout>
  );
}
