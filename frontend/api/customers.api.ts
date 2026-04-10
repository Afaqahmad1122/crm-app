import { apiClient } from "./axios";
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
    const { data } = await apiClient.get<CustomersListResponse>("/customers", {
      params,
    });
    return data;
  },
  create: async (payload: CustomerPayload) => {
    const { data } = await apiClient.post<Customer>("/customers", payload);
    return data;
  },
};
