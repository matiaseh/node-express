import { Schema, model } from 'mongoose';

const discSchema = new Schema(
  {
    manufacturer: { type: String, required: true },
    name: { type: String, required: true },
    speed: { type: Number, required: true },
    glide: { type: Number, required: true },
    turn: { type: Number, required: true },
    fade: { type: Number, required: true },
  },
  {
    collection: 'discdata',
  }
);

const Disc = model('Disc', discSchema);
export default Disc;
