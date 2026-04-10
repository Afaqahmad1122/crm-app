import axios from "axios";
import { getApiBaseUrl } from "@/lib/api/config";

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

