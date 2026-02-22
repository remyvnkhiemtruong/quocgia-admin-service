const db = require('../config/db');
const fs = require('fs').promises;
const path = require('path');
const BASE_URL = process.env.BASE_URL;

class FineArtService {

    async createMany(urls = []) {
        const insertedIds = [];

        for (const url of urls) {
            const result = await db.query(
                `INSERT INTO fineart (fineart_url)
         VALUES ($1)
         RETURNING id`,
                [url]
            );

            insertedIds.push(result.rows[0].id);
        }

        return { inserted_ids: insertedIds };
    }

    async getAll(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const result = await db.query(
            `SELECT *
       FROM fineart
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await db.query('SELECT COUNT(*) FROM fineart');
        const total = parseInt(countResult.rows[0].count, 10) || 0;

        const base = (BASE_URL && String(BASE_URL).trim()) ? String(BASE_URL).replace(/\/$/, '') : '';
        return {
            data: result.rows.map(row => ({
                ...row,
                fineart_url: row.fineart_url
                    ? (base ? base + row.fineart_url : row.fineart_url)
                    : null
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getById(id) {
        const result = await db.query(
            `SELECT * FROM fineart WHERE id = $1`,
            [id]
        );

        if (!result.rows[0]) return null;

        const fineart = result.rows[0];

        const base = (BASE_URL && String(BASE_URL).trim()) ? String(BASE_URL).replace(/\/$/, '') : '';
        return {
            ...fineart,
            fineart_url: fineart.fineart_url
                ? (base ? base + fineart.fineart_url : fineart.fineart_url)
                : null
        };
    }

    async delete(id) {
        // Lấy file trước khi xóa
        const result = await db.query(
            `SELECT fineart_url FROM fineart WHERE id = $1`,
            [id]
        );

        const fineart = result.rows[0];

        await db.query(
            `DELETE FROM fineart WHERE id = $1`,
            [id]
        );

        // Xóa file vật lý nếu tồn tại
        if (fineart?.fineart_url) {
            try {
                await fs.unlink(
                    path.join(__dirname, '../..', fineart.fineart_url)
                );
            } catch (err) {
                console.error('Failed to delete fineart file:', err.message);
            }
        }
    }
}

module.exports = new FineArtService();
