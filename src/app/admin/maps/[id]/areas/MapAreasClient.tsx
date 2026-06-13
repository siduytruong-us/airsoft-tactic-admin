"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Map } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useMap,
  useMapAreas,
  useCreateMapArea,
  useUpdateMapArea,
  useDeleteMapArea,
} from "@/hooks/api/useMaps";
import { useField } from "@/hooks/api/useFields";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import type { MapArea, GeoJsonPolygon, CreateMapAreaDto } from "@/types/api";

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
  area: MapArea;
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

// ─── Map Area Form Dialog ──────────────────────────────────────────────────────

const AREA_TYPE_OPTIONS = [
  { value: "ZONE", label: "Vùng", defaultColor: "#6B7280" },
  { value: "SPAWN", label: "Spawn", defaultColor: "#3B82F6" },
  { value: "OBJECTIVE", label: "Mục tiêu", defaultColor: "#EF4444" },
  { value: "BORDER", label: "Biên giới", defaultColor: "#F59E0B" },
];

interface MapAreaFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMapAreaDto) => void;
  pendingGeometry: GeoJsonPolygon | null;
  editingArea?: MapArea | null;
  isLoading?: boolean;
  existingAreaTypes?: string[];
}

function MapAreaFormDialog({
  open,
  onClose,
  onSubmit,
  pendingGeometry,
  editingArea,
  isLoading = false,
  existingAreaTypes = [],
}: MapAreaFormDialogProps) {
  const isEdit = !!editingArea;

  const [name, setName] = useState(editingArea?.name ?? "");
  const [description, setDescription] = useState(editingArea?.description ?? "");
  const [colorHex, setColorHex] = useState(editingArea?.colorHex ?? "#6B7280");
  const [areaType, setAreaType] = useState(editingArea?.areaType ?? "ZONE");

  // Reset when editingArea changes
  const [prevEditing, setPrevEditing] = useState(editingArea);
  if (prevEditing !== editingArea) {
    setPrevEditing(editingArea);
    setName(editingArea?.name ?? "");
    setDescription(editingArea?.description ?? "");
    setColorHex(editingArea?.colorHex ?? "#6B7280");
    setAreaType(editingArea?.areaType ?? "ZONE");
  }

  const handleTypeChange = (type: string) => {
    setAreaType(type);
    if (!isEdit) {
      const preset = AREA_TYPE_OPTIONS.find((o) => o.value === type);
      if (preset) setColorHex(preset.defaultColor);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const geometry = pendingGeometry ?? (editingArea?.geojson as GeoJsonPolygon);
    if (!geometry) return;
    onSubmit({ name, description: description || undefined, colorHex, areaType, geojson: geometry });
  };

  if (!open) return null;

  const hasGeometry = !!(pendingGeometry ?? editingArea?.geojson);
  const borderDisabled =
    existingAreaTypes.includes("BORDER") && editingArea?.areaType !== "BORDER";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Chỉnh sửa vùng" : "Tạo vùng mới"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
            <span className="text-gray-500 text-lg leading-none">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên vùng</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="VD: Alpha Spawn"
            />
          </div>

          {/* Area Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Loại vùng</label>
            <div className="grid grid-cols-4 gap-2">
              {AREA_TYPE_OPTIONS.map((opt) => {
                const isBorderDisabled =
                  opt.value === "BORDER" && borderDisabled;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isBorderDisabled}
                    title={
                      isBorderDisabled
                        ? "Mỗi map chỉ có 1 border"
                        : undefined
                    }
                    onClick={() => !isBorderDisabled && handleTypeChange(opt.value)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                      areaType === opt.value
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : isBorderDisabled
                        ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                    {isBorderDisabled && (
                      <span className="block text-[10px] leading-tight">(đã có)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Màu sắc</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border p-0.5"
              />
              <input
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1 rounded-lg border px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="#FF5733"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mô tả <span className="text-gray-400">(tuỳ chọn)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Mô tả ngắn về vùng này..."
            />
          </div>

          {!hasGeometry && (
            <p className="rounded-lg bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
              Vẽ polygon trên bản đồ trước khi lưu.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isLoading || !hasGeometry || !name.trim()}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Lưu thay đổi" : "Tạo vùng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Map Area List ─────────────────────────────────────────────────────────────

interface MapAreaListProps {
  areas: MapArea[];
  onEdit: (area: MapArea) => void;
  onDelete: (areaId: string) => void;
}

function MapAreaList({ areas, onEdit, onDelete }: MapAreaListProps) {
  if (areas.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-400">
        Chưa có vùng nào. Dùng công cụ vẽ polygon trên bản đồ để tạo.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {areas.map((area) => {
        const typeLabel = AREA_TYPE_OPTIONS.find((o) => o.value === area.areaType)?.label ?? area.areaType;
        return (
          <li
            key={area.id}
            className="flex items-center gap-3 rounded-xl border bg-white p-3 transition-colors hover:bg-gray-50"
          >
            <div
              className="h-4 w-4 flex-shrink-0 rounded-full border border-white shadow"
              style={{ backgroundColor: area.colorHex }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{area.name}</p>
              <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {typeLabel}
              </span>
            </div>
            <div className="flex flex-shrink-0 gap-1">
              <button
                onClick={() => onEdit(area)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                title="Chỉnh sửa"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(area.id)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                title="Xoá"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Convert MapArea to Area (for MapboxAreaEditor compatibility) ─────────────

function mapAreaToEditorArea(a: MapArea) {
  return {
    id: a.id,
    matchId: a.mapId,
    name: a.name,
    description: a.description,
    colorHex: a.colorHex,
    areaType: a.areaType as "ZONE",
    geometry: a.geojson as GeoJsonPolygon,
    createdAt: "",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function MapAreasClient() {
  const router = useRouter();
  // Static export builds only generate a "placeholder" id; read the real id
  // from the browser URL at runtime (Firebase rewrites all /admin/maps/*/areas to this page).
  const pathname = usePathname();
  const mapId = pathname.split("/").filter(Boolean)[2] ?? "";

  const [pendingPolygon, setPendingPolygon] = useState<GeoJsonPolygon | null>(null);
  const [editingArea, setEditingArea] = useState<MapArea | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MapArea | null>(null);
  const [flyToCoord, setFlyToCoord] = useState<[number, number] | null>(null);

  const { data: mapData } = useMap(mapId);
  const { data: areas = [], isLoading } = useMapAreas(mapId);

  // Fetch field to get lat/lng for camera init
  const { data: field } = useField(mapData?.fieldId ?? "");

  const createMutation = useCreateMapArea(mapId);
  const updateMutation = useUpdateMapArea(mapId);
  const deleteMutation = useDeleteMapArea(mapId);

  const closeDialog = () => {
    setDialogOpen(false);
    setPendingPolygon(null);
    setEditingArea(null);
  };

  const handlePolygonComplete = (polygon: GeoJsonPolygon) => {
    setPendingPolygon(polygon);
    setEditingArea(null);
    setDialogOpen(true);
  };

  const handleEdit = (area: MapArea) => {
    setEditingArea(area);
    setPendingPolygon(null);
    setDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreateMapAreaDto) => {
    try {
      if (editingArea) {
        await updateMutation.mutateAsync({ areaId: editingArea.id, dto: data });
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

  // Convert MapArea[] to Area[] for MapboxAreaEditor
  const editorAreas = areas.map(mapAreaToEditorArea);

  // Camera init at field location
  const mapCenter: [number, number] | undefined =
    field?.lng && field?.lat ? [field.lng, field.lat] : undefined;

  // Border constraint
  const existingAreaTypes = (areas ?? []).map((a) => a.areaType);

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
          {mapData && (
            <p className="text-xs text-gray-500">Map: {mapData.name}</p>
          )}
        </div>
        <span className="ml-auto rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
          {areas.length} vùng
        </span>
      </div>

      {/* Main layout: map + sidebar */}
      <div className="flex h-[calc(100vh-10rem)] gap-4">
        {/* Map */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden">
          {/* Address search bar */}
          <AddressAutocomplete
            placeholder="Tìm địa chỉ để di chuyển bản đồ..."
            onSelect={(_name, lat, lng) => setFlyToCoord([lng, lat])}
          />
          <div className="flex-1 overflow-hidden rounded-xl border shadow-sm">
            <MapboxAreaEditor
              areas={editorAreas}
              center={mapCenter}
              flyTo={flyToCoord}
              onPolygonComplete={handlePolygonComplete}
              onAreaClick={(area) => {
                const mapArea = areas.find((a) => a.id === area.id);
                if (mapArea) handleEdit(mapArea);
              }}
            />
          </div>
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
              <MapAreaList
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
      <MapAreaFormDialog
        open={dialogOpen}
        onClose={closeDialog}
        onSubmit={handleFormSubmit}
        pendingGeometry={pendingPolygon}
        editingArea={editingArea}
        isLoading={createMutation.isPending || updateMutation.isPending}
        existingAreaTypes={existingAreaTypes}
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
