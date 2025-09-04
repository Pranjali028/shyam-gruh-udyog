import mongoose from "mongoose";

const settingSchema = new mongoose.Schema({
  ratePerHour: { type: Number, default: 30 },
  factoryLat: Number,
  factoryLng: Number,
  radiusM: { type: Number, default: 50 }
}, { timestamps: true });

export default mongoose.model("Setting", settingSchema);