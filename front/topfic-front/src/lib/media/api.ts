import type {
  MediaSearchResultWithId,
  DeepSearchResult,
  MediaDetail,
  MediaReview,
  RelatedMedia,
} from "./types";
import api from "../api";

export async function quickSearch(query: string, type?: string): Promise<MediaSearchResultWithId[]> {
  const response = await api.get("/medias/search", { params: { q: query, ...(type && type !== "All" ? { type } : {}) } });
  return response.data as MediaSearchResultWithId[];
}

export async function deepSearch(query: string): Promise<DeepSearchResult[]> {
  const response = await api.get("/search/deep", { params: { q: query } });
  return response.data as DeepSearchResult[];
}

export async function getMedia(mediaId: string): Promise<MediaDetail> {
  const response = await api.get(`/medias/${mediaId}`);
  return response.data as MediaDetail;
}

export async function getMediaReviews(mediaId: string): Promise<MediaReview[]> {
  const response = await api.get(`/medias/${mediaId}/reviews`);
  return response.data as MediaReview[];
}

export async function getRelatedMedia(mediaId: string): Promise<RelatedMedia[]> {
  const response = await api.get(`/medias/${mediaId}/related`);
  return response.data as RelatedMedia[];
}

export interface SaveUserMediaPayload {
  status?: string | null;
  rating?: number;
  liked?: boolean;
  review_text?: string;
  consumed_at?: string | null;
}

export async function saveUserMedia(
  userId: string,
  mediaId: string,
  payload: SaveUserMediaPayload,
): Promise<{ action: string }> {
  const response = await api.put(`/users/${userId}/medias/${mediaId}`, payload);
  return response.data;
}

export async function getUserMedia(
  userId: string,
  mediaId: string,
): Promise<{
  media_name: string;
  image: string | null;
  status: string;
  rating: number | null;
  liked?: boolean;
  review_text?: string;
  consumed_at?: string | null;
  updated_at: string;
} | null> {
  try {
    const response = await api.get(`/users/${userId}/medias/${mediaId}`);
    return response.data;
  } catch {
    return null;
  }
}
