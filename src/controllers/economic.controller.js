// src/controllers/music.controller.js
const economicService = require('../services/economic.service');

const economicController = {
  // Danh sách 
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await economicService.getAll(+page, +limit);
      res.json(result);
    } catch (error) {
      console.error('GetAll error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Chi tiết 
  async getById(req, res) {
    try {
      const result = await economicService.getById(req.params.id);
      
      if (!result) {
        return res.status(404).json({ error: 'music not found' });
      }
      
      res.json(result);
    } catch (error) {
      console.error('GetById error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = economicController;