import type { User, AuthTokens, UserRole } from '@/types/user';

// ==========================================
// 1. COURT OWNER AUTH TYPES
// ==========================================
export interface CourtOwnerLoginRequest {
  email: string;
  password: string;
}

export interface CourtOwnerLoginResponse {
  userId: string;
  email: string;
  fullName: string;
  accessToken: string;
  roleName: UserRole;
  mustChangePassword?: boolean;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

// ==========================================
// 2. USER / PLAYER AUTH TYPES
// ==========================================
export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserRegisterRequest {
  name?: string;
  fullName?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  confirmPassword?: string;
}

export interface UserAuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ==========================================
// 3. ADMIN AUTH TYPES
// ==========================================
export interface AdminLoginRequest {
  usernameOrEmail?: string;
  email?: string;
  password: string;
  twoFactorCode?: string;
}

export interface AdminAuthResponse {
  user: User;
  tokens: AuthTokens;
}
