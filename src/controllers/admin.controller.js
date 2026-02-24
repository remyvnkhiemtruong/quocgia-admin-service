// src/controllers/admin.controller.js
const heritageService = require('../services/heritage.service');
const musicService = require('../services/music.service');
const fineArtService = require('../services/fineart.service');
const economicService = require('../services/economic.service');
const geographyService = require('../services/geography.service');
const literatureService = require('../services/literature.service');

const adminController = {
  // Tạo mới
  async create(req, res) {
    try {
      console.log('[Admin Controller] Creating heritage...');
      console.log('Body:', req.body);
      console.log('Files:', {
        image: req.files?.image?.length || 0,
        audio: req.files?.audio?.length || 0,
        gallery: req.files?.gallery?.length || 0
      });

      const result = await heritageService.create(req.body, req.files);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Heritage created successfully'
      });
    } catch (error) {
      console.error('[Admin Controller] Create error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Danh sách (admin - không cần lang)
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await heritageService.getAll('vi', +page, +limit);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('[Admin Controller] GetAll error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Chi tiết
  async getById(req, res) {
    try {
      const result = await heritageService.getById(req.params.id, 'vi');
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Heritage not found'
        });
      }
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('[Admin Controller] GetById error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Cập nhật
  async update(req, res) {
    try {
      const { id } = req.params;

      console.log('[Admin Controller] Updating heritage:', id);
      console.log('Body:', req.body);
      console.log('Files:', {
        image: req.files?.image?.length || 0,
        audio: req.files?.audio?.length || 0,
        gallery: req.files?.gallery?.length || 0
      });

      // Kiểm tra heritage tồn tại
      const existing = await heritageService.getById(id, 'vi');
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Heritage not found'
        });
      }

      const result = await heritageService.update(id, req.body, req.files);

      res.json({
        success: true,
        data: result,
        message: 'Heritage updated successfully'
      });
    } catch (error) {
      console.error('[Admin Controller] Update error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Xóa
  async delete(req, res) {
    try {
      const { id } = req.params;

      console.log('[Admin Controller] Deleting heritage:', id);

      // Kiểm tra heritage tồn tại
      const existing = await heritageService.getById(id, 'vi');
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Heritage not found'
        });
      }

      await heritageService.delete(id);

      res.json({
        success: true,
        message: 'Heritage deleted successfully'
      });
    } catch (error) {
      console.error('[Admin Controller] Delete error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  // ===============================
  // MUSIC MANAGEMENT
  // ===============================

  // Tạo nhiều music link
  async createMusic(req, res) {
    try {
      console.log('[Admin Controller] Creating music...');
      console.log('Body:', req.body);

      const { links } = req.body;

      if (!links || !Array.isArray(links) || links.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Links phải là một mảng youtube_url'
        });
      }

      // Validate YouTube links
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]{11}$/;
      const invalidLinks = links.filter(link => !youtubeRegex.test(link));
      if (invalidLinks.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Có link YouTube không hợp lệ',
          invalidLinks
        });
      }

      const result = await musicService.createMany(links);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Music created successfully'
      });

    } catch (error) {
      console.error('[Admin Controller] CreateMusic error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },


  // Lấy danh sách music
  async getAllMusic(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await musicService.getAll(+page, +limit);
      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('[Admin Controller] GetAllMusic error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },


  // Lấy chi tiết 1 music
  async getMusicById(req, res) {
    try {
      const { id } = req.params;

      const result = await musicService.getById(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Music not found'
        });
      }

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[Admin Controller] GetMusicById error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },


  // Cập nhật 1 music
  async updateMusic(req, res) {
    try {
      const { id } = req.params;
      const { youtube_url, title } = req.body;

      const existing = await musicService.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Music not found'
        });
      }

      const result = await musicService.update(id, {
        youtube_url,
        title
      });

      res.json({
        success: true,
        data: result,
        message: 'Music updated successfully'
      });

    } catch (error) {
      console.error('[Admin Controller] UpdateMusic error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },


  // Xóa music
  async deleteMusic(req, res) {
    try {
      const { id } = req.params;

      const existing = await musicService.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Music not found'
        });
      }

      await musicService.delete(id);

      res.json({
        success: true,
        message: 'Music deleted successfully'
      });

    } catch (error) {
      console.error('[Admin Controller] DeleteMusic error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  // ===============================
  // FINE ART MANAGEMENT
  // ===============================

  // Tạo fineart (upload nhiều ảnh)
  async createfineArt(req, res) {
    try {
      console.log('[Admin Controller] Creating fineart...');
      console.log('Files:', req.files?.fineart?.length || 0);

      if (!req.files || !req.files.fineart || req.files.fineart.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng upload ít nhất một ảnh'
        });
      }

      const files = req.files.fineart;

      // Tạo url cho từng file
      const fineartUrls = files.map(file => {
        return `/uploads/fineart/${file.filename}`;
      });

      const result = await fineArtService.createMany(fineartUrls);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Fineart uploaded successfully'
      });

    } catch (error) {
      console.error('[Admin Controller] CreateFineArt error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Lấy danh sách fineart
  async getAllfineArt(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const result = await fineArtService.getAll(+page, +limit);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('[Admin Controller] GetAllFineArt error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Lấy chi tiết 1 fineart
  async getfineArtById(req, res) {
    try {
      const { id } = req.params;

      const result = await fineArtService.getById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Fineart not found'
        });
      }

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[Admin Controller] GetFineArtById error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Xóa fineart
  async deletefineArt(req, res) {
    try {
      const { id } = req.params;

      const existing = await fineArtService.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Fineart not found'
        });
      }

      await fineArtService.delete(id);

      res.json({
        success: true,
        message: 'Fineart deleted successfully'
      });

    } catch (error) {
      console.error('[Admin Controller] DeleteFineArt error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // ===============================
  // ECONOMICS MANAGEMENT
  // ===============================

  // Create economic data
  async createEconomic(req, res) {
    try {
      console.log('[Admin Controller] Creating economic data...');
      console.log('Body:', req.body);

      const {
        title,
        sector,
        content,
        analysis_text,
        source,
        distributions = []
      } = req.body;

      if (!title || !sector || !content) {
        return res.status(400).json({
          success: false,
          error: 'title, sector, content là bắt buộc'
        });
      }

      if (!Array.isArray(distributions)) {
        return res.status(400).json({
          success: false,
          error: 'distributions phải là một mảng'
        });
      }

      const result = await economicService.create(req.body);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Economic data created successfully'
      });

    } catch (error) {
      console.error('[Admin Controller] CreateEconomic error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get all economic data (admin)
  async getAllEconomic(req, res) {
    try {
      const { page = 1, limit = 10, sector } = req.query;

      const result = await economicService.getAll({
        page: +page,
        limit: +limit,
        sector
      });

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('[Admin Controller] GetAllEconomic error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get economic data by ID
  async getEconomicById(req, res) {
    try {
      const { id } = req.params;

      const result = await economicService.getById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Economic data not found'
        });
      }

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[Admin Controller] GetEconomicById error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update economic data
  async updateEconomic(req, res) {
    try {
      const { id } = req.params;
      console.log('[Admin Controller] Updating economic data:', id);
      console.log('Body:', req.body);

      const existing = await economicService.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Economic data not found'
        });
      }

      const result = await economicService.update(id, req.body);

      res.json({
        success: true,
        data: result,
        message: 'Economic data updated successfully'
      });

    } catch (error) {
      console.error('[Admin Controller] UpdateEconomic error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete economic data
  async deleteEconomic(req, res) {
    try {
      const { id } = req.params;
      console.log('[Admin Controller] Deleting economic data:', id);

      const existing = await economicService.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Economic data not found'
        });
      }

      await economicService.delete(id);

      res.json({
        success: true,
        message: 'Economic data deleted successfully'
      });

    } catch (error) {
      console.error('[Admin Controller] DeleteEconomic error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // ===============================
  // GEOGRAPHY MANAGEMENT
  // ===============================

  // Create geography
  async createGeography(req, res) {
    try {
      const {
        title,
        region,
        terrain,
        area,
        content,
        image_url
      } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          error: 'title là bắt buộc'
        });
      }

      const result = await geographyService.create({
        title,
        region,
        terrain,
        area,
        content,
        image_url
      });

      res.status(201).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  },

  // Get all geography (admin)
  async getAllGeography(req, res) {
    try {
      const { page = 1, limit = 10, terrain_type } = req.query;

      const result = await geographyService.getAll({
        page: +page,
        limit: +limit,
        terrain_type
      });

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('[Admin Controller] GetAllGeography error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get geography by ID
  async getGeographyById(req, res) {
    try {
      const { id } = req.params;

      const result = await geographyService.getById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Geography data not found'
        });
      }

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[Admin Controller] GetGeographyById error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update geography
  async updateGeography(req, res) {
    try {
      const { id } = req.params;

      console.log('[Admin Controller] Updating geography:', id);
      console.log('Body:', req.body);

      const existing = await geographyService.getById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Geography data not found'
        });
      }

      const result = await geographyService.update(id, req.body);

      res.json({
        success: true,
        data: result,
        message: 'Geography data updated successfully'
      });

    } catch (error) {
      console.error('[Admin Controller] UpdateGeography error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete geography
  async deleteGeography(req, res) {
    try {
      const { id } = req.params;

      console.log('[Admin Controller] Deleting geography:', id);

      const existing = await geographyService.getById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Geography data not found'
        });
      }

      await geographyService.delete(id);

      res.json({
        success: true,
        message: 'Geography data deleted successfully'
      });

    } catch (error) {
      console.error('[Admin Controller] DeleteGeography error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },


  // ===============================
  // LITERATURE MANAGEMENT
  // ===============================
  // Create literature
  async createLiterature(req, res) {
    try {
      console.log(req.body);
      const {
        title,
        author,
        content,
        genre,
        period,
        image_url,
      } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          error: 'title là bắt buộc'
        });
      }

      const result = await literatureService.create(req.body);

      res.status(201).json({
        success: true,
        data: result
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  },

  // Get all geography (admin)
  async getAllLiterature(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const result = await literatureService.getAll({
        page: +page,
        limit: +limit,
      });

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('[Admin Controller] GetAllLiterature error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get geography by ID
  async getLiteratureById(req, res) {
    try {
      const { id } = req.params;

      const result = await literatureService.getById(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Literature data not found'
        });
      }

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('[Admin Controller] GetLiteratureById error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Update geography
  async updateLiterature(req, res) {
    try {
      const { id } = req.params;

      console.log('[Admin Controller] Updating literature:', id);
      console.log('Body:', req.body);

      const existing = await literatureService.getById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Literature data not found'
        });
      }

      const result = await literatureService.update(id, req.body);

      res.json({
        success: true,
        data: result,
        message: 'Literature data updated successfully'
      });

    } catch (error) {
      console.error('[Admin Controller] UpdateLiterature error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Delete literature
  async deleteLiterature(req, res) {
    try {
      const { id } = req.params;

      console.log('[Admin Controller] Deleting literature:', id);

      const existing = await literatureService.getById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'literature data not found'
        });
      }

      await literatureService.delete(id);

      res.json({
        success: true,
        message: 'literature data deleted successfully'
      });

    } catch (error) {
      console.error('[Admin Controller] Deleteliterature error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },



};

module.exports = adminController;