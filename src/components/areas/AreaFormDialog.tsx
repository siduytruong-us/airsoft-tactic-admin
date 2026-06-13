"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Save, Loader2 } from "lucide-react";
import type { Area, AreaType, GeoJsonPolygon, CreateAreaRequest } from "@/types/api";
import { AREA_TYPE_CONFIG } from "@/types/api";

interface FormValues {
  name: string;
  description: string;
  colorHex: string;
  areaType: AreaType;
}

interface AreaFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAreaRequest) => void;
  pendingGeometry: GeoJsonPolygon | null;
  editingArea?: Area | null;
  isLoading?: boolean;
}

export function AreaFormDialog({
  open,
  onClose,
  onSubmit,
  pendingGeometry,
  editingArea,
  isLoading = false,
}: AreaFormDialogProps) {
  const isEdit = !!editingArea;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      colorHex: "#FF5733",
      areaType: "ZONE",
    },
  });

  // Sync form when editingArea changes
  useEffect(() => {
    if (editingArea) {
      reset({
        name: editingArea.name,
        description: editingArea.description ?? "",
        colorHex: editingArea.colorHex,
        areaType: editingArea.areaType,
      });
    } else {
      reset({ name: "", description: "", colorHex: "#FF5733", areaType: "ZONE" });
    }
  }, [editingArea, reset]);

  const areaType = watch("areaType") as AreaType;
  const colorHex = watch("colorHex");

  // Auto-set default color when areaType changes (only for new areas)
  const handleTypeChange = (type: AreaType) => {
    setValue("areaType", type);
    if (!isEdit) {
      setValue("colorHex", AREA_TYPE_CONFIG[type].defaultColor);
    }
  };

  const onFormSubmit = (values: FormValues) => {
    const geometry = pendingGeometry ?? editingArea?.geometry;
    if (!geometry) return;
    onSubmit({ ...values, geometry });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Chỉnh sửa vùng" : "Tạo vùng mới"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 px-6 py-5">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên vùng</label>
            <input
              {...register("name", { required: "Bắt buộc", maxLength: { value: 100, message: "Tối đa 100 ký tự" } })}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="VD: Alpha Spawn"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Area Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Loại vùng</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(AREA_TYPE_CONFIG) as AreaType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    areaType === type
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {AREA_TYPE_CONFIG[type].label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Màu sắc</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setValue("colorHex", e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-lg border p-0.5"
              />
              <input
                {...register("colorHex", {
                  required: true,
                  pattern: { value: /^#[0-9A-Fa-f]{6}$/, message: "Mã hex không hợp lệ" },
                })}
                className="flex-1 rounded-lg border px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="#FF5733"
              />
            </div>
            {errors.colorHex && <p className="mt-1 text-xs text-red-500">{errors.colorHex.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mô tả <span className="text-gray-400">(tuỳ chọn)</span>
            </label>
            <textarea
              {...register("description", { maxLength: { value: 500, message: "Tối đa 500 ký tự" } })}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Mô tả ngắn về vùng này..."
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
          </div>

          {!pendingGeometry && !editingArea?.geometry && (
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
              disabled={isLoading || (!pendingGeometry && !editingArea?.geometry)}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEdit ? "Lưu thay đổi" : "Tạo vùng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
