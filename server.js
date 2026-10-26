const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

mongoose.connect('mongodb://127.0.0.1:27017/assignmentTracker')
.then(() => console.log('MongoDB Connected - NEW SERVER LOADED'))
.catch(err => console.log(err));

// FORCE DELETE OLD CACHED MODEL

const userSchema = new mongoose.Schema({
  name: String,
  studentId: String,
  email: String,
  password: String
});
const User = mongoose.model('User', userSchema);
console.log('Using schema:', Object.keys(userSchema.paths));

app.post('/api/register', async (req, res) => {
  try {
    console.log('Trying to register:', req.body);
    const { name, studentId, email, password } = req.body;
    const check = await User.findOne({ email });
    if(check) return res.status(400).json({ message: 'Email exists' });
    const hashed = await bcrypt.hash(password, 10);
    const u = new User({ name, studentId, email, password: hashed });
    await u.save();
    console.log('SAVED SUCCESSFULLY:', email);
    res.json({ message: 'ok' });
  } catch(e) {
    console.log('ERROR:', e.message);
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/login', async (req,res) => {
  try{
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ message: 'User not found' });
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(400).json({ message: 'Wrong password' });
    res.json({ message: 'ok', name: user.name, email: user.email });
  } catch(e){ res.status(500).json({ message: e.message }); }
});

app.listen(3000, () => console.log('Server on 3000'));