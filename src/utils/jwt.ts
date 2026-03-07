import jwt from 'jsonwebtoken';

export const generateAccessToken = (payload: object) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, {
        expiresIn: '15m'
    });
};

export const generateRefreshToken = (payload: object) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET as string, {
        expiresIn: '7d'
    });
};
