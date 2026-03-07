import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendEmail } from '../utils/email';

// PUBLIC: Submit an enquiry
export const submitEnquiry = async (req: Request, res: Response) => {
    const { name, email, phone, service_interest, message } = req.body;

    if (!name || !email || !phone || !service_interest) {
        return res.status(400).json({ message: 'Name, email, phone, and service are required' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO enquiries (name, email, phone, service_interest, message) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [name, email, phone, service_interest, message]);

        res.status(201).json({
            message: 'Enquiry submitted successfully',
            data: result.rows[0]
        });

        // Background: Send Admin Notification Email
        (async () => {
            try {
                // 1. Fetch Admin Notification Email from Settings
                const settingsRes = await pool.query("SELECT value FROM settings WHERE key = 'admin_account_email'");

                let adminEmail = settingsRes.rows[0]?.value;
                if (typeof adminEmail === 'string' && adminEmail.startsWith('"')) {
                    try { adminEmail = JSON.parse(adminEmail); } catch (e) { }
                }

                // Fallback 1: Try contact_email setting
                if (!adminEmail) {
                    const contactRes = await pool.query("SELECT value FROM settings WHERE key = 'contact_email'");
                    adminEmail = contactRes.rows[0]?.value;
                    if (typeof adminEmail === 'string' && adminEmail.startsWith('"')) {
                        try { adminEmail = JSON.parse(adminEmail); } catch (e) { }
                    }
                }

                // Fallback 2: Try first admin in admins table
                if (!adminEmail) {
                    const adminRes = await pool.query("SELECT email FROM admins ORDER BY id ASC LIMIT 1");
                    adminEmail = adminRes.rows[0]?.email;
                }

                if (!adminEmail) {
                    console.log('Skipping admin notification: admin_account_email not configured.');
                    return;
                }

                // 2. Prepare HTML Template
                const dateString = new Date().toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'long',
                    timeStyle: 'short'
                });

                const emailHtml = `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                        <div style="background-color: #f97316; padding: 24px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; tracking: 1px;">New Enquiry Received</h1>
                        </div>
                        <div style="padding: 32px; color: #1e293b; line-height: 1.6;">
                            <p style="margin-top: 0; font-size: 16px;">Hello Admin,</p>
                            <p style="font-size: 14px; color: #64748b;">A new enquiry has been submitted through the TrusComp website. Here are the details:</p>
                            
                            <div style="margin: 24px 0; background-color: #f8fafc; border-radius: 8px; padding: 20px; border-left: 4px solid #f97316;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #64748b; width: 140px; vertical-align: top;">Name:</td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1e293b;">${name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #64748b; vertical-align: top;">Email:</td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1e293b;">
                                            <a href="mailto:${email}" style="color: #f97316; text-decoration: none;">${email}</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #64748b; vertical-align: top;">Mobile Number:</td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1e293b;">${phone}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #64748b; vertical-align: top;">Service Interest:</td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1e293b;">${service_interest}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #64748b; vertical-align: top;">Submission Time:</td>
                                        <td style="padding: 8px 0; font-size: 14px; color: #1e293b;">${dateString} (IST)</td>
                                    </tr>
                                </table>
                            </div>

                            <div style="margin-bottom: 24px;">
                                <p style="font-size: 13px; font-weight: bold; color: #64748b; margin-bottom: 8px;">Message:</p>
                                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; font-size: 14px; color: #334155; font-style: italic;">
                                    ${message || 'No message provided.'}
                                </div>
                            </div>

                            <div style="text-align: center; margin-top: 32px;">
                                <a href="http://truscomp.com/admin" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: bold;">View in Admin Dashboard</a>
                            </div>
                        </div>
                        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} TrusComp. All rights reserved.</p>
                            <p style="margin: 4px 0 0; font-size: 10px; color: #cbd5e1;">This is an automated notification. Please do not reply directly to this email.</p>
                        </div>
                    </div>
                `;

                // 3. Send Email
                await sendEmail(adminEmail, 'New Enquiry Received – TrusComp Website', emailHtml);
                console.log(`Admin notification email sent to ${adminEmail} for enquiry from ${name}`);
            } catch (emailErr: any) {
                // Log failure silently as per requirements
                console.error('Silent failure sending admin notification email:', emailErr.message);
            }
        })();
    } catch (err: any) {
        console.error('Error submitting enquiry:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// ADMIN: Get all enquiries with filtering
export const getAllEnquiries = async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query('SELECT * FROM enquiries ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching enquiries:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ADMIN: Create an enquiry manually
export const createEnquiry = async (req: AuthRequest, res: Response) => {
    const { name, email, phone, service_interest, message, status, notes } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    try {
        const confirmed_at = status === 'confirmed' ? new Date() : null;

        const result = await pool.query(`
            INSERT INTO enquiries (name, email, phone, service_interest, message, status, notes, confirmed_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [name, email, phone, service_interest, message, status || 'new', notes, confirmed_at]);

        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error('Error creating enquiry:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// ADMIN: Update an enquiry
export const updateEnquiry = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, email, phone, service_interest, message, status, notes } = req.body;

    try {
        // Fetch current status to see if it's changing or if it's already locked
        const currentRes = await pool.query('SELECT status, confirmed_at FROM enquiries WHERE id = $1', [id]);
        if (currentRes.rowCount === 0) return res.status(404).json({ message: 'Enquiry not found' });

        const currentEnquiry = currentRes.rows[0];

        // Status Locking: confirmed enquiries cannot be modified
        if (currentEnquiry.status === 'confirmed') {
            return res.status(403).json({ message: 'Confirmed enquiries cannot be edited or modified.' });
        }

        let confirmed_at = currentEnquiry.confirmed_at;

        if (status === 'confirmed' && currentEnquiry.status !== 'confirmed') {
            confirmed_at = new Date();
        } else if (status !== 'confirmed') {
            confirmed_at = null;
        }

        const result = await pool.query(`
            UPDATE enquiries 
            SET name = $1, email = $2, phone = $3, service_interest = $4, 
                message = $5, status = $6, notes = $7, confirmed_at = $8
            WHERE id = $9 RETURNING *
        `, [name, email, phone, service_interest, message, status, notes, confirmed_at, id]);

        res.json(result.rows[0]);
    } catch (err: any) {
        console.error('Error updating enquiry:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// ADMIN: Update enquiry status only
export const updateEnquiryStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'contacted', 'confirmed', 'closed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        // Fetch current status to check locking
        const currentRes = await pool.query('SELECT status FROM enquiries WHERE id = $1', [id]);
        if (currentRes.rowCount === 0) return res.status(404).json({ message: 'Enquiry not found' });

        if (currentRes.rows[0].status === 'confirmed') {
            return res.status(403).json({ message: 'Confirmed enquiries cannot be edited or modified.' });
        }

        // Set confirmed_at to current date if status is 'confirmed', null otherwise
        const confirmed_at = status === 'confirmed' ? new Date() : null;

        const result = await pool.query(
            'UPDATE enquiries SET status = $1, confirmed_at = $2 WHERE id = $3 RETURNING *',
            [status, confirmed_at, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating enquiry status:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ADMIN: Delete an enquiry
export const deleteEnquiry = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM enquiries WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }

        res.json({ message: 'Enquiry deleted successfully' });
    } catch (err) {
        console.error('Error deleting enquiry:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
