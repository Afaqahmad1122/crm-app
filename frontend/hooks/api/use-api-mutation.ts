"use client";

import {
  useMutation,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { apiRequest, type ApiRequestInit } from "@/lib/api/client";

export type ApiPathResolver<TVariables> =
  | string
  | ((variables: TVariables) => string);

export type UseApiMutationConfig<TVariables> = {
  path: ApiPathResolver<TVariables>;
  /**
   * Custom JSON body. If omitted, POST/PUT/PATCH send `variables` as JSON;
   * DELETE sends no body unless you set this.
   */
  body?: (variables: TVariables) => unknown;
  /** Extra headers merged into each request */
  headers?: Record<string, string>;
};

/**
 * Low-level mutation hook (method + path + body rules). Prefer `useApiPost` / `useApiPut` / etc.
 */
export function useApiMutation<TData = unknown, TVariables = void>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  config: UseApiMutationConfig<TVariables>,
  options?: Omit<
    UseMutationOptions<TData, Error, TVariables>,
    "mutationFn"
  >,
) {
  return useMutation({
    ...options,
    mutationFn: async (variables: TVariables) => {
      const path =
        typeof config.path === "function"
          ? config.path(variables)
          : config.path;

      let body: unknown;
      if (config.body) {
        body = config.body(variables);
      } else if (method === "DELETE") {
        body = undefined;
      } else {
        body = variables as unknown;
      }

      const init: ApiRequestInit = {
        headers: config.headers,
        ...(body !== undefined ? { body } : {}),
      };

      return apiRequest<TData>(method, path, init);
    },
  });
}
