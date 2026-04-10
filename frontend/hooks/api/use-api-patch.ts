"use client";

import type { UseMutationOptions } from "@tanstack/react-query";
import {
  useApiMutation,
  type UseApiMutationConfig,
} from "./use-api-mutation";

export function useApiPatch<TData = unknown, TVariables = void>(
  config: UseApiMutationConfig<TVariables>,
  options?: Omit<
    UseMutationOptions<TData, Error, TVariables>,
    "mutationFn"
  >,
) {
  return useApiMutation<TData, TVariables>("PATCH", config, options);
}
