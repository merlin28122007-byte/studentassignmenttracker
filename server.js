const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// ✅ FIX FOR VERCEL - CACHED CONNECTION
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    const MONGO_URL = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL;
    console.log("MONGO_URL found:", !!MONGO_URL);
    if (!MONGO_URL) throw new Error("No MONGO URL found in env");
    
    cached.promise = mongoose.connect(MONGO_URL, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    }).then(m => m);
  }
  cached.conn = await cached.promise;
  console.log('MongoDB Connected - CACHED');
  return cached.conn;
}

// Connect immediately
connectDB().catch(e => console.log("DB Error:", e.message));

// ✅ FIX MODEL CACHING
const userSchema = new mongoose.Schema({
  name: String,
  studentId: String,
  email: String,
  password: String
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

app.post('/api/register', async (req, res) => {
  try {
    await connectDB(); // Ensure connected before every request
    const { name, studentId, email, password } = req.body;
    const check = await User.findOne({ email });
    if(check) return res.status(400).json({ message: 'Email exists' });
    const hashed = await bcrypt.hash(password, 10);
    const u = new User({ name, studentId, email, password: hashed });
    await u.save();
    res.json({ message: 'ok' });
  } catch(e) {
    console.log('REGISTER ERROR:', e.message);
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/login', async (req,res) => {
  try{
    await connectDB();
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ message: 'User not found' });
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(400).json({ message: 'Wrong password' });
    res.json({ message: 'ok', name: user.name, email: user.email });
  } catch(e){ 
    console.log('LOGIN ERROR:', e.message);
    res.status(500).json({ message: e.message }); 
  }
});

module.exports = app;