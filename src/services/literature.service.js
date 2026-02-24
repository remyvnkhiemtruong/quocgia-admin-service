// src/services/literature.service.js
const db = require('../config/db');

const literatureService = {

  // ===============================
  // CREATE
  // ===============================
  async create(data) {
    const {
      title,
      author,
      content,
      genre,
      period,
      image_url,
    } = data;

    const sql = `
      INSERT INTO literature
        (title, author, content, genre, period, image_url)
      VALUES
        ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      title,
      author || null,
      content || null,
      genre || null,
      period || null,
      image_url || null
    ];

    const { rows } = await db.query(sql, values);
    return rows[0];
  },

  // ===============================
  // GET ALL (pagination + filter)
  // ===============================
  async getAll({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    const dataResult = await db.query(
      `
      SELECT *
      FROM literature
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM literature`
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
      `SELECT * FROM literature WHERE id = $1`,
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
      author,
      content,
      genre,
      period,
      image_url
    } = data;

    const { rows } = await db.query(
      `
      UPDATE literature
      SET
        title = $1,
        author = $2,
        content = $3,
        genre = $4,
        period = $5,
        image_url = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
      `,
      [
        title,
        author || null,
        content || null,
        genre || null,
        period || null,
        image_url || null,
        id
      ]
    );

    return rows[0] || null;
  },

  // ===============================
  // DELETE
  // ===============================
  async delete(id) {
    await db.query(
      `DELETE FROM literature WHERE id = $1`,
      [id]
    );
    return true;
  }
};

module.exports = literatureService;