import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true }, // phone or simple id
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["owner", "worker"], required: true },
  name: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("User", userSchema);