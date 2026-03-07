"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = exports.verifyJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyJWT = (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
exports.verifyJWT = verifyJWT;
const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};
exports.isAdmin = isAdmin;
