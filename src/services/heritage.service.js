// src/services/heritage.service.js
const db = require('../config/db');
const translationService = require('./translation.service');
const ttsService = require('./tts.service');
const { SUPPORTED_LANGUAGES } = require('../utils/constants');
const fs = require('fs').promises;
const path = require('path');
const BASE_URL = process.env.BASE_URL;

class HeritageService {
  // Tạo di sản mới + dịch + tạo audio cho 4 ngôn ngữ
  async create(data, files) {
    const {
      name, information, year_built, year_ranked, ranking_type,
      address, commune, district, province, notes, input_lang = 'vi',
      youtube_links = [] // Array of YouTube links
    } = data;

    // Parse youtube_links if it's a string
    const parsedYoutubeLinks = typeof youtube_links === 'string' 
      ? JSON.parse(youtube_links) 
      : youtube_links;

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

    // 2. Insert multiple images (gallery)
    if (files?.gallery && files.gallery.length > 0) {
      for (let i = 0; i < files.gallery.length; i++) {
        const imageUrl = `/uploads/gallery/${files.gallery[i].filename}`;
        await db.query(
          `INSERT INTO heritage_media (heritage_id, media_type, media_url, display_order)
           VALUES ($1, $2, $3, $4)`,
          [heritageId, 'image', imageUrl, i]
        );
      }
      console.log(`[Heritage] Added ${files.gallery.length} gallery images`);
    }

    // 3. Insert YouTube links
    if (parsedYoutubeLinks && parsedYoutubeLinks.length > 0) {
      for (let i = 0; i < parsedYoutubeLinks.length; i++) {
        const link = parsedYoutubeLinks[i];
        if (link && link.trim()) {
          await db.query(
            `INSERT INTO heritage_media (heritage_id, media_type, media_url, display_order)
             VALUES ($1, $2, $3, $4)`,
            [heritageId, 'youtube', link.trim(), files?.gallery?.length || 0 + i]
          );
        }
      }
      console.log(`[Heritage] Added ${parsedYoutubeLinks.length} YouTube links`);
    }

    const uploadedAudioPath = files?.audio?.[0]?.filename
      ? `/uploads/audio/${files.audio[0].filename}`
      : null;

    // 4. Xử lý tất cả 4 ngôn ngữ
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

  // Cập nhật di sản
  async update(id, data, files) {
    const {
      name, information, year_built, year_ranked, ranking_type,
      address, commune, district, province, notes, input_lang = 'vi',
      regenerate_translations = false, // Option để tạo lại bản dịch
      youtube_links = [], // Array of YouTube links
      keep_media_ids = [] // Array of media IDs to keep (for managing deletions)
    } = data;

    // Parse arrays if they're strings
    const parsedYoutubeLinks = typeof youtube_links === 'string' 
      ? JSON.parse(youtube_links) 
      : youtube_links;
    const parsedKeepMediaIds = typeof keep_media_ids === 'string'
      ? JSON.parse(keep_media_ids)
      : keep_media_ids;

    // 1. Lấy thông tin cũ
    const oldHeritage = await db.query('SELECT * FROM heritages WHERE id = $1', [id]);
    if (oldHeritage.rows.length === 0) {
      throw new Error('Heritage not found');
    }

    const oldData = oldHeritage.rows[0];

    // 2. Xử lý image mới (nếu có)
    let imageUrl = oldData.image_url;
    if (files?.image?.[0]?.filename) {
      // Xóa ảnh cũ
      if (oldData.image_url) {
        try {
          await fs.unlink(path.join(__dirname, '../..', oldData.image_url));
          console.log(`[Update] Deleted old image: ${oldData.image_url}`);
        } catch (e) {
          console.error(`[Update] Failed to delete old image: ${e.message}`);
        }
      }
      imageUrl = `/uploads/images/${files.image[0].filename}`;
    }

    // 3. Update bảng heritages
    await db.query(
      `UPDATE heritages SET
        year_built = $1, year_ranked = $2, ranking_type = $3,
        address = $4, commune = $5, district = $6, province = $7,
        image_url = $8, notes = $9, original_lang = $10, updated_at = NOW()
       WHERE id = $11`,
      [year_built, year_ranked, ranking_type, address, commune, district, province,
        imageUrl, notes, input_lang, id]
    );
    console.log(`[Heritage] Updated ID: ${id}`);

    // 4. Handle media deletion (images and videos not in keep list)
    if (parsedKeepMediaIds && parsedKeepMediaIds.length > 0) {
      const mediaToDelete = await db.query(
        `SELECT id, media_type, media_url FROM heritage_media 
         WHERE heritage_id = $1 AND id NOT IN (${parsedKeepMediaIds.map((_, i) => `$${i + 2}`).join(',')})`,
        [id, ...parsedKeepMediaIds]
      );

      for (const media of mediaToDelete.rows) {
        // Delete file if it's an image
        if (media.media_type === 'image') {
          try {
            await fs.unlink(path.join(__dirname, '../..', media.media_url));
            console.log(`[Update] Deleted media file: ${media.media_url}`);
          } catch (e) {
            console.error(`[Update] Failed to delete media: ${e.message}`);
          }
        }
      }

      // Delete from database
      await db.query(
        `DELETE FROM heritage_media 
         WHERE heritage_id = $1 AND id NOT IN (${parsedKeepMediaIds.map((_, i) => `$${i + 2}`).join(',')})`,
        [id, ...parsedKeepMediaIds]
      );
      console.log(`[Update] Cleaned up media not in keep list`);
    }

    // 5. Add new gallery images
    if (files?.gallery && files.gallery.length > 0) {
      const maxOrderResult = await db.query(
        'SELECT COALESCE(MAX(display_order), -1) as max_order FROM heritage_media WHERE heritage_id = $1',
        [id]
      );
      let nextOrder = maxOrderResult.rows[0].max_order + 1;

      for (const file of files.gallery) {
        const imageUrl = `/uploads/gallery/${file.filename}`;
        await db.query(
          `INSERT INTO heritage_media (heritage_id, media_type, media_url, display_order)
           VALUES ($1, $2, $3, $4)`,
          [id, 'image', imageUrl, nextOrder++]
        );
      }
      console.log(`[Update] Added ${files.gallery.length} new gallery images`);
    }

    // 6. Add new YouTube links
    if (parsedYoutubeLinks && parsedYoutubeLinks.length > 0) {
      // Delete old YouTube links first
      await db.query(
        'DELETE FROM heritage_media WHERE heritage_id = $1 AND media_type = $2',
        [id, 'youtube']
      );

      const maxOrderResult = await db.query(
        'SELECT COALESCE(MAX(display_order), -1) as max_order FROM heritage_media WHERE heritage_id = $1',
        [id]
      );
      let nextOrder = maxOrderResult.rows[0].max_order + 1;

      for (const link of parsedYoutubeLinks) {
        if (link && link.trim()) {
          await db.query(
            `INSERT INTO heritage_media (heritage_id, media_type, media_url, display_order)
             VALUES ($1, $2, $3, $4)`,
            [id, 'youtube', link.trim(), nextOrder++]
          );
        }
      }
      console.log(`[Update] Updated YouTube links`);
    }

    // 7. Kiểm tra xem có cần cập nhật translations không
    const oldTranslation = await db.query(
      'SELECT name, information FROM heritage_translations WHERE heritage_id = $1 AND lang = $2',
      [id, input_lang]
    );

    const nameChanged = oldTranslation.rows[0]?.name !== name;
    const infoChanged = oldTranslation.rows[0]?.information !== information;
    const shouldRegenerate = regenerate_translations === 'true' || regenerate_translations === true;

    // 8. Xử lý audio upload mới
    const uploadedAudioPath = files?.audio?.[0]?.filename
      ? `/uploads/audio/${files.audio[0].filename}`
      : null;

    // 9. Cập nhật translations
    if (nameChanged || infoChanged || shouldRegenerate) {
      console.log(`[Update] Content changed or regenerate requested, updating translations...`);

      // Xóa audio files cũ nếu information thay đổi
      if (infoChanged || shouldRegenerate) {
        const oldAudios = await db.query(
          'SELECT audio_url FROM heritage_translations WHERE heritage_id = $1',
          [id]
        );
        for (const audio of oldAudios.rows) {
          if (audio.audio_url && !audio.audio_url.includes(files?.audio?.[0]?.filename || 'KEEP')) {
            try {
              await fs.unlink(path.join(__dirname, '../..', audio.audio_url));
              console.log(`[Update] Deleted old audio: ${audio.audio_url}`);
            } catch (e) { }
          }
        }
      }

      // Cập nhật cho từng ngôn ngữ
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

          let audioUrl = null;

          // Xử lý audio
          if (infoChanged || shouldRegenerate) {
            if (lang.code === input_lang && uploadedAudioPath) {
              audioUrl = uploadedAudioPath;
              console.log(`[Audio] Using uploaded audio for ${lang.code}`);
            } else {
              const audioFilename = `${id}_${lang.code}.wav`;
              console.log(`[TTS] Generating ${audioFilename}...`);
              audioUrl = await ttsService.generateAudio(translatedInfo, lang.code, audioFilename);
            }
          } else {
            // Giữ nguyên audio cũ nếu information không thay đổi
            const existingAudio = await db.query(
              'SELECT audio_url FROM heritage_translations WHERE heritage_id = $1 AND lang = $2',
              [id, lang.code]
            );
            audioUrl = existingAudio.rows[0]?.audio_url || null;
          }

          // Upsert translation
          await db.query(
            `INSERT INTO heritage_translations (heritage_id, lang, name, information, audio_url)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (heritage_id, lang) DO UPDATE SET
               name = EXCLUDED.name,
               information = EXCLUDED.information,
               audio_url = EXCLUDED.audio_url`,
            [id, lang.code, translatedName, translatedInfo, audioUrl]
          );

          console.log(`[Heritage] Updated translation: ${lang.code}`);
        } catch (err) {
          console.error(`[Error] Processing ${lang.code}:`, err.message);
        }
      }
    } else {
      console.log(`[Update] No content changes, skipping translations`);
    }

    return { id };
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

    // Get media count for each heritage
    const heritageIds = result.rows.map(row => row.id);
    let mediaCounts = {};
    
    if (heritageIds.length > 0) {
      const mediaCountResult = await db.query(
        `SELECT heritage_id, 
                COUNT(*) FILTER (WHERE media_type = 'image') as image_count,
                COUNT(*) FILTER (WHERE media_type = 'youtube') as youtube_count
         FROM heritage_media 
         WHERE heritage_id = ANY($1)
         GROUP BY heritage_id`,
        [heritageIds]
      );
      
      mediaCountResult.rows.forEach(row => {
        mediaCounts[row.heritage_id] = {
          images: parseInt(row.image_count),
          videos: parseInt(row.youtube_count)
        };
      });
    }

    return {
      data: result.rows.map(row => ({
        ...row,
        image_url: row.image_url ? BASE_URL + row.image_url : null,
        audio_url: row.audio_url ? BASE_URL + row.audio_url : null,
        media_count: mediaCounts[row.id] || { images: 0, videos: 0 }
      })),
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

    // Lấy tất cả media (gallery images + YouTube links)
    const mediaResult = await db.query(
      `SELECT id, media_type, media_url, display_order
       FROM heritage_media
       WHERE heritage_id = $1
       ORDER BY display_order ASC`,
      [id]
    );

    const heritage = result.rows[0];

    // Separate media by type
    const gallery = [];
    const youtubeLinks = [];

    mediaResult.rows.forEach(media => {
      if (media.media_type === 'image') {
        gallery.push({
          id: media.id,
          url: BASE_URL + media.media_url,
          order: media.display_order
        });
      } else if (media.media_type === 'youtube') {
        youtubeLinks.push({
          id: media.id,
          url: media.media_url,
          order: media.display_order
        });
      }
    });

    return {
      ...heritage,
      image_url: heritage.image_url ? BASE_URL + heritage.image_url : null,
      audio_url: heritage.audio_url ? BASE_URL + heritage.audio_url : null,
      available_languages: langsResult.rows.map(r => r.lang),
      gallery: gallery,
      youtube_links: youtubeLinks
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
    const media = await db.query(
      'SELECT media_type, media_url FROM heritage_media WHERE heritage_id = $1',
      [id]
    );

    // Xóa DB (cascade sẽ xóa translations và media)
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

    // Xóa gallery images (YouTube links không cần xóa file)
    for (const m of media.rows) {
      if (m.media_type === 'image' && m.media_url) {
        try {
          await fs.unlink(path.join(__dirname, '../..', m.media_url));
        } catch (e) {
          console.error(`Failed to delete media: ${m.media_url}`);
        }
      }
    }

    return true;
  }
}

module.exports = new HeritageService();