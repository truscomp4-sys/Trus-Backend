import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
    };
}

export const verifyJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Log for debugging
    console.log(`[Auth] Header: ${req.headers.authorization}`);

    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
        } else if (parts.length === 1) {
            token = parts[0]; // Support raw token if sent without Bearer
        }
    }

    if (!token) {
        console.log('[Auth] No token found');
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as any;
        req.user = decoded;
        next();
    } catch (err: any) {
        console.log(`[Auth] Verification failed: ${err.message}`);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};
