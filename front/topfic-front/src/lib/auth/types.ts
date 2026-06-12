export interface RegisterRequestData {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequestData {
  email: string;
  password: string;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  bio?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
}

export interface LoginResponseData {
  access_token: string;
  user: UserData;
}

export interface ApiError {
  error: string;
}
