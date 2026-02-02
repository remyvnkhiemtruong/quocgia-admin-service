// src/controllers/admin.controller.js
const heritageService = require('../services/heritage.service');

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
  }
};

module.exports = adminController;