import { apiGet, apiRequest } from "@/lib/api/client";
import { asPaginated } from "@/lib/api/normalize";
import type { Customer, CustomerPayload } from "@/types/customer.types";

export interface CustomersListResponse {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const customersApi = {
  list: async (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (typeof params?.page === "number") query.set("page", String(params.page));
    if (typeof params?.limit === "number")
      query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);

    const path = query.toString() ? `/customers?${query.toString()}` : "/customers";
    const response = await apiGet<unknown>(path);
    const page = asPaginated<Customer>(response);

    return {
      data: page.data,
      meta: {
        total:
          typeof page.meta?.total === "number" ? page.meta.total : page.data.length,
        page: typeof page.meta?.page === "number" ? page.meta.page : 1,
        limit: typeof page.meta?.limit === "number" ? page.meta.limit : page.data.length,
        totalPages: typeof page.meta?.totalPages === "number" ? page.meta.totalPages : 1,
        hasNextPage:
          typeof page.meta?.hasNextPage === "boolean"
            ? page.meta.hasNextPage
            : false,
        hasPrevPage:
          typeof page.meta?.hasPrevPage === "boolean"
            ? page.meta.hasPrevPage
            : false,
      },
    } satisfies CustomersListResponse;
  },
  create: async (payload: CustomerPayload) => {
    return apiRequest<Customer>("POST", "/customers", { body: payload });
  },
};
