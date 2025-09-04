import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  checkinAt: { type: Date, required: true },
  checkinLat: Number,
  checkinLng: Number,
  checkoutAt: Date,
  checkoutLat: Number,
  checkoutLng: Number,
  hours: Number,
  pay: Number
}, { timestamps: true });

export default mongoose.model("Session", sessionSchema);