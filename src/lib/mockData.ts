import type { MapTemplate } from "@/types/api";

// ─── Mock Maps ────────────────────────────────────────────────────────────────

export const mockMaps: MapTemplate[] = [
  {
    id: "map-1",
    fieldId: "field-1",
    name: "Map Alpha",
    description: "Bản đồ tiêu chuẩn với 3 vùng kiểm soát",
    coverImageUrl: null,
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    areas: [],
  },
  {
    id: "map-2",
    fieldId: "field-1",
    name: "Map Bravo",
    description: "Địa hình rừng phức tạp",
    coverImageUrl: null,
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    areas: [],
  },
];
