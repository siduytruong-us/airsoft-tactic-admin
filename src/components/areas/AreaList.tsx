"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Area } from "@/types/api";
import { AREA_TYPE_CONFIG } from "@/types/api";

interface AreaListProps {
  areas: Area[];
  onEdit: (area: Area) => void;
  onDelete: (areaId: string) => void;
  onHover?: (area: Area | null) => void;
}

export function AreaList({ areas, onEdit, onDelete, onHover }: AreaListProps) {
  if (areas.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-400">
        Chưa có vùng nào. Dùng công cụ vẽ polygon trên bản đồ để tạo.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {areas.map((area) => (
        <li
          key={area.id}
          className="flex items-center gap-3 rounded-xl border bg-white p-3 transition-colors hover:bg-gray-50"
          onMouseEnter={() => onHover?.(area)}
          onMouseLeave={() => onHover?.(null)}
        >
          {/* Color dot */}
          <div
            className="h-4 w-4 flex-shrink-0 rounded-full border border-white shadow"
            style={{ backgroundColor: area.colorHex }}
          />

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{area.name}</p>
            <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {AREA_TYPE_CONFIG[area.areaType]?.label ?? area.areaType}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 gap-1">
            <button
              onClick={() => onEdit(area)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
              title="Chỉnh sửa"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(area.id)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="Xoá"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
