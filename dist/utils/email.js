"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const db_1 = __importDefault(require("../config/db"));
const crypto_1 = require("./crypto");
const sendEmail = async (to, subject, html) => {
    try {
        // 1. Fetch SMTP configuration from database
        const result = await db_1.default.query("SELECT value FROM settings WHERE key = 'smtp_config'");
        if (result.rowCount === 0) {
            throw new Error("SMTP configuration not found");
        }
        const smtpConfig = result.rows[0].value;
        // 2. Decrypt password
        const password = (0, crypto_1.decrypt)(smtpConfig.password);
        // 3. Create Transporter
        const transporter = nodemailer_1.default.createTransport({
            host: smtpConfig.host,
            port: parseInt(smtpConfig.port),
            secure: smtpConfig.encryption === 'ssl', // true for 465, false for other ports
            auth: {
                user: smtpConfig.email,
                pass: password
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        // 4. Send Email
        await transporter.sendMail({
            from: smtpConfig.email,
            to,
            subject,
            html
        });
        return { success: true };
    }
    catch (error) {
        console.error("Email send error:", error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
