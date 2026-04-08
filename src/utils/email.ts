import nodemailer from 'nodemailer';
import pool from '../config/db';
import { decrypt } from './crypto';

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        // 1. Fetch SMTP configuration from database
        const result = await pool.query("SELECT value FROM settings WHERE key = 'smtp_config'");

        if (result.rowCount === 0) {
            throw new Error("SMTP configuration not found");
        }

        const smtpConfig = result.rows[0].value;

        // 2. Decrypt password
        const password = decrypt(smtpConfig.password);

        // 3. Create Transporter
        const transporter = nodemailer.createTransport({
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

    } catch (error) {
        console.error("Email send error:", error);
        throw error;
    }
};
