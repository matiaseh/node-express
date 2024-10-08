import express from 'express';
import { uploadImages } from '../uploadImages.js';
import Post from '../model/Post.js';
import Disc from '../model/Disc.js';
import verify from './verifyToken.js';
const router = express.Router();

router.use(verify);

// Create a new post
router.post('/create', uploadImages, async (req, res) => {
  try {
    const { title, discId, price, description } = req.body;
    const user_id = req.user._id;

    const disc = await Disc.findById(discId);
    if (!disc) {
      return res.status(404).json({ message: 'Disc not found' });
    }

    // Validate required fields
    if (!title || !discId || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newPost = new Post({
      title,
      disc: disc,
      price: price,
      description: description,
      images: req.fileUrls || [],
      user: user_id,
    });

    // Save to DB
    await newPost.save();

    res.status(201).json({
      message: 'Post created successfully!',
      post: newPost,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to create post',
      error: err.message,
    });
  }
});

// Get all posts from all users
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('disc')
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .exec();

    if (posts.length === 0) {
      return res.status(404).json({ message: 'No posts found' });
    }

    res.status(200).json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching posts', error: error.message });
  }
});

// Get all posts from me
router.get('/me', verify, async (req, res) => {
  const userId = req.user._id;

  try {
    const posts = await Post.find({ user: userId })
      .populate('disc')
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .exec();

    if (posts.length === 0) {
      return res.status(404).json({ message: 'No posts found for this user' });
    }

    res.status(200).json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching posts', error: error.message });
  }
});

// Get all posts by a specific user
router.get('/users/:user_id', verify, async (req, res) => {
  const { user_id } = req.params;

  try {
    const posts = await Post.find({ user: user_id })
      .populate('disc')
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .exec();

    if (posts.length === 0) {
      return res.status(404).json({ message: 'No posts found for this user' });
    }

    res.status(200).json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching posts', error: error.message });
  }
});

// Get a specific post by post ID
router.get('/:postId', verify, async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    return res.status(400).json({ message: 'Post ID is required' });
  }

  try {
    const post = await Post.findById(postId)
      .populate('disc')
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .exec();

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching post', error: error.message });
  }
});

export default router;
