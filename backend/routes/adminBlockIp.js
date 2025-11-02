// backend/routes/adminBlockIp.js
const express = require('express');
const BlockedIP = require('../models/BlockedIP');
const { adminAuth } = require('../middleware/adminAuth');
const router = express.Router();
const { validateInput } = require('../middleware/auth');
const { blockIpSchema } = require('../utils/validationSchemas');

// Get all blocked IPs
router.get('/blocked-ips', adminAuth, async (req, res) => {
  const ips = await BlockedIP.find().sort({ blockedAt: -1 });
  res.json(ips);
});

// Block an IP
router.post('/block-ip', adminAuth, validateInput(blockIpSchema), async (req, res, next) => {
  try {
    const { ip, reason } = req.body;
    await BlockedIP.updateOne({ ip }, { ip, reason }, { upsert: true });
    res.json({ message: 'IP blocked' });
  } catch (error) {
    next(error);
  }
});

// Unblock an IP
router.delete('/block-ip/:ip', adminAuth, async (req, res, next) => {
  try {
    const { ip } = req.params;
    await BlockedIP.deleteOne({ ip });
    res.json({ message: 'IP unblocked' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
