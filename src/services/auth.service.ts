import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { comparePassword, hashPassword, hashToken, compareToken } from '../utils/crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './token.service';
import { JWTPayload } from '../utils/types';

const userRepo = () => AppDataSource.getRepository(User);
const rtRepo = () => AppDataSource.getRepository(RefreshToken);

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function register(
  email: string,
  password: string,
  role: 'Admin' | 'Cajero' | 'Cliente' = 'Cliente'
) {
  const repo = userRepo();
  const exists = await repo.findOne({ where: { email } });
  if (exists) throw { status: 409, message: 'Email ya registrado' };
  const hashed = await hashPassword(password);
  const user = repo.create({ email, password: hashed, role });
  await repo.save(user);
  return { id: user.id, email: user.email, role: user.role };
}

export async function login(email: string, password: string, ip?: string, userAgent?: string) {
  const repo = userRepo();
  const user = await repo.findOne({ where: { email } });
  if (!user) throw { status: 401, message: 'Credenciales inválidas' };
  const ok = await comparePassword(password, user.password);
  if (!ok) throw { status: 401, message: 'Credenciales inválidas' };

  const payload: JWTPayload = { sub: user.id, role: user.role };
  const accessToken = signAccessToken(payload);

  // Crear refresh token en DB (con hash)
  const rrepo = rtRepo();
  const rt = rrepo.create({
    user,
    tokenHash: 'temp',
    expiresAt: addDays(new Date(), 7),
    userAgent: userAgent || null,
    ip: ip || null,
    revokedAt: null,
    replacedByTokenId: null,
  });
  const saved: RefreshToken = await rrepo.save(rt);
  const refreshToken = signRefreshToken({ ...payload, jti: saved.id });
  saved.tokenHash = await hashToken(refreshToken);
  await rrepo.save(saved);

  return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
}

export async function refresh(oldToken: string, ip?: string, userAgent?: string) {
  const decoded = verifyRefreshToken(oldToken);

  const rrepo = rtRepo();
  const record = await rrepo.findOne({ where: { id: decoded.jti }, relations: ['user'] });
  if (!record) throw { status: 401, message: 'Refresh inválido' };
  if (record.revokedAt) throw { status: 401, message: 'Refresh revocado' };
  if (record.expiresAt < new Date()) throw { status: 401, message: 'Refresh expirado' };

  const matches = await compareToken(oldToken, record.tokenHash);
  if (!matches) throw { status: 401, message: 'Refresh no coincide' };

  // Rotación: revocar el actual, emitir uno nuevo
  record.revokedAt = new Date();
  await rrepo.save(record);

  const payload: JWTPayload = { sub: record.user.id, role: record.user.role };
  const accessToken = signAccessToken(payload);

  const newRt = rrepo.create({
    user: record.user,
    tokenHash: 'temp',
    expiresAt: addDays(new Date(), 7),
    userAgent: userAgent || null,
    ip: ip || null,
    revokedAt: null,
    replacedByTokenId: null,
  });
  const saved: RefreshToken = await rrepo.save(newRt);
  const refreshToken = signRefreshToken({ ...payload, jti: saved.id });
  saved.tokenHash = await hashToken(refreshToken);
  await rrepo.save(saved);

  record.replacedByTokenId = saved.id;
  await rrepo.save(record);

  return { accessToken, refreshToken };
}

export async function logout(refreshToken?: string) {
  if (!refreshToken) return;
  const rrepo = rtRepo();
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const dbToken = await rrepo.findOne({ where: { id: decoded.jti } });
    if (dbToken && !dbToken.revokedAt) {
      dbToken.revokedAt = new Date();
      await rrepo.save(dbToken);
    }
  } catch { /* ignorar token inválido */ }
}

export async function logoutAll(userId: number) {
  const rrepo = rtRepo();
  const tokens = await rrepo.find({ where: { user: { id: userId } as any } });
  for (const t of tokens) if (!t.revokedAt) t.revokedAt = new Date();
  await rrepo.save(tokens);
}
