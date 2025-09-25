export type JWTPayload = {
  sub: number; // id entero
  role: 'Admin' | 'Cajero' | 'Cliente';
};
