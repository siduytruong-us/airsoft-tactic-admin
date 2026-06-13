"use client";

import { useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import {
  useField,
  useUpdateField,
  useUploadFieldCoverImage,
  useCreateGameMode,
  useUpdateGameMode,
  useDeleteGameMode,
  useMatches,
  useCreateMatch,
  useStartMatch,
  useEndMatch,
  useUpdateMatch,
  useDeleteMatch,
} from "@/hooks/api/useFields";
import {
  useMapsByField,
  useCreateMap,
  useUpdateMap,
  useUploadMapCoverImage,
  useDeleteMap,
} from "@/hooks/api/useMaps";
import { useUpdateFieldHours } from "@/hooks/api/useFieldHours";
import type {
  UpdateFieldDto,
  CreateGameModeDto,
  UpdateGameModeDto,
  GameMode,
  Match,
  MatchTeam,
  CreateMatchDto,
  UpdateMatchDto,
  MapTemplate,
  CreateMapDto,
  OpeningHour,
} from "@/types/api";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  X,
  MapPin,
  Gamepad2,
  Swords,
  Save,
  Users,
  Clock,
  Play,
  StopCircle,
  Trophy,
  Map,
  ExternalLink,
  ImageIcon,
  ImagePlus,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MATCH_STATUS_LABEL: Record<string, string> = {
  WAITING: "Chờ",
  IN_PROGRESS: "Đang diễn ra",
  ENDED: "Kết thúc",
  CANCELLED: "Đã huỷ",
};
const MATCH_STATUS_COLOR: Record<string, string> = {
  WAITING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-green-100 text-green-800",
  ENDED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

// ─── Tab ──────────────────────────────────────────────────────────────────────

type Tab = "info" | "gamemodes" | "matches" | "maps" | "hours";

// ═══════════════════════════════════════════════════════════════════════════
// GAME MODE FORM MODAL — chỉ còn name, description, rules
// ═══════════════════════════════════════════════════════════════════════════

interface GameModeModalProps {
  fieldId: string;
  mode: GameMode | null; // null = create
  onClose: () => void;
}

function GameModeModal({ fieldId, mode, onClose }: GameModeModalProps) {
  const createMutation = useCreateGameMode(fieldId);
  const updateMutation = useUpdateGameMode(fieldId);
  const isEdit = !!mode;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateGameModeDto>({
    defaultValues: mode
      ? {
          name: mode.name,
          description: mode.description ?? "",
          rules: mode.rules ?? [],
        }
      : {
          name: "",
          description: "",
          rules: [],
        },
  });

  const [ruleInput, setRuleInput] = useState("");
  const rules = watch("rules") ?? [];

  const addRule = () => {
    const trimmed = ruleInput.trim();
    if (!trimmed) return;
    setValue("rules", [...rules, trimmed]);
    setRuleInput("");
  };

  const removeRule = (i: number) => {
    setValue(
      "rules",
      rules.filter((_, idx) => idx !== i),
    );
  };

  const onSubmit = async (data: CreateGameModeDto) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({
          modeId: mode!.id,
          dto: data as UpdateGameModeDto,
        });
        toast.success("Đã cập nhật game mode!");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Đã tạo game mode!");
      }
      onClose();
    } catch {
      toast.error("Có lỗi xảy ra, thử lại nhé.");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Chỉnh sửa Game Mode" : "Thêm Game Mode"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tên
            </label>
            <input
              {...register("name", { required: true })}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Team Deathmatch"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">Bắt buộc</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mô tả
            </label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Last team standing wins"
            />
          </div>

          {/* Rules */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Luật chơi
            </label>
            <div className="flex gap-2">
              <input
                value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRule();
                  }
                }}
                className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Nhập luật, Enter để thêm"
              />
              <button
                type="button"
                onClick={addRule}
                className="rounded-lg bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {rules.length > 0 && (
              <ul className="mt-2 space-y-1">
                {rules.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm"
                  >
                    <span>{r}</span>
                    <button
                      type="button"
                      onClick={() => removeRule(i)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEdit ? "Lưu" : "Tạo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE MATCH MODAL — with full config fields + map selector
// ═══════════════════════════════════════════════════════════════════════════

interface CreateMatchModalProps {
  fieldId: string;
  gameModes: GameMode[];
  maps: MapTemplate[];
  onClose: () => void;
}

interface CreateMatchFormData {
  gameModeId: string;
  maxPlayers: number;
  teamCount: number;
  respawnEnabled: boolean;
  respawnDelaySeconds: number;
  mapId: string;
  scheduledEndAt: string;
}

function CreateMatchModal({
  fieldId,
  gameModes,
  maps,
  onClose,
}: CreateMatchModalProps) {
  const createMutation = useCreateMatch();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateMatchFormData>({
    defaultValues: {
      gameModeId: gameModes[0]?.id ?? "",
      maxPlayers: 20,
      teamCount: 2,
      respawnEnabled: false,
      respawnDelaySeconds: 30,
      mapId: "",
      scheduledEndAt: "",
    },
  });

  const respawnEnabled = watch("respawnEnabled");

  const onSubmit = async (data: CreateMatchFormData) => {
    const dto: CreateMatchDto = {
      fieldId,
      gameModeId: data.gameModeId,
      maxPlayers: Number(data.maxPlayers),
      teamCount: Number(data.teamCount),
      respawnEnabled: data.respawnEnabled,
      respawnDelaySeconds: Number(data.respawnDelaySeconds),
    };
    if (data.scheduledEndAt) {
      dto.scheduledEndAt = new Date(data.scheduledEndAt).toISOString();
    }
    // mapId is required — always include it
    dto.mapId = data.mapId;
    try {
      await createMutation.mutateAsync(dto);
      toast.success("Đã tạo trận đấu!");
      onClose();
    } catch {
      toast.error("Không thể tạo trận đấu.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Tạo trận đấu mới
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
          {/* Game Mode */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Game Mode
            </label>
            {gameModes.length === 0 ? (
              <p className="text-sm text-red-500">
                Chưa có game mode nào. Tạo game mode trước.
              </p>
            ) : (
              <select
                {...register("gameModeId", { required: true })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              >
                {gameModes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            {errors.gameModeId && (
              <p className="mt-1 text-xs text-red-500">Bắt buộc</p>
            )}
          </div>

          {/* maxPlayers + teamCount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Số người tối đa
              </label>
              <input
                type="number"
                {...register("maxPlayers", {
                  required: true,
                  min: 2,
                  valueAsNumber: true,
                })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              />
              {errors.maxPlayers && (
                <p className="mt-1 text-xs text-red-500">Tối thiểu 2</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Số đội
              </label>
              <input
                type="number"
                {...register("teamCount", {
                  required: true,
                  min: 2,
                  valueAsNumber: true,
                })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              />
              {errors.teamCount && (
                <p className="mt-1 text-xs text-red-500">Tối thiểu 2</p>
              )}
            </div>
          </div>

          {/* Respawn */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="respawnEnabled"
                {...register("respawnEnabled")}
                className="h-4 w-4 rounded accent-orange-500"
              />
              <label
                htmlFor="respawnEnabled"
                className="text-sm font-medium text-gray-700"
              >
                Cho phép hồi sinh (Respawn)
              </label>
            </div>
            {respawnEnabled && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Thời gian hồi sinh (giây)
                </label>
                <input
                  type="number"
                  {...register("respawnDelaySeconds", {
                    min: 0,
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            )}
          </div>

          {/* Map selector — required, must have at least 1 map */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Chọn Map <span className="text-red-500">*</span>
            </label>
            {maps.length === 0 ? (
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5">
                <p className="text-sm text-orange-700">
                  Tạo ít nhất 1 map trước khi tạo trận.
                </p>
              </div>
            ) : (
              <>
                <select
                  {...register("mapId", { required: "Bắt buộc chọn map" })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">-- Chọn map --</option>
                  {maps.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {errors.mapId && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.mapId.message}
                  </p>
                )}
                {/* Map cover preview */}
                {(() => {
                  const selectedMapId = watch("mapId");
                  const selectedMap = maps.find((m) => m.id === selectedMapId);
                  if (!selectedMap?.coverImageUrl) return null;
                  return (
                    <div className="mt-2 overflow-hidden rounded-lg border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedMap.coverImageUrl}
                        alt={selectedMap.name}
                        className="h-24 w-full object-cover"
                      />
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Scheduled end time */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              <Clock className="mr-1 inline h-3.5 w-3.5 text-gray-400" />
              Thời gian kết thúc dự kiến{" "}
              <span className="text-gray-400">(tuỳ chọn)</span>
            </label>
            <input
              type="datetime-local"
              {...register("scheduledEndAt")}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

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
              disabled={
                createMutation.isPending ||
                gameModes.length === 0 ||
                maps.length === 0
              }
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Swords className="h-4 w-4" />
              )}
              Tạo trận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// END MATCH MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface EndMatchModalProps {
  match: Match;
  fieldId: string;
  onClose: () => void;
}

function EndMatchModal({ match, fieldId, onClose }: EndMatchModalProps) {
  const endMutation = useEndMatch(fieldId);
  const [winningTeamId, setWinningTeamId] = useState<string | null>(null);
  const teams: MatchTeam[] = match.teams ?? [];

  const handleEnd = async () => {
    try {
      await endMutation.mutateAsync({
        matchId: match.id,
        dto: { winningTeamId },
      });
      toast.success("Trận đấu đã kết thúc!");
      onClose();
    } catch {
      toast.error("Không thể kết thúc trận đấu.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Kết thúc trận đấu
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-gray-500">
            Chọn đội thắng (để trống nếu hoà):
          </p>

          <div className="space-y-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${winningTeamId === null ? "border-orange-400 bg-orange-50" : "hover:bg-gray-50"}`}
            >
              <input
                type="radio"
                name="winner"
                checked={winningTeamId === null}
                onChange={() => setWinningTeamId(null)}
                className="accent-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Hoà (không có đội thắng)
              </span>
            </label>

            {teams.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${winningTeamId === t.id ? "border-orange-400 bg-orange-50" : "hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  name="winner"
                  checked={winningTeamId === t.id}
                  onChange={() => setWinningTeamId(t.id)}
                  className="accent-orange-500"
                />
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">
                  {t.name}
                </span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Huỷ
            </button>
            <button
              onClick={handleEnd}
              disabled={endMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
            >
              {endMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <StopCircle className="h-4 w-4" />
              )}
              Kết thúc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EDIT MATCH MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface EditMatchModalProps {
  match: Match;
  fieldId: string;
  maps: MapTemplate[];
  onClose: () => void;
}

function EditMatchModal({
  match,
  fieldId,
  maps,
  onClose,
}: EditMatchModalProps) {
  const updateMutation = useUpdateMatch(fieldId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateMatchDto>({
    defaultValues: {
      maxPlayers: match.maxPlayers,
      respawnEnabled: match.respawnEnabled,
      respawnDelaySeconds: match.respawnDelaySeconds,
      scheduledEndAt: match.scheduledEndAt
        ? new Date(match.scheduledEndAt).toISOString().slice(0, 16)
        : "",
      mapId: match.mapId ?? "",
    },
  });

  const onSubmit = async (data: UpdateMatchDto) => {
    try {
      const dto: UpdateMatchDto = {
        maxPlayers: data.maxPlayers ? Number(data.maxPlayers) : undefined,
        respawnEnabled: data.respawnEnabled,
        respawnDelaySeconds: data.respawnDelaySeconds
          ? Number(data.respawnDelaySeconds)
          : undefined,
        scheduledEndAt: data.scheduledEndAt
          ? new Date(data.scheduledEndAt as string).toISOString()
          : null,
        mapId: data.mapId || null,
      };
      await updateMutation.mutateAsync({ matchId: match.id, dto });
      toast.success("Đã cập nhật trận đấu!");
      onClose();
    } catch {
      toast.error("Không thể cập nhật trận đấu.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Chỉnh sửa trận đấu
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Số người chơi tối đa
              </label>
              <input
                type="number"
                min={2}
                max={100}
                {...register("maxPlayers", {
                  required: true,
                  min: 2,
                  valueAsNumber: true,
                })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {errors.maxPlayers && (
                <p className="mt-1 text-xs text-red-500">Bắt buộc</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Thời gian hồi sinh (giây)
              </label>
              <input
                type="number"
                min={5}
                {...register("respawnDelaySeconds", {
                  required: true,
                  min: 5,
                  valueAsNumber: true,
                })}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Kết thúc tự động lúc
            </label>
            <input
              type="datetime-local"
              {...register("scheduledEndAt")}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Map
            </label>
            <select
              {...register("mapId")}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">— Không dùng map —</option>
              {maps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editRespawnEnabled"
              {...register("respawnEnabled")}
              className="h-4 w-4 accent-orange-500"
            />
            <label
              htmlFor="editRespawnEnabled"
              className="text-sm text-gray-700"
            >
              Cho phép hồi sinh
            </label>
          </div>

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
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAP FORM MODAL — tạo / sửa map template (name + description only)
// ═══════════════════════════════════════════════════════════════════════════

interface MapModalProps {
  fieldId: string;
  map: MapTemplate | null; // null = create
  onClose: () => void;
}

function MapModal({ fieldId, map, onClose }: MapModalProps) {
  const createMutation = useCreateMap(fieldId);
  const updateMutation = useUpdateMap(fieldId);
  const uploadCoverMutation = useUploadMapCoverImage(fieldId);
  const isEdit = !!map;

  const [selectedUrl, setSelectedUrl] = useState<string | null>(
    map?.coverImageUrl ?? null,
  );
  // For create mode: map doesn't have an id yet, so we stash the chosen file
  // and upload it right after the map is created (once we have its id).
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateMapDto>({
    defaultValues: {
      name: map?.name ?? "",
      description: map?.description ?? "",
    },
  });

  const handleUploadNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isEdit) {
      setIsUploading(true);
      try {
        const url = await uploadCoverMutation.mutateAsync({
          mapId: map!.id,
          file,
        });
        setSelectedUrl(url);
        toast.success("Đã upload ảnh!");
      } catch (err) {
        toast.error(
          "Upload thất bại: " +
            (err instanceof Error ? err.message : "Lỗi không xác định"),
        );
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    } else {
      // Create mode: preview locally, upload after the map is created.
      setPendingFile(file);
      setSelectedUrl(URL.createObjectURL(file));
      e.target.value = "";
    }
  };

  const onSubmit = async (data: CreateMapDto) => {
    try {
      if (isEdit) {
        const coverImageUrl = selectedUrl ?? undefined;
        await updateMutation.mutateAsync({
          mapId: map!.id,
          dto: { ...data, coverImageUrl },
        });
        toast.success("Đã cập nhật map!");
      } else {
        const created = await createMutation.mutateAsync(data);
        if (pendingFile && created?.id) {
          setIsUploading(true);
          try {
            await uploadCoverMutation.mutateAsync({
              mapId: created.id,
              file: pendingFile,
            });
          } catch (err) {
            toast.error(
              "Tạo map thành công nhưng upload ảnh thất bại: " +
                (err instanceof Error ? err.message : "Lỗi không xác định"),
            );
          } finally {
            setIsUploading(false);
          }
        }
        toast.success("Đã tạo map!");
      }
      onClose();
    } catch {
      toast.error("Có lỗi xảy ra, thử lại nhé.");
    }
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending || isUploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Chỉnh sửa Map" : "Thêm Map"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tên Map
            </label>
            <input
              {...register("name", { required: true })}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Map Alpha"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">Bắt buộc</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mô tả <span className="text-gray-400">(tuỳ chọn)</span>
            </label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Mô tả bản đồ..."
            />
          </div>

          {/* Cover Image Picker */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Ảnh bìa <span className="text-gray-400">(tuỳ chọn)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5" />
                )}
                Upload ảnh mới
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadNew}
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* Selected preview */}
            {selectedUrl ? (
              <div className="relative overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedUrl}
                  alt="Selected cover"
                  className="h-28 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUrl(null);
                    setPendingFile(null);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <span className="absolute bottom-2 left-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                  Đã chọn
                </span>
              </div>
            ) : (
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-xs text-gray-400">
                Chưa có ảnh nào — upload ảnh mới ở trên
              </div>
            )}
          </div>

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
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEdit ? "Lưu" : "Tạo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OPENING HOURS TAB
// ═══════════════════════════════════════════════════════════════════════════

const DAY_NAMES = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

function buildDefaultHours(existing?: OpeningHour[]): OpeningHour[] {
  return Array.from({ length: 7 }, (_, i) => {
    const found = existing?.find((h) => h.dayOfWeek === i);
    return (
      found ?? {
        dayOfWeek: i,
        openTime: "08:00",
        closeTime: "18:00",
        isClosed: false,
      }
    );
  });
}

interface FieldHoursTabProps {
  fieldId: string;
  initialHours?: OpeningHour[];
}

function FieldHoursTab({ fieldId, initialHours }: FieldHoursTabProps) {
  const [hours, setHours] = useState<OpeningHour[]>(() =>
    buildDefaultHours(initialHours),
  );
  const mutation = useUpdateFieldHours(fieldId);

  const toggleDay = (i: number) => {
    setHours((prev) =>
      prev.map((h, idx) => (idx === i ? { ...h, isClosed: !h.isClosed } : h)),
    );
  };

  const setOpenTime = (i: number, value: string) => {
    setHours((prev) =>
      prev.map((h, idx) => (idx === i ? { ...h, openTime: value || null } : h)),
    );
  };

  const setCloseTime = (i: number, value: string) => {
    setHours((prev) =>
      prev.map((h, idx) =>
        idx === i ? { ...h, closeTime: value || null } : h,
      ),
    );
  };

  const handleSave = async () => {
    const invalid = hours.find(
      (h) => !h.isClosed && (!h.openTime || !h.closeTime),
    );
    if (invalid) {
      toast.error(
        `${DAY_NAMES[invalid.dayOfWeek]}: Vui lòng nhập đầy đủ giờ mở/đóng cửa.`,
      );
      return;
    }
    try {
      await mutation.mutateAsync(hours);
      toast.success("Đã lưu giờ mở cửa!");
    } catch {
      toast.error("Không thể lưu giờ mở cửa, thử lại nhé.");
    }
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h2 className="font-semibold text-gray-900">Giờ mở cửa</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Cài đặt giờ hoạt động cho từng ngày trong tuần.
        </p>
      </div>
      <div className="px-6 py-5">
        <div className="divide-y divide-gray-100">
          {hours.map((h, i) => (
            <div key={h.dayOfWeek} className="flex items-center gap-4 py-3">
              {/* Toggle */}
              <button
                type="button"
                onClick={() => toggleDay(i)}
                className={`relative flex h-6 w-10 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 ${
                  !h.isClosed ? "bg-orange-500" : "bg-gray-200"
                }`}
                aria-label={h.isClosed ? "Đóng cửa" : "Mở cửa"}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    !h.isClosed ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>

              {/* Tên ngày */}
              <span className="w-24 shrink-0 text-sm font-medium text-gray-700">
                {DAY_NAMES[h.dayOfWeek]}
              </span>

              {/* Giờ hoặc text đóng cửa */}
              {h.isClosed ? (
                <span className="flex-1 text-sm italic text-gray-400">
                  Đóng cửa
                </span>
              ) : (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <input
                    type="time"
                    value={h.openTime ?? ""}
                    onChange={(e) => setOpenTime(i, e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <span className="text-sm text-gray-400">đến</span>
                  <input
                    type="time"
                    value={h.closeTime ?? ""}
                    onChange={(e) => setCloseTime(i, e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={mutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mutation.isPending ? "Đang lưu..." : "Lưu giờ mở cửa"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function FieldDetailClient() {
  const router = useRouter();
  // Static export builds only generate a "placeholder" id; read the real id
  // from the browser URL at runtime (Firebase rewrites all /fields/* to this page).
  const pathname = usePathname();
  const fieldId = pathname.split("/").filter(Boolean)[1] ?? "";

  const { data: field, isLoading } = useField(fieldId);
  const updateField = useUpdateField();
  const uploadFieldCoverImage = useUploadFieldCoverImage();
  const deleteGameMode = useDeleteGameMode(fieldId);
  const deleteMap = useDeleteMap(fieldId);
  const startMatch = useStartMatch(fieldId);
  const deleteMatch = useDeleteMatch(fieldId);

  const [tab, setTab] = useState<Tab>("info");
  const [gameModeModal, setGameModeModal] = useState<{
    open: boolean;
    mode: GameMode | null;
  }>({
    open: false,
    mode: null,
  });
  const [deleteGMTarget, setDeleteGMTarget] = useState<GameMode | null>(null);
  const [matchModal, setMatchModal] = useState(false);
  const [endMatchTarget, setEndMatchTarget] = useState<Match | null>(null);
  const [editMatchTarget, setEditMatchTarget] = useState<Match | null>(null);
  const [deleteMatchTarget, setDeleteMatchTarget] = useState<Match | null>(
    null,
  );

  // Map state
  const [mapModal, setMapModal] = useState<{
    open: boolean;
    map: MapTemplate | null;
  }>({
    open: false,
    map: null,
  });
  const [deleteMapTarget, setDeleteMapTarget] = useState<MapTemplate | null>(
    null,
  );

  const { data: matchesData, isLoading: matchesLoading } = useMatches(fieldId);
  const matches = matchesData?.data ?? [];

  const { data: maps = [], isLoading: mapsLoading } = useMapsByField(fieldId);

  // ─── Field Info Form ───────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty, isSubmitting },
  } = useForm<UpdateFieldDto>({
    values: field
      ? {
          name: field.name,
          location: field.location,
          lat: field.lat,
          lng: field.lng,
          description: field.description ?? "",
          coverImageUrl: field.coverImageUrl ?? "",
          phone: field.phone ?? "",
          website: field.website ?? "",
          minAge: field.minAge ?? undefined,
          entryFee: field.entryFee ?? undefined,
          entryFeeCurrency: field.entryFeeCurrency ?? "USD",
          rentalAvailable: field.rentalAvailable ?? "unknown",
          isVerified: field.isVerified ?? false,
        }
      : undefined,
  });

  // Cover image picker state for info form
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const handleCoverFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Chỉ chấp nhận file ảnh");
        return;
      }
      setIsCoverUploading(true);
      try {
        const url = await uploadFieldCoverImage.mutateAsync({ fieldId, file });
        setValue("coverImageUrl", url, { shouldDirty: true });
        toast.success("Upload ảnh thành công!");
      } catch (err) {
        toast.error(
          "Upload thất bại: " +
            (err instanceof Error ? err.message : "Lỗi không xác định"),
        );
      } finally {
        setIsCoverUploading(false);
        if (coverFileRef.current) coverFileRef.current.value = "";
      }
    },
    [setValue, uploadFieldCoverImage, fieldId],
  );

  const coverImageUrlValue = watch("coverImageUrl");
  const coverPreviewSrc = coverImageUrlValue || null;

  const onSaveInfo = async (data: UpdateFieldDto) => {
    try {
      await updateField.mutateAsync({ id: fieldId, dto: data });
      toast.success("Đã lưu thông tin sân!");
    } catch {
      toast.error("Không thể lưu, thử lại nhé.");
    }
  };

  const handleDeleteGameMode = async () => {
    if (!deleteGMTarget) return;
    try {
      await deleteGameMode.mutateAsync(deleteGMTarget.id);
      toast.success("Đã xoá game mode!");
      setDeleteGMTarget(null);
    } catch {
      toast.error("Không thể xoá game mode.");
    }
  };

  const handleDeleteMap = async () => {
    if (!deleteMapTarget) return;
    try {
      await deleteMap.mutateAsync(deleteMapTarget.id);
      toast.success("Đã xoá map!");
      setDeleteMapTarget(null);
    } catch {
      toast.error("Không thể xoá map.");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  if (!field) {
    return (
      <AdminLayout>
        <div className="flex h-96 flex-col items-center justify-center gap-3 text-gray-400">
          <MapPin className="h-12 w-12" />
          <p>Không tìm thấy sân.</p>
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-600"
          >
            Quay lại
          </button>
        </div>
      </AdminLayout>
    );
  }

  const gameModes = field.gameModes ?? [];

  return (
    <AdminLayout>
      {/* ── Header ── */}
      <div className="mb-6 flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="mt-0.5 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{field.name}</h1>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5" />
            {field.location}
          </p>
        </div>
        <span
          className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            field.isLive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {field.isLive ? "Đang mở" : "Đóng cửa"}
        </span>
      </div>

      {/* ── Tabs ── */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border bg-white p-1 shadow-sm w-fit">
        {(
          [
            { key: "info", label: "Thông tin", icon: MapPin },
            { key: "gamemodes", label: "Game Modes", icon: Gamepad2 },
            { key: "matches", label: "Trận đấu", icon: Swords },
            { key: "maps", label: "Maps", icon: Map },
            { key: "hours", label: "Giờ mở cửa", icon: Clock },
          ] as { key: Tab; label: string; icon: React.ElementType }[]
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-orange-500 text-white shadow"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB: INFO
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "info" && (
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold text-gray-900">Thông tin sân</h2>
          </div>
          <form
            onSubmit={handleSubmit(onSaveInfo)}
            className="space-y-5 px-6 py-5"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tên sân
                </label>
                <input
                  {...register("name", { required: true })}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Địa chỉ
                </label>
                <AddressAutocomplete
                  defaultValue={field?.location ?? ""}
                  placeholder="Tìm địa chỉ sân..."
                  onSelect={(placeName, lat, lng) => {
                    setValue("location", placeName, { shouldDirty: true });
                    setValue("lat", lat, { shouldDirty: true });
                    setValue("lng", lng, { shouldDirty: true });
                  }}
                />
                {(() => {
                  const lat = watch("lat");
                  const lng = watch("lng");
                  return lat && lng ? (
                    <p className="mt-1 font-mono text-xs text-gray-400">
                      {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
                    </p>
                  ) : null;
                })()}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mô tả
              </label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* ── Ảnh bìa ── */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
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
                  if (file) handleCoverFile(file);
                }}
                onClick={() =>
                  !isCoverUploading && coverFileRef.current?.click()
                }
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-5 transition-colors ${
                  isDragging
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                } ${isCoverUploading ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {isCoverUploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    <p className="text-xs font-medium text-orange-500">
                      Đang upload...
                    </p>
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      Kéo thả hoặc{" "}
                      <span className="font-medium text-orange-500">
                        chọn file
                      </span>{" "}
                      để upload ảnh bìa
                    </p>
                    <p className="text-xs text-gray-400">
                      JPG, PNG, WebP — upload lên Supabase
                    </p>
                  </>
                )}
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverFile(file);
                  }}
                />
              </div>

              {/* Preview sau khi upload */}
              {coverPreviewSrc && (
                <div className="relative mt-3 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverPreviewSrc}
                    alt="Cover preview"
                    className="h-44 w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setValue("coverImageUrl", "", { shouldDirty: true });
                      if (coverFileRef.current) coverFileRef.current.value = "";
                    }}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* ── Field Details ── */}
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="mb-4 text-sm font-semibold text-gray-700">
                Thông tin chi tiết
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Điện thoại
                  </label>
                  <input
                    {...register("phone")}
                    placeholder="(xxx) xxx-xxxx"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    {...register("website")}
                    type="url"
                    placeholder="https://..."
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Độ tuổi tối thiểu
                  </label>
                  <input
                    {...register("minAge", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    max={99}
                    placeholder="e.g. 10"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Phí vào sân
                  </label>
                  <div className="flex gap-2">
                    <input
                      {...register("entryFee", { valueAsNumber: true })}
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <select
                      {...register("entryFeeCurrency")}
                      className="rounded-lg border px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="USD">USD</option>
                      <option value="VND">VND</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Cho thuê đồ
                  </label>
                  <select
                    {...register("rentalAvailable")}
                    className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="unknown">Chưa rõ</option>
                    <option value="yes">Có</option>
                    <option value="no">Không</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isVerified"
                    {...register("isVerified")}
                    className="h-4 w-4 accent-orange-500"
                  />
                  <label
                    htmlFor="isVerified"
                    className="text-sm font-medium text-gray-700"
                  >
                    Đã xác minh (Verified)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!isDirty || isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: GAME MODES
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "gamemodes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {gameModes.length} game mode
            </p>
            <button
              onClick={() => setGameModeModal({ open: true, mode: null })}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              <Plus className="h-4 w-4" />
              Thêm Game Mode
            </button>
          </div>

          {gameModes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-white py-20 text-gray-400 shadow-sm">
              <Gamepad2 className="h-12 w-12" />
              <p className="font-medium">Chưa có game mode nào</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {gameModes.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{m.name}</h3>
                      {m.description && (
                        <p className="mt-0.5 text-sm text-gray-500">
                          {m.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          setGameModeModal({ open: true, mode: m })
                        }
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteGMTarget(m)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {m.rules && m.rules.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {m.rules.map((r, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-1.5 text-xs text-gray-500"
                        >
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: MATCHES
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "matches" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{matches.length} trận đấu</p>
            <button
              onClick={() => setMatchModal(true)}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              <Plus className="h-4 w-4" />
              Tạo trận đấu
            </button>
          </div>

          <div className="rounded-xl border bg-white shadow-sm">
            {matchesLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
                <Swords className="h-12 w-12" />
                <p className="font-medium">Chưa có trận đấu nào</p>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-6 py-4">Game Mode</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Người chơi</th>
                      <th className="px-6 py-4">Đội</th>
                      <th className="px-6 py-4">Map</th>
                      <th className="px-6 py-4">Ngày tạo</th>
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {matches.map((m: Match) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {m.gameModeName ?? (
                              <span className="text-gray-400 italic">
                                Không rõ
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-gray-400">
                            {m.id.slice(0, 8)}…
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${MATCH_STATUS_COLOR[m.status] ?? ""}`}
                          >
                            {MATCH_STATUS_LABEL[m.status] ?? m.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            {m.playerCount ?? 0} / {m.maxPlayers}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {m.teams && m.teams.length > 0 ? (
                            m.teams.map((t) => t.name).join(" vs ")
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {m.mapName ? (
                            <button
                              onClick={() =>
                                router.push(`/admin/maps/${m.mapId}/areas`)
                              }
                              className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline"
                            >
                              <Map className="h-3.5 w-3.5" />
                              {m.mapName}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">
                          {m.createdAt ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(m.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            {m.status === "WAITING" && (
                              <button
                                onClick={async () => {
                                  try {
                                    await startMatch.mutateAsync(m.id);
                                    toast.success("Trận đấu bắt đầu!");
                                  } catch {
                                    toast.error("Không thể bắt đầu trận đấu.");
                                  }
                                }}
                                disabled={startMatch.isPending}
                                title="Bắt đầu"
                                className="flex items-center gap-1 rounded-lg bg-green-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-60"
                              >
                                {startMatch.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Play className="h-3.5 w-3.5" />
                                )}
                                Bắt đầu
                              </button>
                            )}
                            {m.status === "IN_PROGRESS" && (
                              <button
                                onClick={() => setEndMatchTarget(m)}
                                title="Kết thúc"
                                className="flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                              >
                                <StopCircle className="h-3.5 w-3.5" />
                                Kết thúc
                              </button>
                            )}
                            {m.status !== "ENDED" && (
                              <button
                                onClick={() => setEditMatchTarget(m)}
                                title="Chỉnh sửa"
                                className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {m.status === "ENDED" && (
                              <button
                                onClick={() => setDeleteMatchTarget(m)}
                                title="Xoá trận đấu"
                                className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: MAPS
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "maps" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{maps.length} map template</p>
            <button
              onClick={() => setMapModal({ open: true, map: null })}
              className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            >
              <Plus className="h-4 w-4" />
              Thêm Map
            </button>
          </div>

          {mapsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : maps.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border bg-white py-20 text-gray-400 shadow-sm">
              <Map className="h-12 w-12" />
              <p className="font-medium">Chưa có map nào</p>
              <p className="text-sm">
                Tạo map template để dùng lại cho nhiều trận đấu.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {maps.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Map className="h-4 w-4 shrink-0 text-orange-500" />
                        <h3 className="truncate font-semibold text-gray-900">
                          {m.name}
                        </h3>
                      </div>
                      {m.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {m.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-400">
                        {m.areas?.length ?? 0} vùng
                      </p>
                    </div>
                    <div className="ml-2 flex shrink-0 gap-1">
                      <button
                        onClick={() => setMapModal({ open: true, map: m })}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                        title="Chỉnh sửa thông tin"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteMapTarget(m)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Xoá map"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => router.push(`/admin/maps/${m.id}/areas`)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Sửa vùng bản đồ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: HOURS
      ══════════════════════════════════════════════════════════════════ */}
      {tab === "hours" && (
        <FieldHoursTab fieldId={fieldId} initialHours={field.openingHours} />
      )}

      {/* ── Game Mode Modal ── */}
      {gameModeModal.open && (
        <GameModeModal
          fieldId={fieldId}
          mode={gameModeModal.mode}
          onClose={() => setGameModeModal({ open: false, mode: null })}
        />
      )}

      {/* ── Delete Game Mode Confirm ── */}
      {deleteGMTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Xoá Game Mode?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Bạn sắp xoá{" "}
              <span className="font-medium text-gray-800">
                {deleteGMTarget.name}
              </span>
              . Không thể hoàn tác.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteGMTarget(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleDeleteGameMode}
                disabled={deleteGameMode.isPending}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleteGameMode.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Match Modal ── */}
      {matchModal && (
        <CreateMatchModal
          fieldId={fieldId}
          gameModes={gameModes}
          maps={maps}
          onClose={() => setMatchModal(false)}
        />
      )}

      {/* ── End Match Modal ── */}
      {endMatchTarget && (
        <EndMatchModal
          match={endMatchTarget}
          fieldId={fieldId}
          onClose={() => setEndMatchTarget(null)}
        />
      )}

      {/* ── Map Modal ── */}
      {mapModal.open && (
        <MapModal
          fieldId={fieldId}
          map={mapModal.map}
          onClose={() => setMapModal({ open: false, map: null })}
        />
      )}

      {/* ── Edit Match Modal ── */}
      {editMatchTarget && (
        <EditMatchModal
          match={editMatchTarget}
          fieldId={fieldId}
          maps={maps ?? []}
          onClose={() => setEditMatchTarget(null)}
        />
      )}

      {/* ── Delete Match Confirm ── */}
      {deleteMatchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Xoá trận đấu?
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Trận đấu{" "}
              <span className="font-medium text-gray-800">
                {deleteMatchTarget.id.slice(0, 8)}…
              </span>{" "}
              sẽ bị xoá vĩnh viễn. Không thể hoàn tác.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteMatchTarget(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteMatch.mutateAsync(deleteMatchTarget.id);
                    toast.success("Đã xoá trận đấu.");
                    setDeleteMatchTarget(null);
                  } catch {
                    toast.error("Không thể xoá trận đấu.");
                  }
                }}
                disabled={deleteMatch.isPending}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleteMatch.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Map Confirm ── */}
      {deleteMapTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900">Xoá Map?</h2>
            <p className="mt-2 text-sm text-gray-500">
              Bạn sắp xoá map{" "}
              <span className="font-medium text-gray-800">
                {deleteMapTarget.name}
              </span>
              . Tất cả vùng trong map sẽ bị xoá. Không thể hoàn tác.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteMapTarget(null)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleDeleteMap}
                disabled={deleteMap.isPending}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleteMap.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
