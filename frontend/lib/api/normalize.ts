type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

/**
 * Safely extracts a list from common API shapes:
 * - `[]`
 * - `{ data: [] }`
 * - `{ data: { data: [] } }`
 */
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (!isRecord(value)) return [];
  const first = value.data;

  if (Array.isArray(first)) return first as T[];
  if (!isRecord(first)) return [];

  return Array.isArray(first.data) ? (first.data as T[]) : [];
}

/**
 * Safely extracts paginated data from common API shapes:
 * - `{ data: [], meta }`
 * - `{ data: { data: [], meta } }`
 */
export function asPaginated<T>(value: unknown): {
  data: T[];
  meta?: UnknownRecord;
} {
  if (!isRecord(value)) return { data: [] };

  const maybeData = value.data;

  if (Array.isArray(maybeData)) {
    return {
      data: maybeData as T[],
      meta: isRecord(value.meta) ? value.meta : undefined,
    };
  }

  if (!isRecord(maybeData)) return { data: [] };

  return {
    data: Array.isArray(maybeData.data) ? (maybeData.data as T[]) : [],
    meta: isRecord(maybeData.meta) ? maybeData.meta : undefined,
  };
}
