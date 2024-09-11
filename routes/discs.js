import express from 'express';
import Disc from '../model/Disc.js';

const router = express.Router();

// GET all items from the collection
router.get('/', async (req, res) => {
  try {
    const items = await Disc.find();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

export default router;
