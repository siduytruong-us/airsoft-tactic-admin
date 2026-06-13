// ═══════════════════════════════════════════════════════════════════════════
// BASE RESPONSE WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

// Single-item or mutation responses
export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  status?: number;
  timestamp?: string;
  data: T;
}

// Paginated list responses: data is { content, page, totalPages, ... }
export interface PagedResponse<T> {
  status?: number;
  timestamp?: string;
  data: {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════════════

export interface AdminInfo {
  id: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "SUPER_ADMIN";
}

export interface AuthData {
  accessToken: string;
  expiresIn: number; // seconds
  user: AdminInfo;
}

export type AuthResponse = ApiResponse<AuthData>;

export interface LoginDto {
  username: string;
  password: string;
}

export interface BootstrapDto {
  username: string;
  password: string;
  displayName: string;
}

export interface BootstrapData {
  id: string;
  username: string;
  role: "SUPER_ADMIN";
}

export type BootstrapResponse = ApiResponse<BootstrapData>;

export interface CreateAdminDto {
  username: string;
  password: string;
  displayName: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════════════════

export interface Stats {
  totalUsers: number;
  totalFields: number;
  activeMatches: number;
  totalMatchesPlayed: number;
}

export type StatsResponse = ApiResponse<Stats>;

// ═══════════════════════════════════════════════════════════════════════════
// OPENING HOURS
// ═══════════════════════════════════════════════════════════════════════════

export interface OpeningHour {
  dayOfWeek: number; // 0=Sunday, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  openTime: string | null;  // "HH:mm"
  closeTime: string | null; // "HH:mm"
  isClosed: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELDS
// ═══════════════════════════════════════════════════════════════════════════

export interface Field {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  description?: string;
  coverImageUrl?: string | null;
  isLive: boolean;
  gameModes: GameMode[];
  openingHours?: OpeningHour[];
  phone?: string | null;
  website?: string | null;
  minAge?: number | null;
  entryFee?: number | null;
  entryFeeCurrency?: string | null;
  rentalAvailable?: 'yes' | 'no' | 'unknown';
  isVerified: boolean;
}

// GET /v1/fields → nested paginated response
export type FieldListResponse = PagedResponse<Field>;
export type FieldResponse = ApiResponse<Field>;

export interface CreateFieldDto {
  name: string;
  location: string;
  lat: number;
  lng: number;
  description?: string;
  coverImageUrl?: string;
  phone?: string | null;
  website?: string | null;
  minAge?: number | null;
  entryFee?: number | null;
  entryFeeCurrency?: string;
  rentalAvailable?: 'yes' | 'no' | 'unknown';
}

export type UpdateFieldDto = Partial<CreateFieldDto> & {
  isVerified?: boolean;
};

// ═══════════════════════════════════════════════════════════════════════════
// GAME MODES
// ═══════════════════════════════════════════════════════════════════════════

export interface GameMode {
  id: string;
  fieldId: string | null;
  name: string;
  description: string | null;
  rules: string[];
}

export type GameModeResponse = ApiResponse<GameMode>;

export interface CreateGameModeDto {
  name: string;
  description?: string;
  rules?: string[];
}

export type UpdateGameModeDto = Partial<CreateGameModeDto>;

// ═══════════════════════════════════════════════════════════════════════════
// MATCHES
// ═══════════════════════════════════════════════════════════════════════════

export type MatchStatus = "WAITING" | "IN_PROGRESS" | "ENDED" | "CANCELLED";

export interface MatchTeam {
  id: string;
  name: string;
  colorHex?: string;
  respawnBase?: string;
  players: unknown[];
  isWinner?: boolean;
}

export interface Match {
  id: string;
  fieldId: string;
  fieldName?: string;
  gameModeId: string;
  gameModeName?: string;
  status: MatchStatus;
  maxPlayers: number;
  teamCount: number;
  respawnEnabled: boolean;
  respawnDelaySeconds: number;
  scheduledEndAt: string | null;
  mapId: string | null;
  mapName: string | null;
  playerCount?: number;
  canJoin?: boolean;
  teams?: MatchTeam[];
  createdByDisplayName?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  winningTeamId?: string | null;
  createdAt?: string;
}

export type MatchListResponse = ApiResponse<Match[]>;
export type MatchResponse = ApiResponse<Match>;

/** POST /v1/matches */
export interface CreateMatchDto {
  fieldId: string;
  gameModeId: string;
  maxPlayers: number;
  teamCount: number;
  respawnEnabled: boolean;
  respawnDelaySeconds: number;
  scheduledEndAt?: string; // ISO 8601, optional
  mapId?: string;          // optional
}

/** POST /v1/matches/{matchId}/end */
export interface EndMatchDto {
  winningTeamId: string | null;
}

/** PATCH /v1/admin/matches/{matchId} */
export interface UpdateMatchDto {
  maxPlayers?: number;
  respawnEnabled?: boolean;
  respawnDelaySeconds?: number;
  scheduledEndAt?: string | null;
  mapId?: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole = "PLAYER" | "ORGANIZER" | "ADMIN";

export interface User {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string; // ISO 8601
}

// GET /v1/admin/users → data is User[], pagination at root
export type UserListResponse = ApiResponse<User[]>;

export interface UpdateRoleDto {
  role: UserRole;
}

// ═══════════════════════════════════════════════════════════════════════════
// GEOJSON
// ═══════════════════════════════════════════════════════════════════════════

// Coordinate order: [longitude, latitude] — GeoJSON spec RFC 7946
export type GeoJsonCoordinate = [number, number];
export type GeoJsonRing = GeoJsonCoordinate[];
export interface GeoJsonPolygon {
  type: "Polygon";
  coordinates: GeoJsonRing[]; // [outerRing, ...holes]
}

// ═══════════════════════════════════════════════════════════════════════════
// AREAS
// ═══════════════════════════════════════════════════════════════════════════

export type AreaType = "SPAWN" | "OBJECTIVE" | "BOUNDARY" | "DANGER" | "ZONE";

export interface Area {
  id: string;
  matchId: string;
  name: string;
  description: string | null;
  colorHex: string;
  areaType: AreaType;
  geometry: GeoJsonPolygon;
  createdAt: string;
}

export type AreaListResponse = ApiResponse<Area[]>;
export type AreaResponse = ApiResponse<Area>;

export interface CreateAreaRequest {
  name: string;
  description?: string;
  colorHex?: string;
  areaType?: AreaType;
  geometry: GeoJsonPolygon;
}

export interface UpdateAreaRequest {
  name?: string;
  description?: string;
  colorHex?: string;
  areaType?: AreaType;
  geometry?: GeoJsonPolygon;
}

export const AREA_TYPE_CONFIG: Record<AreaType, { label: string; defaultColor: string }> = {
  SPAWN:     { label: "Spawn",      defaultColor: "#3B82F6" },
  OBJECTIVE: { label: "Mục tiêu",   defaultColor: "#EF4444" },
  BOUNDARY:  { label: "Biên giới",  defaultColor: "#F59E0B" },
  DANGER:    { label: "Nguy hiểm",  defaultColor: "#DC2626" },
  ZONE:      { label: "Vùng",       defaultColor: "#6B7280" },
};

// ═══════════════════════════════════════════════════════════════════════════
// MAP TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

export interface MapArea {
  id: string;
  mapId: string;
  name: string;
  description: string | null;
  colorHex: string;
  areaType: string;
  geojson: object;
}

export interface MapTemplate {
  id: string;
  fieldId: string | null;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  areas?: MapArea[];
}

export type MapTemplateListResponse = ApiResponse<MapTemplate[]>;
export type MapTemplateResponse = ApiResponse<MapTemplate>;

export interface CreateMapDto {
  name: string;
  description?: string;
  coverImageUrl?: string;
}

export type UpdateMapDto = Partial<CreateMapDto>;

export interface CreateMapAreaDto {
  name: string;
  geojson: object;
  colorHex: string;
  areaType: string;
  description?: string;
}

export type UpdateMapAreaDto = Partial<CreateMapAreaDto>;
