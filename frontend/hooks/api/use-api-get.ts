"use client";

import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";

type UseApiGetOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, QueryKey>,
  "queryKey" | "queryFn"
> & {
  queryKey?: QueryKey;
  /** Extra headers for the GET request */
  headers?: Record<string, string>;
};

/**
 * Reusable GET + `useQuery`. Pass `path: null` to keep the query disabled.
 */
export function useApiGet<TData>(
  path: string | null,
  options?: UseApiGetOptions<TData>,
) {
  const { queryKey: queryKeyOption, headers, ...queryOptions } = options ?? {};
  const queryKey = queryKeyOption ?? (["api", "GET", path] as const);

  return useQuery({
    ...queryOptions,
    queryKey,
    queryFn: ({ signal }) =>
      apiGet<TData>(path as string, { signal, headers }),
    enabled: (queryOptions.enabled ?? true) && path != null && path !== "",
  });
}
