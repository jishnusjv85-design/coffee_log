import 'dotenv/config';
export const env = {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtAccessTtl: process.env.JWT_ACCESS_TTL || '15m',
    jwtRefreshTtl: process.env.JWT_REFRESH_TTL || '30d',
    corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
    currency: process.env.APP_CURRENCY || 'INR',
    faceThreshold: parseFloat(process.env.FACE_VERIFICATION_THRESHOLD || '0.55'),
    allowOutsideGeofence: process.env.ALLOW_PUNCH_OUTSIDE_GEOFENCE === 'true'
};
