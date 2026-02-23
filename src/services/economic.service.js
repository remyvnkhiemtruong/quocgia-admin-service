// src/services/economic.service.js
const db = require('../config/db');

const economicService = {

  // ===============================
  // CREATE
  // ===============================
  async create(data) {
    const client = await db.pool.connect();

    try {
      const {
        title,
        sector,
        content,
        analysis_text,
        source,
        image_url,
        distributions = []
      } = data;

      console.log('Service create image_url', image_url);
      await client.query('BEGIN');

      // Validate percentage sum
      const totalPercentage = distributions.reduce(
        (sum, d) => sum + Number(d.percentage || 0),
        0
      );

      if (totalPercentage > 100) {
        throw new Error('Total percentage cannot exceed 100');
      }

      // Insert main economic record
      const economicResult = await client.query(
        `
        INSERT INTO economic_data
          (title, sector, content, analysis_text, source)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [
          title,
          sector,
          content,
          analysis_text || null,
          source || null
        ]
      );

      const economic = economicResult.rows[0];

      if (image_url) {
        await client.query(
          `
        INSERT INTO economic_media
          (economic_data_id, media_type, file_url)
        VALUES ($1, $2, $3)
    `,
          [
            economic.id,
            'image',
            image_url
          ]
        );
      }


      // Insert distributions
      for (const dist of distributions) {
        await client.query(
          `
          INSERT INTO economic_distribution
            (economic_data_id, component_name, percentage)
          VALUES ($1, $2, $3)
          `,
          [
            economic.id,
            dist.component_name,
            dist.percentage
          ]
        );
      }

      await client.query('COMMIT');
      return await this.getById(economic.id);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // ===============================
  // GET ALL
  // ===============================
  async getAll({ page = 1, limit = 10, sector }) {
    const offset = (page - 1) * limit;

    const values = [];
    let whereClause = '';
    let idx = 1;

    if (sector) {
      whereClause = `WHERE ed.sector = $${idx}`;
      values.push(sector);
      idx++;
    }

    values.push(limit, offset);

    const dataResult = await db.query(
      `
      SELECT
        ed.*,

        -- distribution
        COALESCE(
          json_agg(
            json_build_object(
              'id', dist.id,
              'component_name', dist.component_name,
              'percentage', dist.percentage
            )
          ) FILTER (WHERE dist.id IS NOT NULL),
          '[]'
        ) AS distributions,

        -- media
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', media.id,
              'media_type', media.media_type,
              'file_url', media.file_url
            )
          ) FILTER (WHERE media.id IS NOT NULL),
          '[]'
        ) AS media
      FROM economic_data ed
      LEFT JOIN economic_distribution dist
        ON ed.id = dist.economic_data_id
      LEFT JOIN economic_media media
        ON ed.id = media.economic_data_id
      ${whereClause}
      GROUP BY ed.id
      ORDER BY ed.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
      `,
      values
    );

    const countResult = await db.query(
      `
      SELECT COUNT(*) FROM economic_data
      ${sector ? 'WHERE sector = $1' : ''}
      `,
      sector ? [sector] : []
    );

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: Number(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    };
  },

  // ===============================
  // GET BY ID
  // ===============================
  async getById(id) {
    const result = await db.query(
      `
      SELECT
        ed.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', dist.id,
              'component_name', dist.component_name,
              'percentage', dist.percentage
            )
          ) FILTER (WHERE dist.id IS NOT NULL),
          '[]'
        ) AS distributions,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', media.id,
              'media_type', media.media_type,
              'file_url', media.file_url
            )
          ) FILTER (WHERE media.id IS NOT NULL),
          '[]'
        ) AS media
      FROM economic_data ed
      LEFT JOIN economic_distribution dist
        ON ed.id = dist.economic_data_id
      LEFT JOIN economic_media media
        ON ed.id = media.economic_data_id
      WHERE ed.id = $1
      GROUP BY ed.id
      `,
      [id]
    );

    return result.rows[0] || null;
  },

  // ===============================
  // UPDATE
  // ===============================
  async update(id, data) {
    const client = await db.pool.connect();

    try {
      const {
        title,
        sector,
        content,
        analysis_text,
        source,
        distributions = [],
        image_url,
      } = data;

      await client.query('BEGIN');

      const totalPercentage = distributions.reduce(
        (sum, d) => sum + Number(d.percentage || 0),
        0
      );

      if (totalPercentage > 100) {
        throw new Error('Total percentage cannot exceed 100');
      }

      await client.query(
        `
        UPDATE economic_data
        SET
          title = $1,
          sector = $2,
          content = $3,
          analysis_text = $4,
          source = $5,
          updated_at = NOW()
        WHERE id = $6
        `,
        [
          title,
          sector,
          content,
          analysis_text || null,
          source || null,
          id
        ]
      );

      await client.query(
        `DELETE FROM economic_distribution WHERE economic_data_id = $1`,
        [id]
      );

      // Xóa media cũ
      await client.query(
        `DELETE FROM economic_media WHERE economic_data_id = $1`,
        [id]
      );

      // Insert lại nếu có image_url
      if (image_url) {
        await client.query(
          `
        INSERT INTO economic_media
          (economic_data_id, media_type, file_url)
        VALUES ($1, $2, $3)
        `,
          [
            id,
            'image',
            image_url
          ]
        );
      }


      for (const dist of distributions) {
        await client.query(
          `
          INSERT INTO economic_distribution
            (economic_data_id, component_name, percentage)
          VALUES ($1, $2, $3)
          `,
          [
            id,
            dist.component_name,
            dist.percentage
          ]
        );
      }



      await client.query('COMMIT');
      return await this.getById(id);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // ===============================
  // DELETE
  // ===============================
  async delete(id) {
    await db.query(
      `DELETE FROM economic_data WHERE id = $1`,
      [id]
    );
    return true;
  }

};

module.exports = economicService;