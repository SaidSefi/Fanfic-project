import type { RegisterRequestData, LoginRequestData, LoginResponseData, ApiError } from "./types";
import api from "../api";

export async function registerUser(data: RegisterRequestData): Promise<LoginResponseData | ApiError> {
  const response = await api.post(`/auth/signup`, data).catch((err) => err.response);

  if (!response || response.status < 200 || response.status >= 300) {
    const errorData: ApiError = response?.data || { error: 'Network error' };
    return errorData;
  }

  return response.data as LoginResponseData;
}

export async function loginUser(data: LoginRequestData): Promise<LoginResponseData | ApiError> {
  const response = await api.post(`/auth/login`, data).catch((err) => err.response);

  if (!response || response.status < 200 || response.status >= 300) {
    const errorData: ApiError = response?.data || { error: 'Network error' };
    return errorData;
  }

  return response.data as LoginResponseData;
}
