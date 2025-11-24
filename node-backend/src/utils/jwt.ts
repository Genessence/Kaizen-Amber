import jwt from 'jsonwebtoken';
import env from '../config/env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  plantId?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET_KEY, {
    expiresIn: `${env.ACCESS_TOKEN_EXPIRE_MINUTES}m`,
    algorithm: env.JWT_ALGORITHM as jwt.Algorithm,
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = env.JWT_REFRESH_SECRET || env.JWT_SECRET_KEY;
  return jwt.sign(payload, secret, {
    expiresIn: `${env.REFRESH_TOKEN_EXPIRE_DAYS}d`,
    algorithm: env.JWT_ALGORITHM as jwt.Algorithm,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET_KEY, {
      algorithms: [env.JWT_ALGORITHM as jwt.Algorithm],
    }) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const secret = env.JWT_REFRESH_SECRET || env.JWT_SECRET_KEY;
    return jwt.verify(token, secret, {
      algorithms: [env.JWT_ALGORITHM as jwt.Algorithm],
    }) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

