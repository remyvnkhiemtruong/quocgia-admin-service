// src/controllers/map-place.controller.js
const mapPlaceService = require('../services/map-place.service');

function isEmptyTableError(err) {
  const msg = (err && err.message) ? String(err.message) : '';
  const code = err && err.code;
  return code === '42P01' || /relation .* does not exist/i.test(msg);
}

function parseId(id) {
  if (id === '' || id === undefined || id === null) return null;
  const n = parseInt(id, 10);
  return (Number.isNaN(n) || n < 1) ? null : n;
}

const mapPlaceController = {
  async getAllPublic(req, res) {
    try {
      const data = await mapPlaceService.getAll();
      res.json({ success: true, data });
    } catch (error) {
      if (isEmptyTableError(error)) {
        return res.json({ success: true, data: [] });
      }
      console.error('[MapPlace] getAllPublic error:', error);
      res.status(500).json({ success: false, message: error.message, error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const data = await mapPlaceService.getAll();
      res.json({ success: true, data });
    } catch (error) {
      console.error('[MapPlace] getAll error:', error.message || error);
      return res.json({ success: true, data: [] });
    }
  },

  async getById(req, res) {
    try {
      const idNum = parseId(req.params.id);
      if (idNum === null) {
        return res.status(400).json({ success: false, message: 'Invalid map place ID', error: 'Invalid map place ID' });
      }
      const result = await mapPlaceService.getById(idNum);
      if (!result) {
        return res.status(404).json({ success: false, message: 'Map place not found', error: 'Map place not found' });
      }
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('[MapPlace] getById error:', error);
      res.status(500).json({ success: false, message: error.message, error: error.message });
    }
  },

  async create(req, res) {
    try {
      const result = await mapPlaceService.create(req.body, req.files);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Địa điểm bản đồ đã thêm',
      });
    } catch (error) {
      console.error('[MapPlace] create error:', error);
      res.status(500).json({ success: false, message: error.message, error: error.message });
    }
  },

  async update(req, res) {
    try {
      const idNum = parseId(req.params.id);
      if (idNum === null) {
        return res.status(400).json({ success: false, message: 'Invalid map place ID', error: 'Invalid map place ID' });
      }
      const result = await mapPlaceService.update(idNum, req.body, req.files);
      res.json({
        success: true,
        data: result,
        message: 'Đã cập nhật địa điểm',
      });
    } catch (error) {
      console.error('[MapPlace] update error:', error);
      res.status(500).json({ success: false, message: error.message, error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const idNum = parseId(req.params.id);
      if (idNum === null) {
        return res.status(400).json({ success: false, message: 'Invalid map place ID', error: 'Invalid map place ID' });
      }
      await mapPlaceService.delete(idNum);
      res.json({ success: true, message: 'Đã xóa địa điểm' });
    } catch (error) {
      console.error('[MapPlace] delete error:', error);
      res.status(500).json({ success: false, message: error.message, error: error.message });
    }
  },
};

module.exports = mapPlaceController;
