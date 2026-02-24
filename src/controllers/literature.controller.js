// src/controllers/music.controller.js
const literatureService = require('../services/literature.service');

const literatureController = {
  // Danh sách 
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await literatureService.getAll(+page, +limit);
      res.json(result);
    } catch (error) {
      console.error('GetAll error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Chi tiết 
  async getById(req, res) {
    try {
      const result = await literatureService.getById(req.params.id);
      
      if (!result) {
        return res.status(404).json({ error: 'literature not found' });
      }
      
      res.json(result);
    } catch (error) {
      console.error('GetById error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = literatureController;