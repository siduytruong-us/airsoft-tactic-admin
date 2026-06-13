"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import {
  useFields,
  useCreateField,
  useUpdateField,
  useDeleteField,
  useCreateGameMode,
  useUploadFieldCoverImage,
} from "@/hooks/api/useFields";
import type { Field, CreateFieldDto, CreateGameModeDto } from "@/types/api";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  MapPin,
  Loader2,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  FileUp,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// ─── Status ──────────────────────────────────────────────────────────────────
// isLive: true → đang hoạt động, false → đóng cửa
const LIVE_LABEL = { true: "Đang mở", false: "Đóng cửa" } as const;
const LIVE_COLOR = {
  true: "bg-green-100 text-green-800",
  false: "bg-gray-100 text-gray-600",
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// FIELD FORM MODAL
// ═══════════════════════════════════════════════════════════════════════════
const fieldSchema = z.object({
  name: z.string().min(2, "Ít nhất 2 ký tự"),
  location: z.string().min(3, "Địa chỉ không hợp lệ"),
  lat: z.number(),
  lng: z.number(),
  description: z.string().optional(),
  coverImageUrl: z
    .string()
    .url("URL không hợp lệ")
    .optional()
    .or(z.literal("")),
});
type FieldFormData = z.infer<typeof fieldSchema>;

function FieldModal({
  field,
  onClose,
}: {
  field?: Field | null;
  onClose: () => void;
}) {
  const isEditing = !!field;
  const createMutation = useCreateField();
  const updateMutation = useUpdateField();
  const uploadCoverMutation = useUploadFieldCoverImage();

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = uploadCoverMutation.isPending;
  const isPending =
    createMutation.isPending || updateMutation.isPending || isUploading;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<FieldFormData>({
    defaultValues: {
      name: field?.name ?? "",
      location: field?.location ?? "",
      lat: field?.lat ?? 0,
      lng: field?.lng ?? 0,
      description: field?.description ?? "",
      coverImageUrl: field?.coverImageUrl ?? "",
    },
  });

  const latValue = watch("lat");
  const lngValue = watch("lng");
  const coverImageUrlValue = watch("coverImageUrl");

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh (JPG, PNG, WebP...)");
      return;
    }
    if (!field?.id) {
      toast.error("Vui lòng lưu sân trước khi upload ảnh bìa.");
      return;
    }
    try {
      const url = await uploadCoverMutation.mutateAsync({
        fieldId: field.id,
        file,
      });
      setValue("coverImageUrl", url, { shouldDirty: true });
      toast.success("Upload ảnh thành công!");
    } catch (err) {
      toast.error(
        "Upload thất bại: " +
          (err instanceof Error ? err.message : "Lỗi không xác định"),
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (raw: FieldFormData) => {
    const result = fieldSchema.safeParse(raw);
    if (!result.success) {
      result.error.errors.forEach((e) =>
        setError(e.path[0] as keyof FieldFormData, { message: e.message }),
      );
      return;
    }
    const dto = {
      ...result.data,
      coverImageUrl: result.data.coverImageUrl || undefined,
    };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: field.id, dto });
        toast.success("Cập nhật sân thành công!");
      } else {
        await createMutation.mutateAsync(dto as CreateFieldDto);
        toast.success("Tạo sân mới thành công!");
      }
      onClose();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold">
            {isEditing ? "Chỉnh sửa sân" : "Thêm sân mới"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-h-[80vh] space-y-4 overflow-y-auto px-6 py-5"
        >
          {/* ── Tên sân ── */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tên sân <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Jungle Zone Alpha"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* ── Địa chỉ ── */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <AddressAutocomplete
              defaultValue={field?.location ?? ""}
              placeholder="Tìm địa chỉ sân..."
              onSelect={(placeName, lat, lng) => {
                setValue("location", placeName, { shouldDirty: true });
                setValue("lat", lat, { shouldDirty: true });
                setValue("lng", lng, { shouldDirty: true });
              }}
              error={errors.location?.message}
            />
            {latValue !== 0 && lngValue !== 0 && (
              <p className="mt-1 font-mono text-xs text-gray-400">
                {latValue.toFixed(5)}, {lngValue.toFixed(5)}
              </p>
            )}
          </div>

          {/* ── Mô tả ── */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Mô tả
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Mô tả địa hình, đặc điểm sân..."
            />
          </div>

          {/* ── Ảnh bìa ── */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Ảnh bìa
            </label>

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 transition-colors ${
                isDragging
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
              } ${isUploading ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
                  <p className="text-xs text-orange-500 font-medium">
                    Đang upload...
                  </p>
                </>
              ) : (
                <>
                  <ImagePlus className="h-7 w-7 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    Kéo thả ảnh vào đây, hoặc{" "}
                    <span className="font-medium text-orange-500">
                      chọn file
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    JPG, PNG, WebP — tối đa 5MB
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>

            {/* URL preview sau khi upload */}
            {coverImageUrlValue && (
              <div className="relative mt-3 overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrlValue}
                  alt="Cover preview"
                  className="h-40 w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setValue("coverImageUrl", "", { shouldDirty: true })
                  }
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  title="Xoá ảnh"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Lưu thay đổi" : "Tạo sân"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GAME MODE MODAL
// ═══════════════════════════════════════════════════════════════════════════
const gameModeSchema = z.object({
  name: z.string().min(2, "Ít nhất 2 ký tự"),
  description: z.string().optional(),
  rulesText: z.string().optional(), // mỗi dòng = 1 rule
});
type GameModeFormData = z.infer<typeof gameModeSchema>;

function GameModeModal({
  fieldId,
  fieldName,
  onClose,
}: {
  fieldId: string;
  fieldName: string;
  onClose: () => void;
}) {
  const createMutation = useCreateGameMode(fieldId);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<GameModeFormData>({
    defaultValues: {
      name: "",
      description: "",
      rulesText: "",
    },
  });

  const onSubmit = async (raw: GameModeFormData) => {
    const result = gameModeSchema.safeParse(raw);
    if (!result.success) {
      result.error.errors.forEach((e) =>
        setError(e.path[0] as keyof GameModeFormData, { message: e.message }),
      );
      return;
    }
    const dto: CreateGameModeDto = {
      name: result.data.name,
      description: result.data.description,
      rules: result.data.rulesText
        ? result.data.rulesText
            .split("\n")
            .map((r) => r.trim())
            .filter(Boolean)
        : [],
    };
    try {
      await createMutation.mutateAsync(dto);
      toast.success("Tạo game mode thành công!");
      onClose();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">Thêm Game Mode</h2>
            <p className="text-xs text-gray-500">Sân: {fieldName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 overflow-y-auto px-6 py-5"
          style={{ maxHeight: "75vh" }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tên chế độ <span className="text-red-500">*</span>
            </label>
            <input
              {...register("name")}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Team Deathmatch"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Mô tả
            </label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Last team standing wins"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Luật chơi (mỗi dòng 1 quy tắc)
            </label>
            <textarea
              {...register("rulesText")}
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
              placeholder={
                "Call HIT when shot\nNo blind firing\nNo physical contact"
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Tạo game mode
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE CONFIRM DIALOG
// ═══════════════════════════════════════════════════════════════════════════
function DeleteConfirmDialog({
  field,
  onConfirm,
  onCancel,
  isLoading,
}: {
  field: Field;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-2 text-lg font-bold text-gray-900">
          Xác nhận xoá sân
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          Bạn có chắc muốn xoá sân{" "}
          <span className="font-semibold text-gray-900">
            &quot;{field.name}&quot;
          </span>
          ? Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Xoá sân
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function FieldsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useFields(page, 20);
  const deleteMutation = useDeleteField();
  const updateMutation = useUpdateField();

  const handleToggleVerified = async (e: React.MouseEvent, f: Field) => {
    e.stopPropagation();
    try {
      await updateMutation.mutateAsync({
        id: f.id,
        dto: { isVerified: !f.isVerified },
      });
      toast.success(!f.isVerified ? "Đã xác minh sân!" : "Đã bỏ xác minh sân.");
    } catch {
      toast.error("Không thể cập nhật trạng thái xác minh.");
    }
  };

  const [fieldModal, setFieldModal] = useState<{
    open: boolean;
    field: Field | null;
  }>({
    open: false,
    field: null,
  });
  const [gameModeModal, setGameModeModal] = useState<Field | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Field | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const createField = useCreateField();

  const fields = data?.data?.content ?? [];

  const totalPages = data?.data?.totalPages ?? 1;

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsImporting(true);
    const toastId = toast.loading("Đang đọc file Excel...");

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets["Fields"];
      if (!ws) {
        toast.error("Không tìm thấy sheet 'Fields' trong file Excel.", {
          id: toastId,
        });
        return;
      }

      interface ExcelRow {
        name?: string;
        city?: string;
        state?: string;
        address?: string;
        zip_code?: string | number;
        latitude?: number;
        longitude?: number;
        phone?: string;
        website?: string;
        description?: string;
        min_age?: number;
        entry_fee_usd?: number;
        rental_available?: string;
      }

      const rows = XLSX.utils.sheet_to_json<ExcelRow>(ws);
      const validRows = rows.filter(
        (r) => r.name && r.address && r.latitude && r.longitude,
      );

      if (validRows.length === 0) {
        toast.error("Không có dòng hợp lệ nào trong sheet Fields.", {
          id: toastId,
        });
        return;
      }

      let success = 0;
      let failed = 0;

      for (let i = 0; i < validRows.length; i++) {
        const r = validRows[i];
        toast.loading(`Đang import ${i + 1}/${validRows.length}: ${r.name}`, {
          id: toastId,
        });

        const location = [r.address, r.city, r.state, r.zip_code]
          .filter(Boolean)
          .join(", ");

        const rentalRaw = (r.rental_available ?? "").toLowerCase();
        const rentalAvailable =
          rentalRaw === "yes" ? "yes" : rentalRaw === "no" ? "no" : "unknown";

        const dto: CreateFieldDto = {
          name: r.name!,
          location: location || `${r.city ?? ""}, ${r.state ?? ""}`.trim(),
          lat: r.latitude!,
          lng: r.longitude!,
          description: r.description,
          phone: r.phone,
          website: r.website,
          minAge: r.min_age ?? undefined,
          entryFee: r.entry_fee_usd ?? undefined,
          entryFeeCurrency: r.entry_fee_usd != null ? "USD" : undefined,
          rentalAvailable,
        };

        try {
          await createField.mutateAsync(dto);
          success++;
        } catch {
          failed++;
        }
      }

      if (failed === 0) {
        toast.success(`Import thành công ${success}/${validRows.length} sân!`, {
          id: toastId,
        });
      } else {
        toast.warning(
          `Import xong: ${success} thành công, ${failed} thất bại.`,
          { id: toastId },
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi đọc file Excel.", { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Xoá sân thành công!");
      setDeleteTarget(null);
    } catch {
      toast.error("Không thể xoá sân này.");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sân chơi</h1>
            <p className="text-sm text-gray-500">
              Quản lý sân Airsoft
              {data && (
                <span className="ml-2 font-medium text-gray-700">
                  ({data.data?.totalElements?.toLocaleString()} sân)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportExcel}
            />
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              Import Excel
            </button>
            <button
              onClick={() => setFieldModal({ open: true, field: null })}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
            >
              <Plus className="h-4 w-4" />
              Thêm sân mới
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
              <MapPin className="h-12 w-12" />
              <p className="font-medium">Chưa có sân nào</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-4">Tên sân</th>
                    <th className="px-6 py-4">Địa chỉ</th>
                    <th className="px-6 py-4">Tọa độ</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Xác minh</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fields.map((f) => (
                    <tr
                      key={f.id}
                      className="cursor-pointer hover:bg-orange-50"
                      onClick={() => router.push(`/fields/${f.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {f.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={f.coverImageUrl}
                              alt={f.name}
                              className="h-10 w-16 flex-shrink-0 rounded-lg object-cover"
                              onError={(e) => {
                                (
                                  e.currentTarget as HTMLImageElement
                                ).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-10 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                              <MapPin className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {f.name}
                            </p>
                            {f.description && (
                              <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">
                                {f.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{f.location}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        {f.lat.toFixed(4)}, {f.lng.toFixed(4)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${LIVE_COLOR[String(f.isLive) as "true" | "false"]}`}
                        >
                          {LIVE_LABEL[String(f.isLive) as "true" | "false"]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => handleToggleVerified(e, f)}
                          disabled={updateMutation.isPending}
                          title="Click để chuyển đổi trạng thái xác minh"
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                            f.isVerified
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {f.isVerified ? "✓ Verified" : "Chưa xác minh"}
                        </button>
                      </td>
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setGameModeModal(f)}
                            title="Thêm game mode"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-purple-50 hover:text-purple-600"
                          >
                            <Gamepad2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              setFieldModal({ open: true, field: f })
                            }
                            title="Chỉnh sửa"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(f)}
                            title="Xoá"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-xs text-gray-500">
                  Trang {page + 1} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3 w-3" /> Trước
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Sau <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {fieldModal.open && (
        <FieldModal
          field={fieldModal.field}
          onClose={() => setFieldModal({ open: false, field: null })}
        />
      )}

      {gameModeModal && (
        <GameModeModal
          fieldId={gameModeModal.id}
          fieldName={gameModeModal.name}
          onClose={() => setGameModeModal(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          field={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </AdminLayout>
  );
}
