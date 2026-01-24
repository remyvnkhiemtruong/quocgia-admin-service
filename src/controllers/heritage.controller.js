// src/controllers/heritage.controller.js
const heritageService = require('../services/heritage.service');

const heritageController = {
  // Danh sách theo ngôn ngữ
  async getAll(req, res) {
    try {
      const { lang = 'vi', page = 1, limit = 10 } = req.query;
      const result = await heritageService.getAll(lang, +page, +limit);
      res.json(result);
    } catch (error) {
      console.error('GetAll error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Chi tiết theo ngôn ngữ
  async getById(req, res) {
    try {
      const { lang = 'vi' } = req.query;
      const result = await heritageService.getById(req.params.id, lang);
      
      if (!result) {
        return res.status(404).json({ error: 'Heritage not found' });
      }
      
      res.json(result);
    } catch (error) {
      console.error('GetById error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = heritageController;