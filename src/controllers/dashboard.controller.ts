import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const { filter } = req.query; // 'this_week', 'last_week', 'this_month', 'last_month', 'last_6_months', 'last_year'

        // 1. Calculate Date Range for Chart
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date(); // Default to now

        switch (filter) {
            case 'this_week':
                // Monday of this week
                const day = now.getDay() || 7;
                startDate.setHours(-24 * (day - 1));
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'last_week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7 - (now.getDay() || 7) + 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'last_6_months':
                startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'last_year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                break;
            default:
                // Default to this week
                const d = now.getDay() || 7;
                startDate.setHours(-24 * (d - 1));
                startDate.setHours(0, 0, 0, 0);
        }

        // 2. Execute Queries
        const [
            servicesRes,
            labourLawsRes,
            blogsRes,
            enquiriesRes,
            chartRes,
            recentEnquiriesRes
        ] = await Promise.all([
            // Total Services (Active Only)
            pool.query("SELECT COUNT(*) FROM services WHERE is_visible = true"),

            // Total Labour Law Updates (Active Only + Last Updated)
            pool.query("SELECT COUNT(*) as count, MAX(updated_at) as last_updated FROM labour_law_updates WHERE is_visible = true"),

            // Total Blogs (Published/Visible Only + Last Updated)
            pool.query("SELECT COUNT(*) as count, MAX(created_at) as last_updated FROM blogs WHERE is_visible = true"),

            // Total Enquiries (All Time)
            pool.query('SELECT COUNT(*) FROM enquiries'),

            // Chart Data (Filtered by Time Range)
            pool.query(
                `SELECT status, COUNT(*) as count 
                 FROM enquiries 
                 WHERE created_at >= $1 AND created_at <= $2
                 GROUP BY status`,
                [startDate, endDate]
            ),

            // Recent Enquiries (Latest 4)
            pool.query(
                `SELECT id, name, service_interest, created_at, status 
                 FROM enquiries 
                 ORDER BY created_at DESC 
                 LIMIT 4`
            )
        ]);

        // 3. Format Response
        const chartData = {
            new: 0,
            contacted: 0,
            confirmed: 0,
            closed: 0,
            cancelled: 0
        };

        chartRes.rows.forEach(row => {
            if (chartData.hasOwnProperty(row.status)) {
                // @ts-ignore
                chartData[row.status] = parseInt(row.count);
            }
        });

        res.json({
            metrics: {
                totalServices: parseInt(servicesRes.rows[0].count),
                totalLabourLaws: {
                    count: parseInt(labourLawsRes.rows[0].count),
                    lastUpdated: labourLawsRes.rows[0].last_updated
                },
                totalBlogs: {
                    count: parseInt(blogsRes.rows[0].count),
                    lastUpdated: blogsRes.rows[0].last_updated
                },
                totalEnquiries: parseInt(enquiriesRes.rows[0].count)
            },
            chart: chartData,
            recentEnquiries: recentEnquiriesRes.rows
        });

    } catch (err: any) {
        console.error('DASHBOARD ERROR:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({
            message: 'Internal server error fetching stats',
            error: err.message
        });
    }
};
