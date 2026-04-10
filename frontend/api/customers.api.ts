import { apiClient } from "./axios";
import type { Customer, CustomerPayload } from "@/types/customer.types";

export const customersApi = {
  list: async () => {
    const { data } = await apiClient.get<Customer[]>("/customers");
    return data;
  },
  create: async (payload: CustomerPayload) => {
    const { data } = await apiClient.post<Customer>("/customers", payload);
    return data;
  },
};
