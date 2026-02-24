// src/services/geography.service.js
const db = require('../config/db');

const geographyService = {

  // ===============================
  // CREATE
  // ===============================
  async create(data) {
    const {
      title,
      region,
      terrain,
      area,
      content,
      image_url
    } = data;

    const sql = `
      INSERT INTO geography
        (title, region, terrain, area, content, image_url)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      title,
      region || null,
      terrain || null,
      area || null,
      content || null,
      image_url || null
    ];

    const { rows } = await db.query(sql, values);
    return rows[0];
  },

  // ===============================
  // GET ALL (pagination + filter)
  // ===============================
  async getAll({ page = 1, limit = 10, terrain }) {
    const offset = (page - 1) * limit;
    const values = [];
    let whereClause = '';
    let idx = 1;

    if (terrain) {
      whereClause = `WHERE terrain = $${idx}`;
      values.push(terrain);
      idx++;
    }

    values.push(limit, offset);

    const dataResult = await db.query(
      `
      SELECT *
      FROM geography
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
      `,
      values
    );

    const countResult = await db.query(
      `
      SELECT COUNT(*) FROM geography
      ${terrain ? 'WHERE terrain = $1' : ''}
      `,
      terrain ? [terrain] : []
    );

    const total = Number(countResult.rows[0].count);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // ===============================
  // GET BY ID
  // ===============================
  async getById(id) {
    const { rows } = await db.query(
      `
      SELECT *
      FROM geography
      WHERE id = $1
      `,
      [id]
    );

    return rows[0] || null;
  },

  // ===============================
  // UPDATE
  // ===============================
  async update(id, data) {
    const {
      title,
      region,
      terrain,
      area,
      content,
      image_url
    } = data;

    const sql = `
      UPDATE geography
      SET
        title = $1,
        region = $2,
        terrain = $3,
        area = $4,
        content = $5,
        image_url = $6
      WHERE id = $7
      RETURNING *
    `;

    const values = [
      title,
      region || null,
      terrain || null,
      area || null,
      content || null,
      image_url || null,
      id
    ];

    const { rows } = await db.query(sql, values);
    return rows[0] || null;
  },

  // ===============================
  // DELETE
  // ===============================
  async delete(id) {
    await db.query(
      `DELETE FROM geography WHERE id = $1`,
      [id]
    );
    return true;
  }
};

module.exports = geographyService;