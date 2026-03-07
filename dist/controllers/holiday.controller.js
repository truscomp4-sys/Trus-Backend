"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteHoliday = exports.upsertHoliday = exports.getAllHolidays = void 0;
const db_1 = __importDefault(require("../config/db"));
// PUBLIC & ADMIN: Get all holidays with optional state filtering
const getAllHolidays = async (req, res) => {
    const { state_code } = req.query;
    try {
        let query = 'SELECT * FROM holidays';
        const params = [];
        if (state_code) {
            params.push(state_code);
            query += ' WHERE state_code = $1';
        }
        query += ' ORDER BY holiday_date ASC';
        const result = await db_1.default.query(query, params);
        res.json(result.rows);
    }
    catch (err) {
        console.error('Error fetching holidays:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.getAllHolidays = getAllHolidays;
// ADMIN: Upsert holiday
const upsertHoliday = async (req, res) => {
    const { id, state_code, holiday_date, day_name, holiday_name, holiday_type } = req.body;
    if (!state_code || !holiday_date || !holiday_name) {
        return res.status(400).json({ message: 'State code, date, and holiday name are required' });
    }
    try {
        const result = await db_1.default.query(`
            INSERT INTO holidays (id, state_code, holiday_date, day_name, holiday_name, holiday_type)
            VALUES (COALESCE($1, nextval('holidays_id_seq')), $2, $3, $4, $5, $6)
            ON CONFLICT (id) 
            DO UPDATE SET 
                state_code = EXCLUDED.state_code,
                holiday_date = EXCLUDED.holiday_date,
                day_name = EXCLUDED.day_name,
                holiday_name = EXCLUDED.holiday_name,
                holiday_type = EXCLUDED.holiday_type
            RETURNING *
        `, [id || null, state_code, holiday_date, day_name, holiday_name, holiday_type || 'Gazetted']);
        res.json(result.rows[0]);
    }
    catch (err) {
        console.error('Error upserting holiday:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};
exports.upsertHoliday = upsertHoliday;
// ADMIN: Delete holiday
const deleteHoliday = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db_1.default.query('DELETE FROM holidays WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Holiday not found' });
        }
        res.json({ message: 'Holiday deleted successfully' });
    }
    catch (err) {
        console.error('Error deleting holiday:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.deleteHoliday = deleteHoliday;
