export interface JwtPayload {
  sub: string;
  email: string;
  permissions?: string[];
  gty?: string;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
}
