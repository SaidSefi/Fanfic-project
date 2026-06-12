export interface UserProfile {
  username: string;
  avatar: string | null;
  bio: string | null;
  joined_at: string | null;
  followers_count: number;
  following_count: number;
}

export interface UpdateProfileRequest {
  username?: string;
  avatar_url?: string | null;
  bio?: string | null;
}
