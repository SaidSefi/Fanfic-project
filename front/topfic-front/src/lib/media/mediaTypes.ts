/**
 * Canonical media type definitions — single source of truth for frontend.
 *
 * The order and IDs mirror the backend seed file (schemas/seed.py).
 * Always add new types at the END to avoid shifting existing IDs.
 *
 * Categories:
 *   "primary" — appears in searches, deep search, general browsing
 *   "child"   — only in specific contexts (related media, profile, etc.)
 */

// ── Type definition ──────────────────────────────────────────────

export interface MediaTypeDef {
  /** Numeric ID matching the autoincrement PK in media_types table */
  id: number;
  /** Human-readable type name */
  name: string;
  /** Whether this type appears in general searches vs. only specific contexts */
  category: "primary" | "child";
}

// ── Canonical ordered list ───────────────────────────────────────
// ⚠️ DO NOT reorder or insert in the middle. New types go at the bottom.

export const MEDIA_TYPES: readonly MediaTypeDef[] = [
  { id: 1, name: "Movie",          category: "primary" },
  { id: 2, name: "Game",           category: "primary" },
  { id: 3, name: "TV Show",        category: "primary" },
  { id: 4, name: "TV Season",      category: "child"   },
  { id: 5, name: "Anime",          category: "primary" },
  { id: 7, name: "Manga",          category: "primary" },
] as const;

// ── Derived constants ────────────────────────────────────────────

/** All type names, in order */
export const MEDIA_TYPE_NAMES = MEDIA_TYPES.map((t) => t.name);

/** Type names that appear in general searches */
export const PRIMARY_TYPE_NAMES = MEDIA_TYPES.filter(
  (t) => t.category === "primary"
).map((t) => t.name);

/** Type names that only appear in specific contexts */
export const CHILD_TYPE_NAMES = MEDIA_TYPES.filter(
  (t) => t.category === "child"
).map((t) => t.name);

// ── Lookup helpers ───────────────────────────────────────────────

/** Name → ID map for quick lookups */
export const MEDIA_TYPE_ID_BY_NAME: Record<string, number> =
  Object.fromEntries(MEDIA_TYPES.map((t) => [t.name, t.id]));

/** ID → full definition map */
export const MEDIA_TYPE_BY_ID: Record<number, MediaTypeDef> =
  Object.fromEntries(MEDIA_TYPES.map((t) => [t.id, t]));

// ── Utility functions ────────────────────────────────────────────

export function isPrimary(name: string): boolean {
  return PRIMARY_TYPE_NAMES.includes(name);
}

export function isChild(name: string): boolean {
  return CHILD_TYPE_NAMES.includes(name);
}

/** Get the numeric ID for a type name. Returns undefined if unknown. */
export function getMediaTypeId(name: string): number | undefined {
  return MEDIA_TYPE_ID_BY_NAME[name];
}

/** Get the full definition for a type name. */
export function getMediaTypeDef(name: string): MediaTypeDef | undefined {
  const id = MEDIA_TYPE_ID_BY_NAME[name];
  return id !== undefined ? MEDIA_TYPE_BY_ID[id] : undefined;
}

/** Get all primary type definitions (for dropdowns, filters, etc.) */
export function getPrimaryTypes(): MediaTypeDef[] {
  return MEDIA_TYPES.filter((t) => t.category === "primary");
}
