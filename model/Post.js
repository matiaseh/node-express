import { Schema, model } from 'mongoose';

const flightNumbersSchema = new Schema({
  speed: { type: Number, required: true },
  glide: { type: Number, required: true },
  turn: { type: Number, required: true },
  fade: { type: Number, required: true },
});

const postSchema = new Schema({
  title: { type: String, required: true },
  flightNumbers: {
    type: flightNumbersSchema,
    required: true,
  },
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
