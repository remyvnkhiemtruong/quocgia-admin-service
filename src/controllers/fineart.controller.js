// src/controllers/fineart.controller.js
const fineArtService = require('../services/fineart.service');

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

const fineArtController = {
  async getAll(req, res) {
    try {
      let page = parseInt(req.query.page, 10);
      let limit = parseInt(req.query.limit, 10);
      if (Number.isNaN(page) || page < 1) page = 1;
      if (Number.isNaN(limit) || limit < 1) limit = 10;
      const result = await fineArtService.getAll(page, limit);
      res.json(result);
    } catch (error) {
      if (isEmptyTableError(error)) {
        return res.json({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
      }
      console.error('[FineArt] GetAll error:', error.message || error);
      return res.json({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
    }
  },

  async getById(req, res) {
    try {
      const idNum = parseId(req.params.id);
      if (idNum === null) {
        return res.status(400).json({ message: 'Invalid fine art ID', error: 'Invalid fine art ID' });
      }
      const result = await fineArtService.getById(idNum);
      if (!result) {
        return res.status(404).json({ message: 'Fine art not found', error: 'Fine art not found' });
      }
      res.json(result);
    } catch (error) {
      console.error('GetById error:', error);
      res.status(500).json({ message: error.message, error: error.message });
    }
  }
};

module.exports = fineArtController;