import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccess(payload: object) {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl });
}
export function signRefresh(payload: object) {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl });
}
export function verifyAccess<T=any>(token: string): T {
  return jwt.verify(token, env.jwtAccessSecret) as T;
}
export function verifyRefresh<T=any>(token: string): T {
  return jwt.verify(token, env.jwtRefreshSecret) as T;
}
