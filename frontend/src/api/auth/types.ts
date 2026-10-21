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
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  gender?: number; // 0 = Male, 1 = Female, 2 = Other
}

export interface ForgotPasswordRequest {
  email: string;
  clientResetUrl?: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
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
