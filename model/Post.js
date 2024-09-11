import { Schema, model } from 'mongoose';

const postSchema = new Schema({
  title: { type: String, required: true },
  disc: {
    type: Schema.Types.ObjectId,
    ref: 'Disc',
    required: true,
  },
  price: { type: String, required: true },
  description: { type: String, required: false },
  images: {
    type: [String],
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = model('Post', postSchema);
export default Post;
