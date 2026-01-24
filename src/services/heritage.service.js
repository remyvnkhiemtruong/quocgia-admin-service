// src/services/heritage.service.js
const db = require('../config/db');
const translationService = require('./translation.service');
const ttsService = require('./tts.service');
const { SUPPORTED_LANGUAGES } = require('../utils/constants');
const fs = require('fs').promises;
const path = require('path');

class HeritageService {
  // Tạo di sản mới + dịch + tạo audio cho 4 ngôn ngữ
  async create(data, files) {
    const {
      name, information, year_built, year_ranked, ranking_type,
      address, commune, district, province, notes, input_lang = 'vi'
    } = data;

    // 1. Insert heritage
    const heritageResult = await db.query(
      `INSERT INTO heritages (year_built, year_ranked, ranking_type, address, commune, district, province, image_url, notes, original_lang)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        year_built, year_ranked, ranking_type, address, commune, district, province,
        files?.image?.[0]?.filename ? `/uploads/images/${files.image[0].filename}` : null,
        notes, input_lang
      ]
    );
    const heritageId = heritageResult.rows[0].id;
    console.log(`[Heritage] Created ID: ${heritageId}`);


    const uploadedAudioPath = files?.audio?.[0]?.filename
      ? `/uploads/audio/${files.audio[0].filename}`
      : null;

    // 2. Xử lý tất cả 4 ngôn ngữ
    for (const lang of SUPPORTED_LANGUAGES) {
      try {
        let translatedName = name;
        let translatedInfo = information;

        // Dịch nếu không phải ngôn ngữ gốc
        if (lang.code !== input_lang) {
          console.log(`[Translation] ${input_lang} → ${lang.code}...`);
          translatedName = await translationService.translate(name, input_lang, lang.code);
          translatedInfo = await translationService.translate(information, input_lang, lang.code);
        }

        // Tạo audio từ information
        // const audioFilename = `${heritageId}_${lang.code}.wav`;
        // console.log(`[TTS] Generating ${audioFilename}...`);
        // const audioUrl = await ttsService.generateAudio(translatedInfo, lang.code, audioFilename);

        let audioUrl = null;

        if (lang.code === input_lang && uploadedAudioPath) {
          // ✅ Use manually uploaded audio
          console.log(`[Audio] Using uploaded audio for ${lang.code}`);
          audioUrl = uploadedAudioPath;
        } else {
          // 🤖 Generate TTS for other languages
          const audioFilename = `${heritageId}_${lang.code}.wav`;
          console.log(`[TTS] Generating ${audioFilename}...`);
          audioUrl = await ttsService.generateAudio(translatedInfo, lang.code, audioFilename);
        }

        // Lưu vào DB
        await db.query(
          `INSERT INTO heritage_translations (heritage_id, lang, name, information, audio_url)
           VALUES ($1, $2, $3, $4, $5)`,
          [heritageId, lang.code, translatedName, translatedInfo, audioUrl]
        );

        console.log(`[Heritage] Saved translation: ${lang.code}`);
      } catch (err) {
        console.error(`[Error] Processing ${lang.code}:`, err.message);

        // Vẫn lưu với text gốc nếu dịch/TTS lỗi
        await db.query(
          `INSERT INTO heritage_translations (heritage_id, lang, name, information, audio_url)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (heritage_id, lang) DO NOTHING`,
          [heritageId, lang.code, name, information, null]
        );
      }
    }

    return { id: heritageId };
  }

  // Lấy danh sách theo ngôn ngữ
  async getAll(lang = 'vi', page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT h.id, h.year_built, h.year_ranked, h.ranking_type,
              h.address, h.commune, h.district, h.province, h.image_url,
              t.name, t.information, t.audio_url
       FROM heritages h
       LEFT JOIN heritage_translations t ON h.id = t.heritage_id AND t.lang = $1
       ORDER BY h.created_at DESC
       LIMIT $2 OFFSET $3`,
      [lang, limit, offset]
    );

    const countResult = await db.query('SELECT COUNT(*) FROM heritages');
    const total = parseInt(countResult.rows[0].count);

    return {
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  // Lấy chi tiết theo ngôn ngữ
  async getById(id, lang = 'vi') {
    const result = await db.query(
      `SELECT h.*, t.name, t.information, t.audio_url, t.lang as current_lang
       FROM heritages h
       LEFT JOIN heritage_translations t ON h.id = t.heritage_id AND t.lang = $2
       WHERE h.id = $1`,
      [id, lang]
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Lấy danh sách ngôn ngữ có sẵn
    const langsResult = await db.query(
      'SELECT lang FROM heritage_translations WHERE heritage_id = $1',
      [id]
    );

    return {
      ...result.rows[0],
      available_languages: langsResult.rows.map(r => r.lang)
    };
  }

  // Xóa
  async delete(id) {
    // Lấy thông tin files để xóa
    const translations = await db.query(
      'SELECT audio_url FROM heritage_translations WHERE heritage_id = $1',
      [id]
    );
    const heritage = await db.query(
      'SELECT image_url FROM heritages WHERE id = $1',
      [id]
    );

    // Xóa DB (cascade sẽ xóa translations)
    await db.query('DELETE FROM heritages WHERE id = $1', [id]);

    // Xóa audio files
    for (const t of translations.rows) {
      if (t.audio_url) {
        try {
          await fs.unlink(path.join(__dirname, '../..', t.audio_url));
        } catch (e) {
          console.error(`Failed to delete: ${t.audio_url}`);
        }
      }
    }

    // Xóa image file
    if (heritage.rows[0]?.image_url) {
      try {
        await fs.unlink(path.join(__dirname, '../..', heritage.rows[0].image_url));
      } catch (e) {
        console.error(`Failed to delete: ${heritage.rows[0].image_url}`);
      }
    }

    return true;
  }
}

module.exports = new HeritageService();