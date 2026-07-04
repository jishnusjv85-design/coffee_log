import argon2 from 'argon2';
import crypto from 'crypto';

export const hashPassword = (pwd: string) => argon2.hash(pwd, { type: argon2.argon2id });
export const verifyPassword = (hash: string, pwd: string) => argon2.verify(hash, pwd);

export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
export const randomToken = (bytes = 48) => crypto.randomBytes(bytes).toString('hex');
