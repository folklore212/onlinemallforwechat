export interface JwtPayload {
  sub: number; // user id
  username?: string;
  userType: string;
  openid?: string;
}