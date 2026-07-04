import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export function signAccess(payload) {
    return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl });
}
export function signRefresh(payload) {
    return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl });
}
export function verifyAccess(token) {
    return jwt.verify(token, env.jwtAccessSecret);
}
export function verifyRefresh(token) {
    return jwt.verify(token, env.jwtRefreshSecret);
}
