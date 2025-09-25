import { createHash } from 'crypto';

// Hash de contraseñas (simple: SHA-256). Si luego quieres volver a bcrypt,
// solo cambia estas 2 funciones.
export async function hashPassword(password: string): Promise<string> {
  return createHash('sha256').update(password).digest('hex');
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

// Hash de refresh tokens (no guardamos tokens en claro)
export async function hashToken(token: string): Promise<string> {
  return createHash('sha256').update(token).digest('hex');
}

export async function compareToken(token: string, tokenHash: string): Promise<boolean> {
  const hashed = await hashToken(token);
  return hashed === tokenHash;
}
