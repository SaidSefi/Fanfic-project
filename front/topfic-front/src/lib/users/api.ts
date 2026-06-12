import type { UserProfile, UpdateProfileRequest } from "./types";
import api from "../api";

export async function getUserProfile(username: string): Promise<UserProfile> {
  const response = await api.get(`/users/${username}`);
  return response.data as UserProfile;
}

export async function updateUserProfile(
  username: string,
  data: UpdateProfileRequest
): Promise<UserProfile> {
  const response = await api.put(`/users/${username}`, data);
  return response.data as UserProfile;
}
