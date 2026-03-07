import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

// PUBLIC & ADMIN: Get all holidays with optional state filtering
export const getAllHolidays = async (req: Request, res: Response) => {
    const { state_code } = req.query;
    try {
        let query = 'SELECT * FROM holidays';
        const params: any[] = [];
        if (state_code) {
            params.push(state_code);
            query += ' WHERE state_code = $1';
        }
        query += ' ORDER BY holiday_date ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching holidays:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ADMIN: Upsert holiday
export const upsertHoliday = async (req: AuthRequest, res: Response) => {
    const { id, state_code, holiday_date, day_name, holiday_name, holiday_type } = req.body;

    if (!state_code || !holiday_date || !holiday_name) {
        return res.status(400).json({ message: 'State code, date, and holiday name are required' });
    }

    try {
        const result = await pool.query(`
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
    } catch (err: any) {
        console.error('Error upserting holiday:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// ADMIN: Delete holiday
export const deleteHoliday = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM holidays WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Holiday not found' });
        }
        res.json({ message: 'Holiday deleted successfully' });
    } catch (err) {
        console.error('Error deleting holiday:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};
