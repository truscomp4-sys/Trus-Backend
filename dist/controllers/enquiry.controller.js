"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEnquiry = exports.updateEnquiryStatus = exports.updateEnquiry = exports.createEnquiry = exports.getAllEnquiries = exports.submitEnquiry = void 0;
const db_1 = __importDefault(require("../config/db"));
// PUBLIC: Submit an enquiry
const submitEnquiry = async (req, res) => {
    const { name, email, phone, service_interest, message } = req.body;
    if (!name || !email || !phone || !service_interest) {
        return res.status(400).json({ message: 'Name, email, phone, and service are required' });
    }
    try {
        const result = await db_1.default.query(`
            INSERT INTO enquiries (name, email, phone, service_interest, message) 
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [name, email, phone, service_interest, message]);
        res.status(201).json({
            message: 'Enquiry submitted successfully',
            data: result.rows[0]
        });
    }
    catch (err) {
        console.error('Error submitting enquiry:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
exports.submitEnquiry = submitEnquiry;
// ADMIN: Get all enquiries with filtering
const getAllEnquiries = async (req, res) => {
    try {
        const result = await db_1.default.query('SELECT * FROM enquiries ORDER BY created_at DESC');
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching enquiries:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllEnquiries = getAllEnquiries;
// ADMIN: Create an enquiry manually
const createEnquiry = async (req, res) => {
    const { name, email, phone, service_interest, message, status, notes } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }
    try {
        const confirmed_at = status === 'confirmed' ? new Date() : null;
        const result = await db_1.default.query(`
            INSERT INTO enquiries (name, email, phone, service_interest, message, status, notes, confirmed_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [name, email, phone, service_interest, message, status || 'new', notes, confirmed_at]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error('Error creating enquiry:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
exports.createEnquiry = createEnquiry;
// ADMIN: Update an enquiry
const updateEnquiry = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, service_interest, message, status, notes } = req.body;
    try {
        // Fetch current status to see if it's changing to confirmed
        const currentRes = await db_1.default.query('SELECT status, confirmed_at FROM enquiries WHERE id = $1', [id]);
        if (currentRes.rowCount === 0)
            return res.status(404).json({ message: 'Enquiry not found' });
        const currentEnquiry = currentRes.rows[0];
        let confirmed_at = currentEnquiry.confirmed_at;
        if (status === 'confirmed' && currentEnquiry.status !== 'confirmed') {
            confirmed_at = new Date();
        }
        else if (status !== 'confirmed') {
            confirmed_at = null;
        }
        const result = await db_1.default.query(`
            UPDATE enquiries 
            SET name = $1, email = $2, phone = $3, service_interest = $4, 
                message = $5, status = $6, notes = $7, confirmed_at = $8
            WHERE id = $9 RETURNING *
        `, [name, email, phone, service_interest, message, status, notes, confirmed_at, id]);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error updating enquiry:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
exports.updateEnquiry = updateEnquiry;
// ADMIN: Update enquiry status only
const updateEnquiryStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['new', 'contacted', 'confirmed', 'closed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    try {
        // Set confirmed_at to current date if status is 'confirmed', null otherwise
        const confirmed_at = status === 'confirmed' ? new Date() : null;
        const result = await db_1.default.query('UPDATE enquiries SET status = $1, confirmed_at = $2 WHERE id = $3 RETURNING *', [status, confirmed_at, id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error updating enquiry status:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.updateEnquiryStatus = updateEnquiryStatus;
// ADMIN: Delete an enquiry
const deleteEnquiry = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query('DELETE FROM enquiries WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }
        res.json({ message: 'Enquiry deleted successfully' });
    }
    catch (err) {
        console.error('Error deleting enquiry:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteEnquiry = deleteEnquiry;
