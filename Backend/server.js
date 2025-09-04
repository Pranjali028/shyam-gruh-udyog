import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";


import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(`__filename`);

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../Frontend"))); 

// Root route -> index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname,"../Frontend", "index.html"));
});

console.log("Mongo URI from env:", process.env.MONGO_URI);

// ---------- DB CONNECTION ----------
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------- SCHEMAS & MODELS ----------
const WorkerSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  role: { type: String, default: "worker" },
});

const SettingSchema = new mongoose.Schema({
  rate: Number,
  lat: Number,
  lng: Number,
  radius: Number,
});

const ReportSchema = new mongoose.Schema({
  worker: String,
  hours: Number,
  pay: Number,
  date: { type: Date, default: Date.now },
});

const CheckSchema = new mongoose.Schema({
  worker: String,
  checkin: Date,
  checkout: { type: Date, default: null },
});

const Worker  = mongoose.model("Worker", WorkerSchema);
const Setting = mongoose.model("Setting", SettingSchema);
const Report  = mongoose.model("Report", ReportSchema);
const Check   = mongoose.model("Check", CheckSchema);

// ---------- CONSTS ----------
// Owners from .env → OWNER_ACCOUNTS=saurav:2233,shubham:4455
const ownerAccounts = process.env.OWNER_ACCOUNTS.split(",").map(acc => {
  const [user, pass] = acc.split(":");
  return { user, pass };
});

// Workers from .env → WORKER_ACCOUNTS=ram:111,shyam:222
const workerAccounts = process.env.WORKER_ACCOUNTS.split(",").map(acc => {
  const [user, pass] = acc.split(":");
  return { user, pass };
});

// ---------- LOGIN ----------
app.post("/api/login", async (req, res) => {
  const {role, username, password } = req.body;

  // ---- Owner Login ----
  if (role === "owner") {
    const match = ownerAccounts.find(acc => acc.user === username && acc.pass === password);
    if (match) {
      return res.json({ success: true, role: "owner", username });
    }
    return res.status(401).json({ success: false, message: "Invalid owner credentials" });
  }

  // ---- Worker Login ----
  if (role === "worker") {
    // First check .env workers
    const match = workerAccounts.find(acc => acc.user === username && acc.pass === password);
    if (match) {
      return res.json({ success: true, role: "worker", username });
    }

    // If not found → check MongoDB workers
    const worker = await Worker.findOne({ username, password });
    if (worker) {
      return res.json({ success: true, role: "worker", workerId: worker._id });
    }

    return res.status(401).json({ success: false, message: "Invalid worker credentials" });
  }

  res.status(400).json({ success: false, message: "Invalid role" });
});

// ---------- OTHER ROUTES (unchanged) ----------
// Save settings (owner)
app.post("/api/settings", async (req, res) => {
  try {
    const { rate, lat, lng, radius } = req.body;
    const payload = {
      rate: Number(rate),
      lat: Number(lat),
      lng: Number(lng),
      radius: Number(radius),
    };

    const saved = await Setting.findOneAndUpdate({}, payload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    res.json({ success: true, message: "Settings saved", data: saved });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to save settings" });
  }
});

// Add worker
app.post("/api/workers", async (req, res) => {
  try {
    const worker = await Worker.create(req.body);
    res.json({ success: true, message: "Worker added", data: worker });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to add worker" });
  }
});

// Get workers
app.get("/api/workers", async (_req, res) => {
  try {
    const workers = await Worker.find({}).sort({ name: 1 });
    res.json(workers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to load workers" });
  }
});

// Worker checkin
app.post("/api/checkin", async (req, res) => {
  const { worker } = req.body;
  const check = new Check({ worker, checkin: new Date() });
  await check.save();
  res.json({ success: true, message: "Checked in" });
});

// Worker checkout
app.post("/api/checkout", async (req, res) => {
  const { worker } = req.body;
  const check = await Check.findOne({ worker, checkout: null });
  if (!check) return res.json({ success: false, message: "Not checked in" });

  check.checkout = new Date();
  await check.save();

  const hours = (check.checkout - check.checkin) / (1000 * 60 * 60);
  const settings = await Setting.findOne({});
  const rate = settings?.rate || 100;
  const pay = hours * rate;

  const report = new Report({ worker, hours, pay });
  await report.save();

  res.json({ success: true, message:` Checked out, Pay: ₹${pay}` });
});

// Owner reports
app.get("/api/reports", async (_req, res) => {
  try {
    const reports = await Report.find({}).sort({ date: -1 });
    const total = reports.reduce((sum, r) => sum + (r.pay || 0), 0);
    res.json({ reports, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to load reports" });
  }
});

// Worker self reports
app.get("/api/reports/self", async (req, res) => {
  try {
    const { worker } = req.query;
    const reports = await Report.find({ worker }).sort({ date: -1 });
    res.json(reports);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to load self reports" });
  }
});

// ---------- START ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);