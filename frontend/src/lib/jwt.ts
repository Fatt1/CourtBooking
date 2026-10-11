/**
 * JWT Utility functions for decoding and validating JWT tokens in frontend
 */

export interface DecodedJwt {
  sub?: string;
  nameid?: string;
  email?: string;
  name?: string;
  role?: string | string[];
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
  accountType?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Decode JWT token payload safely without external dependencies
 */
export function decodeJwt(token: string | null | undefined): DecodedJwt | null {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    // Chuyển Base64Url sang Base64 chuẩn
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode UTF-8 string an toàn
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as DecodedJwt;
  } catch {
    return null;
  }
}

/**
 * Kiểm tra xem JWT token có hợp lệ về mặt cấu trúc và chưa hết hạn hay không
 * @param token chuỗi JWT
 */
export function isJwtValid(token: string | null | undefined): boolean {
  if (!token) return false;
  const decoded = decodeJwt(token);
  if (!decoded) return false;

  if (typeof decoded.exp === 'number') {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    // Token đã hết hạn
    if (decoded.exp <= nowInSeconds) {
      return false;
    }
  }

  return true;
}

/**
 * Kiểm tra xem JWT token đã hết hạn hay chưa
 */
export function isJwtExpired(token: string | null | undefined): boolean {
  return !isJwtValid(token);
}

/**
 * Trích xuất danh sách vai trò (roles) từ payload của JWT Token
 */
export function getJwtRoles(token: string | null | undefined): string[] {
  const decoded = decodeJwt(token);
  if (!decoded) return [];

  const rawRole =
    decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
    decoded.role ||
    decoded.accountType;

  if (!rawRole) return [];

  if (Array.isArray(rawRole)) {
    return rawRole.map(String);
  }

  return [String(rawRole)];
}
