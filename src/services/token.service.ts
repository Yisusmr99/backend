import jwt, { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTPayload } from '../utils/types';

type ExpiresIn = NonNullable<SignOptions['expiresIn']>;
const asExpires = (v: string | number): ExpiresIn => v as ExpiresIn;

export function signAccessToken(payload: JWTPayload) {
  const opts: SignOptions = { expiresIn: asExpires(env.jwt.accessExpiresIn) };
  return jwt.sign(payload, env.jwt.accessSecret as Secret, opts);
}

export function verifyAccessToken(token: string): JWTPayload {
  const decoded = jwt.verify(token, env.jwt.accessSecret as Secret) as JwtPayload;
  const sub = (decoded as any)?.sub;
  const role = (decoded as any)?.role;
  if (typeof sub !== 'number' || (role !== 'Admin' && role !== 'Cajero' && role !== 'Cliente')) {
    throw new Error('Invalid access token payload');
  }
  return { sub, role };
}

export function signRefreshToken(payload: JWTPayload & { jti: number }) {
  const opts: SignOptions = { expiresIn: asExpires(env.jwt.refreshExpiresIn) };
  return jwt.sign(payload, env.jwt.refreshSecret as Secret, opts);
}

export function verifyRefreshToken(
  token: string
): JWTPayload & { jti: number; iat: number; exp: number } {
  const decoded = jwt.verify(token, env.jwt.refreshSecret as Secret) as JwtPayload & {
    jti?: number;
  };
  const sub = (decoded as any)?.sub;
  const role = (decoded as any)?.role;
  const jti = (decoded as any)?.jti;
  if (
    typeof sub !== 'number' ||
    (role !== 'Admin' && role !== 'Cajero' && role !== 'Cliente') ||
    typeof jti !== 'number'
  ) {
    throw new Error('Invalid refresh token payload');
  }
  return { sub, role, jti, iat: (decoded as any).iat, exp: (decoded as any).exp };
}
