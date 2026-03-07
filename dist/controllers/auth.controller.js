"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.verifyEmailChange = exports.initiateEmailChange = exports.logout = exports.refresh = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const jwt_1 = require("../utils/jwt");
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db_1.default.query('SELECT * FROM admins WHERE email = $1', [email]);
        const admin = result.rows[0];
        // ... rest of login logic is unchanged ...
        if (!admin || !(await bcrypt_1.default.compare(password, admin.password_hash))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        if (admin.status !== 'active') {
            return res.status(403).json({ message: 'Account is deactivated' });
        }
        const payload = { id: admin.id, email: admin.email, role: admin.role };
        const accessToken = (0, jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(payload);
        await db_1.default.query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.json({
            message: 'Login successful',
            user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
        });
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    // ... refresh logic unchanged ...
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token missing' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const accessToken = (0, jwt_1.generateAccessToken)({
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        });
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });
        res.json({ message: 'Token refreshed' });
    }
    catch (err) {
        res.status(403).json({ message: 'Invalid refresh token' });
    }
};
exports.refresh = refresh;
const logout = (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
};
exports.logout = logout;
// Initiate Admin Email Change
const initiateEmailChange = async (req, res) => {
    const { newEmail } = req.body;
    const adminId = req.user?.id;
    if (!newEmail) {
        return res.status(400).json({ message: 'New email is required' });
    }
    try {
        // Check if new email is already in use
        const existing = await db_1.default.query('SELECT id FROM admins WHERE email = $1', [newEmail]);
        if (existing.rowCount && existing.rowCount > 0) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        // Generate verification token (short-lived)
        const token = jsonwebtoken_1.default.sign({ id: adminId, newEmail, type: 'email_change' }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30m' });
        // Store pending change in settings (or could be in admins table, but settings is easier for now as per plan)
        // Key: 'pending_admin_email_change'
        // Value: JSON string { id, email, token } - Actually token inside JWT is self-contained. 
        // We probably don't even need to store it if we trust the stateless JWT.
        // BUT, invalidating old tokens is safer.
        // Let's store the current active token to valid against.
        await db_1.default.query(`
            INSERT INTO settings (key, value) 
            VALUES ($1, $2)
            ON CONFLICT (key) 
            DO UPDATE SET value = EXCLUDED.value
        `, ['pending_admin_email_change', { adminId, newEmail, token }]);
        // Send Verification Email
        const verificationLink = `${process.env.CLIENT_URL || 'http://localhost:8080'}/admin/verify-email?token=${token}`;
        const { sendEmail } = require('../utils/email'); // Lazy load to avoid cycle if any
        await sendEmail(newEmail, 'Verify Your New Admin Email - TrusComp', `
            <h2>Verify Email Change</h2>
            <p>You requested to change your admin login email to this address.</p>
            <p>Please click the button below to verify this email and set your new password.</p>
            <a href="${verificationLink}" style="padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Verify & Set Password</a>
            <p>This link expires in 30 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
            `);
        res.json({ message: 'Verification email sent' });
    }
    catch (err) {
        console.error('Initiate email change error:', err);
        res.status(500).json({ message: 'Failed to initiate email change', error: err.message });
    }
};
exports.initiateEmailChange = initiateEmailChange;
// Verify Email Change and Update
const verifyEmailChange = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }
    try {
        // Verify Token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (decoded.type !== 'email_change') {
            return res.status(400).json({ message: 'Invalid token type' });
        }
        // Check if this token matches the pending one (Security: prevent reuse or others)
        const pending = await db_1.default.query("SELECT value FROM settings WHERE key = 'pending_admin_email_change'");
        if (pending.rowCount === 0) {
            return res.status(400).json({ message: 'No pending email change found or expired' });
        }
        const pendingData = pending.rows[0].value;
        if (pendingData.token !== token) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        // Verify ID matches
        if (pendingData.adminId !== decoded.id || pendingData.newEmail !== decoded.newEmail) {
            return res.status(400).json({ message: 'Token mismatch' });
        }
        // Hash new password
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(newPassword, salt);
        // Update Admin
        await db_1.default.query('BEGIN');
        const updateResult = await db_1.default.query('UPDATE admins SET email = $1, password_hash = $2 WHERE id = $3 RETURNING id', [decoded.newEmail, passwordHash, decoded.id]);
        if (updateResult.rowCount === 0) {
            throw new Error('Admin not found');
        }
        // Clear pending setting
        await db_1.default.query("DELETE FROM settings WHERE key = 'pending_admin_email_change'");
        // Also update the 'admin_account_email' setting for display consistency
        // Use standard upsert pattern
        await db_1.default.query(`
            INSERT INTO settings (key, value) 
            VALUES ($1, $2::jsonb)
            ON CONFLICT (key) 
            DO UPDATE SET value = EXCLUDED.value
        `, ['admin_account_email', JSON.stringify(decoded.newEmail)]);
        await db_1.default.query('COMMIT');
        res.json({ message: 'Email verified and updated successfully. Please login with new credentials.' });
    }
    catch (err) {
        await db_1.default.query('ROLLBACK');
        console.error('Verify email change error:', err);
        if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.verifyEmailChange = verifyEmailChange;
// Request Password Reset
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    try {
        const result = await db_1.default.query('SELECT * FROM admins WHERE email = $1', [email]);
        const admin = result.rows[0];
        // Security: Don't reveal if email exists, just return success
        if (!admin) {
            console.log(`Forgot password requested for non-existent email: ${email}`);
            return res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
        }
        // Generate reset token
        const resetTokenRaw = require('crypto').randomBytes(32).toString('hex');
        const resetTokenHash = require('crypto').createHash('sha256').update(resetTokenRaw).digest('hex');
        const resetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await db_1.default.query('UPDATE admins SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3', [resetTokenHash, resetExpires, admin.id]);
        // Send Email
        const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/reset-password?token=${resetTokenRaw}`;
        const { sendEmail } = require('../utils/email');
        await sendEmail(email, 'Password Reset Request - TrusComp Admin', `
            <h2>Reset Your Password</h2>
            <p>You requested a password reset for your TrusComp admin account.</p>
            <p>Click the button below to set a new password:</p>
            <a href="${resetLink}" style="padding: 10px 20px; background-color: #F97316; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link expires in 15 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
            `);
        res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    }
    catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
exports.forgotPassword = forgotPassword;
// Reset Password
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }
    try {
        const resetTokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
        const result = await db_1.default.query('SELECT * FROM admins WHERE reset_password_token = $1 AND reset_password_expires > $2', [resetTokenHash, Date.now()]);
        const admin = result.rows[0];
        if (!admin) {
            return res.status(400).json({ message: 'Token is invalid or has expired' });
        }
        // Validation: Strong Password (simple check for now, can be enhanced)
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }
        // Hash new password
        const salt = await bcrypt_1.default.genSalt(10);
        const passwordHash = await bcrypt_1.default.hash(newPassword, salt);
        // Update password and clear token
        await db_1.default.query('UPDATE admins SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2', [passwordHash, admin.id]);
        res.json({ message: 'Password has been reset successfully. Please login with your new password.' });
    }
    catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
exports.resetPassword = resetPassword;
